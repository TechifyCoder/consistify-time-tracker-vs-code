"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerEventListeners = registerEventListeners;
const vscode = __importStar(require("vscode"));
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
function registerEventListeners(context, tracker) {
    // ── 1. Typing / AI Paste ───────────────────────────────────────────────────
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.contentChanges.length === 0)
            return;
        // Check for large pastes / AI assist insertions
        const isLargeInsertion = event.contentChanges.some((change) => change.text.length > 50);
        if (isLargeInsertion) {
            tracker.pulse('ai-paste', event.document);
        }
        else {
            tracker.pulse('typing', event.document);
        }
    }));
    // ── 2. Reading — cursor / selection movement ───────────────────────────────
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection((event) => {
        if (event.selections.length === 0)
            return;
        tracker.pulse('selection', event.textEditor.document);
    }));
    // ── 3. Reading — scroll ────────────────────────────────────────────────────
    context.subscriptions.push(vscode.window.onDidChangeTextEditorVisibleRanges((event) => {
        tracker.pulse('scroll', event.textEditor.document);
    }));
    // ── 4. Tab / File switch ───────────────────────────────────────────────────
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            tracker.pulse('file-switch', editor.document);
        }
    }));
    // ── 5. Terminal Tracking ───────────────────────────────────────────────────
    context.subscriptions.push(vscode.window.onDidChangeActiveTerminal((terminal) => {
        // Only count terminal focus if the VS Code window is actually active to ignore background compilations
        if (terminal && vscode.window.state.focused) {
            tracker.pulse('terminal-focus');
        }
    }));
    context.subscriptions.push(vscode.window.onDidOpenTerminal((terminal) => {
        if (terminal) {
            tracker.pulse('terminal-focus');
        }
    }));
    // ── 6. Window State Tracking ───────────────────────────────────────────────
    // Fired when the user switches away from or back to the VS Code app entirely
    context.subscriptions.push(vscode.window.onDidChangeWindowState((state) => {
        if (state.focused) {
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                tracker.pulse('window-focus', activeEditor.document);
            }
            else {
                tracker.pulse('window-focus');
            }
        }
    }));
    console.log('[Consistify] Event listeners registered.');
}
//# sourceMappingURL=events.js.map