import * as vscode from 'vscode';
import { HeartbeatPayload, sendBatch } from './api';

const PENDING_KEY = 'consistify.pendingBatches';
const MAX_CACHED = 500; // Safety cap — avoids unbounded globalState growth

/**
 * Appends a failed payload to the offline cache.
 */
export async function cachePendingBatch(
    context: vscode.ExtensionContext,
    payload: HeartbeatPayload
): Promise<void> {
    const existing = getPendingBatches(context);

    if (existing.length >= MAX_CACHED) {
        // Drop the oldest entry to make room (FIFO eviction)
        existing.shift();
    }

    existing.push(payload);
    await context.globalState.update(PENDING_KEY, existing);
    console.log(`[Consistify] Cached offline. Queue size: ${existing.length}`);
}

/**
 * Returns all cached payloads awaiting retry.
 */
export function getPendingBatches(
    context: vscode.ExtensionContext
): HeartbeatPayload[] {
    return context.globalState.get<HeartbeatPayload[]>(PENDING_KEY) ?? [];
}

/**
 * Returns the number of payloads currently in the offline cache.
 */
export function getPendingCount(context: vscode.ExtensionContext): number {
    return getPendingBatches(context).length;
}

/**
 * Attempts to flush the offline cache. Any payloads that still fail
 * are kept in the cache for the next retry.
 */
export async function flushPendingBatches(
    context: vscode.ExtensionContext,
    apiKey: string
): Promise<void> {
    const pending = getPendingBatches(context);

    if (pending.length === 0) {
        return;
    }

    console.log(`[Consistify] Flushing ${pending.length} cached payload(s)…`);

    const stillFailed = await sendBatch(pending, apiKey);

    if (stillFailed.length === 0) {
        // All sent successfully — clear the cache
        await context.globalState.update(PENDING_KEY, []);
        console.log('[Consistify] Offline cache cleared.');
    } else {
        // Persist only the ones that still failed
        await context.globalState.update(PENDING_KEY, stillFailed);
        console.warn(
            `[Consistify] ${stillFailed.length} payload(s) still pending after flush.`
        );
    }
}

/**
 * Clears the entire offline cache (e.g. when the user removes their API key).
 */
export async function clearPendingBatches(
    context: vscode.ExtensionContext
): Promise<void> {
    await context.globalState.update(PENDING_KEY, []);
}
