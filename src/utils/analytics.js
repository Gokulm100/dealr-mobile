/**
 * EXP-1 mobile analytics client.
 * Emits marketplace-funnel events to the existing backend pipeline
 * (POST /api/analytics/track). Best-effort and non-blocking: analytics must
 * never break a user flow, so every path is wrapped and failures are swallowed.
 *
 * Pure logic lives in analyticsCore.js (unit-tested). This file wires it to
 * AsyncStorage + fetch. Gated by ANALYTICS_ENABLED so it can be flipped off.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';
import {
  MAX_QUEUE,
  buildEvent,
  capQueue,
  newId,
  shouldStartNewSession,
  shouldTrackAdView,
} from './analyticsCore';

const ANALYTICS_ENABLED = true; // kill-switch for the whole client
const VISITOR_KEY = 'dealr_visitor_id';
const QUEUE_KEY = 'dealr_analytics_queue';
const FLUSH_MS = 3000;

let visitorId = '';
let sessionId = '';
let lastActivityAt = 0;
let currentUser = null;
let queue = [];
let flushTimer = null;
let started = false;
const adViewMemory = new Map();

function actor() {
  return {
    visitorId,
    sessionId,
    userId: currentUser?._id || currentUser?.id || null,
    userName: currentUser?.name || null,
    userEmail: currentUser?.email || null,
  };
}

function touchSession(now = Date.now()) {
  if (shouldStartNewSession(lastActivityAt, now)) {
    sessionId = newId('s');
  }
  lastActivityAt = now;
}

async function persistQueue() {
  try {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    /* quota / storage error — keep in-memory copy */
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_MS);
}

/**
 * Initialize the client. Loads/creates the anonymous visitor id, restores any
 * queued events, and records a `visit` (and `user_returned` for a known user).
 */
export async function initAnalytics(user = null) {
  if (!ANALYTICS_ENABLED || started) return;
  started = true;
  try {
    visitorId = (await AsyncStorage.getItem(VISITOR_KEY)) || '';
    if (!visitorId) {
      visitorId = newId('v');
      await AsyncStorage.setItem(VISITOR_KEY, visitorId);
    }
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (raw) queue = capQueue(JSON.parse(raw) || [], MAX_QUEUE);
  } catch {
    if (!visitorId) visitorId = newId('v');
  }
  if (user) currentUser = user;
  touchSession();
  track('visit', { page: 'app' });
  if (currentUser) track('user_returned', { page: 'app' });
}

export function setAnalyticsUser(user) {
  currentUser = user || null;
}

/** Enqueue an event. Never throws. */
export function track(type, extra = {}) {
  if (!ANALYTICS_ENABLED || !type) return;
  try {
    touchSession();
    queue.push(buildEvent(type, actor(), extra));
    queue = capQueue(queue, MAX_QUEUE);
    persistQueue();
    scheduleFlush();
  } catch {
    /* analytics must never break a flow */
  }
}

/** Send queued events to the backend. Re-queues on failure. */
export async function flush() {
  if (!ANALYTICS_ENABLED || !queue.length) return;
  const batch = queue;
  queue = [];
  await persistQueue();
  try {
    const token = await AsyncStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token && token !== 'null') headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/api/analytics/track`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ events: batch }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch {
    // Restore unsent events (most recent kept if over cap).
    queue = capQueue([...batch, ...queue], MAX_QUEUE);
    await persistQueue();
  }
}

// ---- Typed helpers (mirror web siteAnalytics.js + EXP-1 additions) ----
export function trackPageView(page, extra = {}) {
  if (page) track('page_view', { page, ...extra });
}

export function trackAdView(listing = {}) {
  const adId = listing.id || listing._id;
  if (!adId) return;
  const { send, memory } = shouldTrackAdView(adViewMemory, adId, Date.now());
  adViewMemory.clear();
  for (const [k, v] of memory) adViewMemory.set(k, v);
  if (!send) return;
  track('ad_view', { page: 'detail', adId, adTitle: listing.title || '' });
}

export function trackSearch(query) {
  const detail = String(query || '').trim();
  if (detail.length < 2) return;
  track('search', { page: 'home', detail });
}

export function trackSearchResultClick(listing = {}) {
  track('search_result_clicked', { page: 'home', adId: listing.id || listing._id, adTitle: listing.title });
}

export function trackContactSeller(listing = {}) {
  track('contact_seller', { page: 'detail', adId: listing.id || listing.adId, adTitle: listing.title || listing.adTitle });
}

export function trackShareListing(listing = {}) {
  track('share_listing', { page: 'detail', adId: listing.id || listing.adId, adTitle: listing.title || listing.adTitle });
}

export function trackFavoriteAdded(listing = {}) {
  track('favorite_added', { page: 'detail', adId: listing.id || listing.adId, adTitle: listing.title || listing.adTitle });
}

export function trackListingCreationStarted() {
  track('listing_creation_started', { page: 'post' });
}

export function trackPostAd(listing = {}, { edited = false } = {}) {
  track(edited ? 'edit_ad' : 'post_ad', { page: 'post', adId: listing.id || listing._id || listing.adId, adTitle: listing.title });
}

export function trackMarkSold(listing = {}) {
  track('mark_sold', { page: 'my-ads', adId: listing.id || listing._id || listing.adId, adTitle: listing.title });
}

export function trackReviewSubmitted(adId) {
  track('review_submitted', { page: 'profile', adId });
}

export function trackLogin(user) {
  if (user) currentUser = user;
  track('login', { page: 'profile' });
}

export function trackNotificationOpened(data = {}) {
  track('notification_opened', { page: 'app', detail: data.type || data.campaign || null, adId: data.adId || null });
}
