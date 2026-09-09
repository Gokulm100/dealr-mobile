import assert from 'node:assert/strict';
import {
  MAX_QUEUE,
  buildEvent,
  capQueue,
  newId,
  shouldStartNewSession,
  shouldTrackAdView,
} from './analyticsCore.js';

// newId is non-empty and reasonably unique
const a = newId();
const b = newId();
assert.ok(a && b && a !== b);

// session gap logic
assert.equal(shouldStartNewSession(0, 1000), true); // no prior session
assert.equal(shouldStartNewSession(null, 1000), true);
assert.equal(shouldStartNewSession(1000, 1000 + 60 * 1000), false); // 1 min gap -> same session
assert.equal(shouldStartNewSession(1000, 1000 + 31 * 60 * 1000), true); // >30 min -> new

// queue cap keeps most recent
const big = Array.from({ length: MAX_QUEUE + 5 }, (_, i) => i);
const capped = capQueue(big, MAX_QUEUE);
assert.equal(capped.length, MAX_QUEUE);
assert.equal(capped[0], 5); // oldest 5 dropped
assert.equal(capped[capped.length - 1], MAX_QUEUE + 4);
assert.deepEqual(capQueue(null, 10), []);

// ad_view debounce
let mem = new Map();
let r1 = shouldTrackAdView(mem, 'ad1', 1000);
assert.equal(r1.send, true);
let r2 = shouldTrackAdView(r1.memory, 'ad1', 1000 + 60 * 1000); // 1 min later -> debounced
assert.equal(r2.send, false);
let r3 = shouldTrackAdView(r2.memory, 'ad1', 1000 + 11 * 60 * 1000); // 11 min later -> allowed
assert.equal(r3.send, true);
assert.equal(shouldTrackAdView(mem, '', 1000).send, false); // no adId

// buildEvent shape
const ev = buildEvent(
  'contact_seller',
  { visitorId: 'v1', sessionId: 's1', userId: 'u1', userName: 'Asha', userEmail: 'a@x.com' },
  { adId: '64b000000000000000000001', title: 'iPhone' },
  new Date('2026-01-01T00:00:00.000Z'),
);
assert.equal(ev.type, 'contact_seller');
assert.equal(ev.visitorId, 'v1');
assert.equal(ev.sessionId, 's1');
assert.equal(ev.userId, 'u1');
assert.equal(ev.adId, '64b000000000000000000001');
assert.equal(ev.adTitle, 'iPhone');
assert.equal(ev.platform, 'mobile');
assert.equal(ev.createdAt, '2026-01-01T00:00:00.000Z');

console.log('analyticsCore tests passed');
