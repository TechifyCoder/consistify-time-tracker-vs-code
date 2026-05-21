import * as vscode from 'vscode';
import { HeartbeatPayload } from './api';
import { cachePendingBatch, flushPendingBatches, getPendingCount } from './storage';
import { getApiKey } from './auth';

const IDLE_THRESHOLD_MS = 120_000;   // 2 minutes of inactivity → flush to local cache
const MIN_FLUSH_DURATION_S = 5;      // Ignore batches shorter than 5 seconds (noise)
const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export type PulseSource = 'typing' | 'scroll' | 'selection' | 'file-switch' | 'terminal-focus' | 'window-focus' | 'ai-paste';

interface ActivityWindow {
    startTime: number;
    score: number;
    durationMs: number;
    isAiBypass?: boolean;
}

/**
 * HeartbeatController batches user activity and periodically flushes
 * heartbeat data to the Consistify server (or offline cache on failure).
 */
export class HeartbeatController implements vscode.Disposable {
    private readonly context: vscode.ExtensionContext;
    private idleTimer: ReturnType<typeof setTimeout> | undefined;

    // Core Tracking State
    private batchStartTime: number | undefined;
    private lastPulseTime: number | undefined;
    private currentDoc: vscode.TextDocument | undefined;
    private readonly disposables: vscode.Disposable[] = [];

    // Periodic Sync
    private syncTimer: ReturnType<typeof setInterval>;

    // Anti-Cheat: Activity Scoring
    private currentWindow: ActivityWindow | undefined;
    private recentWindows: ActivityWindow[] = [];
    private readonly WINDOW_SIZE_MS = 5 * 60 * 1000; // 5 mins
    private readonly LOW_ACTIVITY_THRESHOLD = 15;
    private readonly MAX_CONSECUTIVE_LOW = 5; // 25 mins of low activity = discard

    // Anti-Cheat: Terminal Passive Cap
    private lastActiveInputTime: number = Date.now();
    private readonly PASSIVE_CAP_MS = 10 * 60 * 1000; // 10 mins

    constructor(context: vscode.ExtensionContext) {
        this.context = context;

        const focusWatcher = vscode.window.onDidChangeWindowState((state) => {
            if (!state.focused) {
                this.flush('window-blur').then(() => {
                    this.syncBatchToServer();
                });
            } else {
                this.syncBatchToServer();
            }
        });

        this.syncTimer = setInterval(() => {
            console.log('[Consistify] 15-minute periodic sync triggered.');
            this.flush('periodic-sync').then(() => {
                this.syncBatchToServer();
            });
        }, SYNC_INTERVAL_MS);

        this.disposables.push(focusWatcher);
        console.log('[Consistify] HeartbeatController initialized.');
    }

    pulse(source: PulseSource | 'save', doc?: vscode.TextDocument): void {
        const now = Date.now();

        // 1. Terminal Passive Cap Check 
        if (source === 'terminal-focus') {
            if (now - this.lastActiveInputTime > this.PASSIVE_CAP_MS) {
                // Ignore terminal focus if user hasn't actively typed/clicked in 10 minutes
                return;
            }
        } else if (source !== 'scroll') {
            // Typing, selection, file-switch, window-focus all count as deliberate active input
            this.lastActiveInputTime = now;
        }

        // 2. Activity Scoring Logic
        this.processActivityScore(source, now);

        // 3. Document / Batch Lifecycle
        if (doc) {
            if (this.currentDoc && this.currentDoc.languageId !== doc.languageId) {
                this.flush('language-change');
            }

            if (this.batchStartTime === undefined) {
                this.batchStartTime = now;
                this.currentDoc = doc;
            } else if (this.currentDoc === undefined) {
                // If the batch started without a doc (e.g., from window focus), set it now
                this.currentDoc = doc;
            }
        } else if (this.batchStartTime === undefined) {
            // Terminal focus without a document - start generic batch
            this.batchStartTime = now;
        }

        this.lastPulseTime = now;

        if (source === 'save') {
            this.flush('document-save');
            return;
        }

        this.resetIdleTimer();
    }

    private processActivityScore(source: PulseSource | 'save', now: number) {
        if (!this.currentWindow || now - this.currentWindow.startTime >= this.WINDOW_SIZE_MS) {
            // Push old window, start new one
            if (this.currentWindow) {
                this.recentWindows.push(this.currentWindow);
                if (this.recentWindows.length > this.MAX_CONSECUTIVE_LOW) {
                    this.recentWindows.shift(); // keep only last N windows
                }
            }
            this.currentWindow = { startTime: now, score: 0, durationMs: 0 };
        }

        // Score Assignment
        switch (source) {
            case 'ai-paste':
                this.currentWindow.score += 100; // instant bypass
                this.currentWindow.isAiBypass = true;
                break;
            case 'typing':
                this.currentWindow.score += 2;
                break;
            case 'selection':
            case 'file-switch':
                this.currentWindow.score += 1;
                break;
            case 'terminal-focus':
                // terminal grants minor passive points, but requires active inputs every 10m to sustain
                this.currentWindow.score += 0.5;
                break;
            case 'scroll':
            case 'window-focus':
            case 'save':
                this.currentWindow.score += 1;
                break;
        }
    }

    private resetIdleTimer(): void {
        if (this.idleTimer !== undefined) {
            clearTimeout(this.idleTimer);
        }

        // 5 Minutes Idle Detection
        this.idleTimer = setTimeout(() => {
            console.log('[Consistify] 5m Idle threshold reached — flushing batch.');
            this.flush('idle-timeout');
        }, 300_000);
    }

    public async flush(reason: string): Promise<void> {
        if (this.batchStartTime === undefined || this.lastPulseTime === undefined) {
            return;
        }

        const activeDurationMs = Math.max(1000, this.lastPulseTime - this.batchStartTime + 1000);

        if (this.currentWindow) {
            this.currentWindow.durationMs = Math.min(activeDurationMs, this.WINDOW_SIZE_MS);
            this.recentWindows.push(this.currentWindow);
            this.currentWindow = undefined;
        }

        const durationSeconds = this.calculateValidDuration(activeDurationMs);

        if (this.idleTimer !== undefined) {
            clearTimeout(this.idleTimer);
            this.idleTimer = undefined;
        }

        const docSnapshot = this.currentDoc;
        this.batchStartTime = undefined;
        this.lastPulseTime = undefined;
        this.currentDoc = undefined;
        this.recentWindows = []; // clear window history after flush

        if (durationSeconds < MIN_FLUSH_DURATION_S) {
            return;
        }

        // Safe fallback for language if it was purely terminal activity
        const payload = this.buildPayload(docSnapshot, durationSeconds);
        console.log(`[Consistify] Accumulating ${durationSeconds}s batch locally [${reason}]`);

        await cachePendingBatch(this.context, payload);
    }

    /**
     * Discards time if user failed the anti-cheat activity checks
     */
    private calculateValidDuration(totalDurationMs: number): number {
        if (this.recentWindows.length < this.MAX_CONSECUTIVE_LOW) {
            return Math.round(totalDurationMs / 1000); // Not enough data to penalize
        }

        const isConsecutivelyLow = this.recentWindows.every(w => w.score < this.LOW_ACTIVITY_THRESHOLD && !w.isAiBypass);

        if (isConsecutivelyLow) {
            console.warn('[Consistify] Anti-Cheat: 25+ minutes of low activity detected. Discarding tracked time.');
            return 0; // Discard
        }

        return Math.round(totalDurationMs / 1000);
    }

    private buildPayload(
        doc: vscode.TextDocument | undefined,
        durationSeconds: number
    ): HeartbeatPayload {
        const folders = vscode.workspace.workspaceFolders;
        const projectName =
            folders && folders.length > 0 ? folders[0].name : 'unknown';

        return {
            timestamp: new Date().toISOString(),
            project_name: projectName,
            language: doc ? doc.languageId : 'terminal',
            duration: durationSeconds,
        };
    }

    /**
     * 3. Sync Triggers: Attempts to flush all accumulated local payloads to the server.
     */
    private async syncBatchToServer(): Promise<void> {
        const count = getPendingCount(this.context);
        if (count === 0) {
            return;
        }

        const apiKey = await getApiKey(this.context);
        if (!apiKey) {
            console.warn('[Consistify] No API key set — payloads remain cached locally.');
            return;
        }

        console.log(`[Consistify] Attempting network sync of ${count} payload(s)…`);
        // flushPendingBatches inherently calls sendBatch (which hits the API once) 
        // and safely retains failed ones due to State Recovery constraints.
        await flushPendingBatches(this.context, apiKey);
    }

    dispose(): void {
        // 4. Lifecycle Hook: Implement a final sync attempt within the deactivate() function
        this.flush('extension-deactivate').then(() => {
            this.syncBatchToServer();
        });

        if (this.idleTimer !== undefined) {
            clearTimeout(this.idleTimer);
        }

        if (this.syncTimer !== undefined) {
            clearInterval(this.syncTimer);
        }

        this.disposables.forEach((d) => d.dispose());
        console.log('[Consistify] HeartbeatController disposed.');
    }
}
