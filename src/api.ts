import * as https from 'https';
import * as http from 'http';

/** Shape of every heartbeat sent to the Consistify server. */
export interface HeartbeatPayload {
    timestamp: string;     // ISO 8601 — e.g. "2026-03-05T19:30:00.000Z"
    project_name: string;  // Workspace folder name — e.g. "my-project"
    language: string;      // Language identifier  — e.g. "typescript"
    duration: number;      // Active seconds in this batch — e.g. 45
}

const BASE_URL = 'https://consis-sigma.vercel.app';
const HEARTBEAT_ENDPOINT = '/api/vscode/heartbeat';
const TIMEOUT_MS = 8_000;

/**
 * Sends a batch of heartbeat payloads to the Consistify server.
 *
 * @returns The array of failed payloads (i.e. all of them if the network fails),
 *          or an empty array if successful.
 */
export function sendBatch(
    payloads: HeartbeatPayload[],
    apiKey: string
): Promise<HeartbeatPayload[]> {
    if (payloads.length === 0) return Promise.resolve([]);

    return new Promise((resolve) => {
        const body = JSON.stringify(payloads);
        const url = new URL(HEARTBEAT_ENDPOINT, BASE_URL);
        const isLocal = BASE_URL.startsWith('http://');

        const options: https.RequestOptions = {
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

        const req = reqModule.request(options, (res: http.IncomingMessage) => {
            res.resume();
            const success = res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300;
            if (!success) {
                console.error(`[Consistify] Server responded with HTTP ${res.statusCode}`);
                resolve(payloads); // All failed, return them
            } else {
                resolve([]); // Success, no failed payloads
            }
        });

        req.setTimeout(TIMEOUT_MS, () => {
            console.error('[Consistify] Request timed out.');
            req.destroy();
            resolve(payloads);
        });

        req.on('error', (err: Error) => {
            console.error('[Consistify] Network error:', err.message);
            resolve(payloads);
        });

        req.write(body);
        req.end();
    });
}
