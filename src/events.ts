import * as vscode from 'vscode';
import { HeartbeatController } from './tracker';

/**
 * Registers all VS Code editor event listeners and wires them
 * to the HeartbeatController.
 *
 * Events tracked:
 *  - onDidChangeTextDocument          → typing / code edits
 *  - onDidChangeTextEditorSelection   → cursor movement / reading
 *  - onDidChangeTextEditorVisibleRanges → scrolling
 *  - onDidChangeActiveTextEditor      → tab / file switch
 */
export function registerEventListeners(
    context: vscode.ExtensionContext,
    tracker: HeartbeatController
): void {
    // ── 1. Typing / AI Paste ───────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.contentChanges.length === 0) return;

            // Check for large pastes / AI assist insertions
            const isLargeInsertion = event.contentChanges.some(
                (change) => change.text.length > 50
            );

            if (isLargeInsertion) {
                tracker.pulse('ai-paste', event.document);
            } else {
                tracker.pulse('typing', event.document);
            }
        })
    );

    // ── 2. Reading — cursor / selection movement ───────────────────────────────
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorSelection((event) => {
            if (event.selections.length === 0) return;
            tracker.pulse('selection', event.textEditor.document);
        })
    );

    // ── 3. Reading — scroll ────────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
            tracker.pulse('scroll', event.textEditor.document);
        })
    );

    // ── 4. Tab / File switch ───────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                tracker.pulse('file-switch', editor.document);
            }
        })
    );

    // ── 5. Terminal Tracking ───────────────────────────────────────────────────
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTerminal((terminal) => {
            // Only count terminal focus if the VS Code window is actually active to ignore background compilations
            if (terminal && vscode.window.state.focused) {
                tracker.pulse('terminal-focus');
            }
        })
    );
    context.subscriptions.push(
        vscode.window.onDidOpenTerminal((terminal) => {
            if (terminal) {
                tracker.pulse('terminal-focus');
            }
        })
    );

    // ── 6. Window State Tracking ───────────────────────────────────────────────
    // Fired when the user switches away from or back to the VS Code app entirely
    context.subscriptions.push(
        vscode.window.onDidChangeWindowState((state) => {
            if (state.focused) {
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    tracker.pulse('window-focus', activeEditor.document);
                } else {
                    tracker.pulse('window-focus');
                }
            }
        })
    );

    console.log('[Consistify] Event listeners registered.');
}
