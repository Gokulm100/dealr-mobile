/**
 * EXP-1 mobile analytics — pure core (no React Native imports).
 * Kept dependency-free so it can be unit-tested under plain Node and reused by
 * the RN client in analytics.js. Mirrors the web pipeline (siteAnalytics.js):
 * anonymous visitor id + session id + a batched queue posted to
 * POST /api/analytics/track.
 */

export const SESSION_GAP_MS = 30 * 60 * 1000; // 30 min inactivity => new session
export const MAX_QUEUE = 100; // backend accepts up to 100 events/request
export const AD_VIEW_DEBOUNCE_MS = 10 * 60 * 1000; // collapse repeat ad views

export function newId(prefix = "m") {
  try {
    if (typeof globalThis !== "undefined" && globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** New session if there is no session yet or the gap since last activity is too large. */
export function shouldStartNewSession(lastAtMs, nowMs, gapMs = SESSION_GAP_MS) {
  if (!lastAtMs || !Number.isFinite(lastAtMs)) return true;
  return nowMs - lastAtMs > gapMs;
}

/** Cap the queue to the most recent `max` events (drop oldest on overflow). */
export function capQueue(queue = [], max = MAX_QUEUE) {
  if (!Array.isArray(queue)) return [];
  return queue.slice(-max);
}

/** Debounce repeat ad_view events per adId. Returns the updated memory map + whether to send. */
export function shouldTrackAdView(adViewMemory, adId, nowMs, debounceMs = AD_VIEW_DEBOUNCE_MS) {
  const mem = adViewMemory instanceof Map ? adViewMemory : new Map();
  if (!adId) return { send: false, memory: mem };
  // First view of this ad is always tracked; subsequent views are debounced.
  if (mem.has(adId) && nowMs - mem.get(adId) < debounceMs) {
    return { send: false, memory: mem };
  }
  mem.set(adId, nowMs);
  return { send: true, memory: mem };
}

/**
 * Build a normalized analytics event matching the backend schema
 * (services/analytics.logic.js normalizeIncomingEvent).
 */
export function buildEvent(type, actor = {}, extra = {}, now = new Date()) {
  const at = now instanceof Date ? now : new Date(now);
  return {
    type,
    visitorId: actor.visitorId || "",
    sessionId: actor.sessionId || "",
    userId: actor.userId || null,
    userName: actor.userName || null,
    userEmail: actor.userEmail || null,
    page: extra.page || null,
    adId: extra.adId || extra.id || null,
    adTitle: extra.adTitle || extra.title || null,
    detail: extra.detail || extra.query || extra.message || null,
    path: extra.path || null,
    createdAt: at.toISOString(),
    platform: "mobile",
  };
}
