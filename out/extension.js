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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const auth_1 = require("./auth");
const tracker_1 = require("./tracker");
const events_1 = require("./events");
/**
 * Called once by VS Code when the extension is first activated
 * (after `onStartupFinished`).
 */
function activate(context) {
    console.log('[Consistify] Extension activating…');
    // 1. Register "Set API Key" and "Clear API Key" commands
    (0, auth_1.registerAuthCommands)(context);
    // 2. Create the HeartbeatController (owns idle timer + window-focus watcher)
    const tracker = new tracker_1.HeartbeatController(context);
    // Register tracker for cleanup on deactivate
    context.subscriptions.push(tracker);
    // 3. Wire all editor events → tracker
    (0, events_1.registerEventListeners)(context, tracker);
    console.log('[Consistify] Extension active ✅');
    // Show a one-time welcome hint on first install
    const hasShownWelcome = context.globalState.get('consistify.welcomeShown');
    if (!hasShownWelcome) {
        vscode.window
            .showInformationMessage('👋 Consistify Time Tracker is active! Link your account to start tracking.', 'Set API Key', 'Dismiss')
            .then((selection) => {
            if (selection === 'Set API Key') {
                vscode.commands.executeCommand('consistify.setApiKey');
            }
        });
        context.globalState.update('consistify.welcomeShown', true);
    }
}
/**
 * Called when VS Code shuts down or the extension is disabled.
 * `HeartbeatController.dispose()` (via context.subscriptions) flushes any
 * in-progress batch before the process exits.
 */
function deactivate() {
    console.log('[Consistify] Extension deactivated.');
}
//# sourceMappingURL=extension.js.map