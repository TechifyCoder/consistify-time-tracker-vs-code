"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cachePendingBatch = cachePendingBatch;
exports.getPendingBatches = getPendingBatches;
exports.getPendingCount = getPendingCount;
exports.flushPendingBatches = flushPendingBatches;
exports.clearPendingBatches = clearPendingBatches;
const api_1 = require("./api");
const PENDING_KEY = 'consistify.pendingBatches';
const MAX_CACHED = 500; // Safety cap — avoids unbounded globalState growth
/**
 * Appends a failed payload to the offline cache.
 */
async function cachePendingBatch(context, payload) {
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
function getPendingBatches(context) {
    return context.globalState.get(PENDING_KEY) ?? [];
}
/**
 * Returns the number of payloads currently in the offline cache.
 */
function getPendingCount(context) {
    return getPendingBatches(context).length;
}
/**
 * Attempts to flush the offline cache. Any payloads that still fail
 * are kept in the cache for the next retry.
 */
async function flushPendingBatches(context, apiKey) {
    const pending = getPendingBatches(context);
    if (pending.length === 0) {
        return;
    }
    console.log(`[Consistify] Flushing ${pending.length} cached payload(s)…`);
    const stillFailed = await (0, api_1.sendBatch)(pending, apiKey);
    if (stillFailed.length === 0) {
        // All sent successfully — clear the cache
        await context.globalState.update(PENDING_KEY, []);
        console.log('[Consistify] Offline cache cleared.');
    }
    else {
        // Persist only the ones that still failed
        await context.globalState.update(PENDING_KEY, stillFailed);
        console.warn(`[Consistify] ${stillFailed.length} payload(s) still pending after flush.`);
    }
}
/**
 * Clears the entire offline cache (e.g. when the user removes their API key).
 */
async function clearPendingBatches(context) {
    await context.globalState.update(PENDING_KEY, []);
}
//# sourceMappingURL=storage.js.map