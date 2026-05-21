import * as vscode from 'vscode';

const API_KEY_SECRET = 'consistify.apiKey';

/**
 * Registers the "Consistify: Set API Key" and "Consistify: Clear API Key" commands.
 * The "API Key" is actually the Extension Token generated from the Consistify dashboard.
 */
export function registerAuthCommands(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('consistify.setApiKey', () =>
            handleSetApiKey(context)
        ),
        vscode.commands.registerCommand('consistify.clearApiKey', () =>
            handleClearApiKey(context)
        )
    );
}

/**
 * Prompts the user for their Consistify API key and stores it securely.
 */
async function handleSetApiKey(context: vscode.ExtensionContext): Promise<void> {
    const existing = await context.secrets.get(API_KEY_SECRET);

    const input = await vscode.window.showInputBox({
        title: 'Consistify: Set Extension Token',
        prompt: 'Paste your Extension Token from: localhost:3000/dashboard/vscode → Token Panel',
        password: true,
        placeHolder: 'ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        value: existing ?? '',
        ignoreFocusOut: true,
        validateInput: (value) => {
            if (!value || value.trim().length < 10) {
                return 'Token must be at least 10 characters.';
            }
            return null;
        },
    });

    if (input === undefined) {
        // User pressed Escape — do nothing
        return;
    }

    const trimmed = input.trim();
    await context.secrets.store(API_KEY_SECRET, trimmed);
    vscode.window.showInformationMessage(
        '✅ Consistify: API key saved securely. Time tracking is now active!'
    );
}

/**
 * Clears the stored API key.
 */
async function handleClearApiKey(context: vscode.ExtensionContext): Promise<void> {
    await context.secrets.delete(API_KEY_SECRET);
    vscode.window.showInformationMessage(
        '🗑️ Consistify: API key removed. Time tracking has been paused.'
    );
}

/**
 * Retrieves the stored API key, or undefined if not set.
 */
export async function getApiKey(
    context: vscode.ExtensionContext
): Promise<string | undefined> {
    return context.secrets.get(API_KEY_SECRET);
}
