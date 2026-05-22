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
exports.sendBatch = sendBatch;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const BASE_URL = 'https://consis-sigma.vercel.app';
const HEARTBEAT_ENDPOINT = '/api/vscode/heartbeat';
const TIMEOUT_MS = 8000;
/**
 * Sends a batch of heartbeat payloads to the Consistify server.
 *
 * @returns The array of failed payloads (i.e. all of them if the network fails),
 *          or an empty array if successful.
 */
function sendBatch(payloads, apiKey) {
    if (payloads.length === 0)
        return Promise.resolve([]);
    return new Promise((resolve) => {
        const body = JSON.stringify(payloads);
        const url = new URL(HEARTBEAT_ENDPOINT, BASE_URL);
        const isLocal = BASE_URL.startsWith('http://');
        const options = {
            hostname: url.hostname,
            port: url.port || (isLocal ? 80 : 443),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                Authorization: `Bearer ${apiKey}`,
                'User-Agent': 'consistify-vscode/1.0.0',
            },
        };
        const reqModule = isLocal ? http : https;
        const req = reqModule.request(options, (res) => {
            res.resume();
            const success = res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300;
            if (!success) {
                console.error(`[Consistify] Server responded with HTTP ${res.statusCode}`);
                resolve(payloads); // All failed, return them
            }
            else {
                resolve([]); // Success, no failed payloads
            }
        });
        req.setTimeout(TIMEOUT_MS, () => {
            console.error('[Consistify] Request timed out.');
            req.destroy();
            resolve(payloads);
        });
        req.on('error', (err) => {
            console.error('[Consistify] Network error:', err.message);
            resolve(payloads);
        });
        req.write(body);
        req.end();
    });
}
//# sourceMappingURL=api.js.map