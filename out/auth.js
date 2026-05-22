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
exports.registerAuthCommands = registerAuthCommands;
exports.getApiKey = getApiKey;
const vscode = __importStar(require("vscode"));
const API_KEY_SECRET = 'consistify.apiKey';
/**
 * Registers the "Consistify: Set API Key" and "Consistify: Clear API Key" commands.
 * The "API Key" is actually the Extension Token generated from the Consistify dashboard.
 */
function registerAuthCommands(context) {
    context.subscriptions.push(vscode.commands.registerCommand('consistify.setApiKey', () => handleSetApiKey(context)), vscode.commands.registerCommand('consistify.clearApiKey', () => handleClearApiKey(context)));
}
/**
 * Prompts the user for their Consistify API key and stores it securely.
 */
async function handleSetApiKey(context) {
    const existing = await context.secrets.get(API_KEY_SECRET);
    const input = await vscode.window.showInputBox({
        title: 'Consistify: Set Extension Token',
        prompt: 'Paste your Extension Token from: https://consis-sigma.vercel.app/dashboard/vscode → Token Panel',
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
    vscode.window.showInformationMessage('✅ Consistify: API key saved securely. Time tracking is now active!');
}
/**
 * Clears the stored API key.
 */
async function handleClearApiKey(context) {
    await context.secrets.delete(API_KEY_SECRET);
    vscode.window.showInformationMessage('🗑️ Consistify: API key removed. Time tracking has been paused.');
}
/**
 * Retrieves the stored API key, or undefined if not set.
 */
async function getApiKey(context) {
    return context.secrets.get(API_KEY_SECRET);
}
//# sourceMappingURL=auth.js.map