import { config } from './config.js';
import { fetchDashboardData } from './github/fetcher.js';
let latestData = null;
const listeners = new Set();
export function getLatest() {
    return latestData;
}
export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}
async function poll() {
    try {
        const data = await fetchDashboardData();
        latestData = data;
        listeners.forEach((fn) => fn(data));
    }
    catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error('[poller] fetch failed:', error);
        if (latestData) {
            const errorData = { ...latestData, error, fetchedAt: new Date().toISOString() };
            latestData = errorData;
            listeners.forEach((fn) => fn(errorData));
        }
    }
}
export function startPoller() {
    poll();
    setInterval(poll, config.pollIntervalMs);
}
