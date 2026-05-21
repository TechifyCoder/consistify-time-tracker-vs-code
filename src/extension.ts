import * as vscode from 'vscode';
import { registerAuthCommands } from './auth';
import { HeartbeatController } from './tracker';
import { registerEventListeners } from './events';

/**
 * Called once by VS Code when the extension is first activated
 * (after `onStartupFinished`).
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('[Consistify] Extension activating…');

    // 1. Register "Set API Key" and "Clear API Key" commands
    registerAuthCommands(context);

    // 2. Create the HeartbeatController (owns idle timer + window-focus watcher)
    const tracker = new HeartbeatController(context);

    // Register tracker for cleanup on deactivate
    context.subscriptions.push(tracker);

    // 3. Wire all editor events → tracker
    registerEventListeners(context, tracker);

    console.log('[Consistify] Extension active ✅');

    // Show a one-time welcome hint on first install
    const hasShownWelcome = context.globalState.get<boolean>('consistify.welcomeShown');
    if (!hasShownWelcome) {
        vscode.window
            .showInformationMessage(
                '👋 Consistify Time Tracker is active! Link your account to start tracking.',
                'Set API Key',
                'Dismiss'
            )
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
export function deactivate(): void {
    console.log('[Consistify] Extension deactivated.');
}
