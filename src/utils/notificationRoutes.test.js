import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  HOME_ROUTE,
  CHAT_INBOX_ROUTE,
  mapNotificationToRoute,
  resolveNotificationDestination,
} from './notificationRoutes.js';

function reengagement(overrides) {
  return {
    type: 'REENGAGEMENT',
    campaign: 'seller_unread',
    screen: 'chat',
    ...overrides,
  };
}

function listingIdFrom(route) {
  return route?.params?.params?.params?.listing?.id;
}

describe('mapNotificationToRoute — re-engagement campaigns', () => {
  it('seller_unread / screen=chat opens the selling messages inbox, not a conversation', () => {
    const route = mapNotificationToRoute(reengagement({
      campaign: 'seller_unread',
      screen: 'chat',
    }));
    assert.deepEqual(route, CHAT_INBOX_ROUTE);
    assert.equal(route.params.params.screen, 'MessagesList');
    assert.notEqual(route.params.params.screen, 'ChatDetail');
  });

  it('new_in_interest / screen=ad opens that ad', () => {
    const route = mapNotificationToRoute(reengagement({
      campaign: 'new_in_interest',
      screen: 'ad',
      adId: 'ad-new-1',
    }));
    assert.equal(route.name, 'MainTabs');
    assert.equal(route.params.screen, 'Home');
    assert.equal(route.params.params.screen, 'AdDetail');
    assert.equal(listingIdFrom(route), 'ad-new-1');
  });

  it('saved_still_up / screen=ad opens that ad', () => {
    const route = mapNotificationToRoute(reengagement({
      campaign: 'saved_still_up',
      screen: 'ad',
      adId: 'ad-saved-9',
    }));
    assert.equal(route.params.params.screen, 'AdDetail');
    assert.equal(listingIdFrom(route), 'ad-saved-9');
  });

  it('uses data.screen, not title copy', () => {
    const route = mapNotificationToRoute({
      type: 'REENGAGEMENT',
      campaign: 'seller_unread',
      screen: 'chat',
      title: 'Still available',
    });
    assert.deepEqual(route, CHAT_INBOX_ROUTE);
  });

  it('screen=ad without adId opens home', () => {
    assert.deepEqual(
      mapNotificationToRoute(reengagement({
        campaign: 'new_in_interest',
        screen: 'ad',
      })),
      HOME_ROUTE,
    );
    assert.deepEqual(
      mapNotificationToRoute(reengagement({
        campaign: 'saved_still_up',
        screen: 'ad',
        adId: '',
      })),
      HOME_ROUTE,
    );
  });

  it('unknown type opens home', () => {
    assert.deepEqual(mapNotificationToRoute({ type: 'UNKNOWN' }), HOME_ROUTE);
    assert.deepEqual(mapNotificationToRoute({ type: 'reengagement', screen: 'chat' }), HOME_ROUTE);
    assert.deepEqual(mapNotificationToRoute({}), HOME_ROUTE);
  });
});

describe('mapNotificationToRoute — existing types stay case-sensitive', () => {
  it('CHAT with adId opens that conversation', () => {
    const route = mapNotificationToRoute({
      type: 'CHAT',
      adId: 'ad-chat',
      buyerId: 'b1',
      sellerId: 's1',
    });
    assert.equal(route.name, 'Chat');
    assert.equal(route.params.screen, 'ChatDetail');
    assert.equal(route.params.params.chat.adId, 'ad-chat');
  });

  it('CHAT without adId is a no-op', () => {
    assert.equal(mapNotificationToRoute({ type: 'CHAT' }), null);
  });

  it('REVIEW_PROMPT with adId opens the profile review prompt', () => {
    const route = mapNotificationToRoute({ type: 'REVIEW_PROMPT', adId: 'ad-rev' });
    assert.equal(route.params.screen, 'Profile');
    assert.equal(route.params.params.params.openReviewAdId, 'ad-rev');
  });

  it('does not treat chat/review types case-insensitively', () => {
    assert.deepEqual(mapNotificationToRoute({ type: 'chat', adId: 'ad-1' }), HOME_ROUTE);
    assert.deepEqual(mapNotificationToRoute({ type: 'review_prompt', adId: 'ad-1' }), HOME_ROUTE);
  });
});

describe('cold start — getInitialNotification payload', () => {
  it('killed app + tap screen=ad lands on that ad', () => {
    const initialNotification = {
      notification: { title: 'New listing you\'d like', body: 'A new Electronics listing is up.' },
      data: {
        type: 'REENGAGEMENT',
        campaign: 'new_in_interest',
        screen: 'ad',
        adId: 'cold-ad-42',
      },
    };
    const route = mapNotificationToRoute(initialNotification.data);
    assert.equal(route.params.params.screen, 'AdDetail');
    assert.equal(listingIdFrom(route), 'cold-ad-42');
  });

  it('killed app + tap screen=chat lands on inbox', () => {
    const initialNotification = {
      notification: { title: 'Someone is waiting on your listing', body: 'You have 1 unread chat on your ads.' },
      data: {
        type: 'REENGAGEMENT',
        campaign: 'seller_unread',
        screen: 'chat',
      },
    };
    const route = mapNotificationToRoute(initialNotification.data);
    assert.deepEqual(route, CHAT_INBOX_ROUTE);
  });
});

describe('resolveNotificationDestination', () => {
  it('failed ad fetch opens home and does not throw', async () => {
    const data = reengagement({
      campaign: 'saved_still_up',
      screen: 'ad',
      adId: 'gone',
    });
    const failed = await resolveNotificationDestination(data, {
      fetchAd: async () => { throw new Error('network'); },
    });
    assert.deepEqual(failed, HOME_ROUTE);

    const missing = await resolveNotificationDestination(data, {
      fetchAd: async () => null,
    });
    assert.deepEqual(missing, HOME_ROUTE);
  });

  it('successful ad fetch attaches the listing', async () => {
    const listing = { id: 'ad-ok', title: 'Bike' };
    const route = await resolveNotificationDestination(
      reengagement({ campaign: 'new_in_interest', screen: 'ad', adId: 'ad-ok' }),
      { fetchAd: async (id) => (id === 'ad-ok' ? listing : null) },
    );
    assert.equal(route.params.params.screen, 'AdDetail');
    assert.deepEqual(route.params.params.params.listing, listing);
  });

  it('logged-out stray notification does not throw', async () => {
    assert.doesNotThrow(() => mapNotificationToRoute(undefined));
    assert.doesNotThrow(() => mapNotificationToRoute(null));
    const route = await resolveNotificationDestination({ type: 'REENGAGEMENT' });
    assert.deepEqual(route, HOME_ROUTE);
  });
});
