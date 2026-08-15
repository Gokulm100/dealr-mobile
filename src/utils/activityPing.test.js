import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  ACTIVITY_PING_THROTTLE_MS,
  resetActivityPingForTests,
  reportActivityIfDue,
  handleAppStateChange,
  bindActivityPing,
} from './activityPing.js';

function createDeps({ token = 'jwt-token', pingImpl } = {}) {
  const calls = [];
  const deps = {
    getToken: async () => token,
    ping: async (authToken) => {
      calls.push(authToken);
      if (pingImpl) return pingImpl(authToken);
    },
    calls,
  };
  return deps;
}

describe('reportActivityIfDue', () => {
  beforeEach(() => {
    resetActivityPingForTests();
  });

  it('AppState active fires ping once when logged in', async () => {
    const deps = createDeps();
    const first = await handleAppStateChange('active', deps);
    assert.equal(first.pinged, true);
    assert.equal(deps.calls.length, 1);
    assert.equal(deps.calls[0], 'jwt-token');
  });

  it('spam-switching apps does not burst pings', async () => {
    const deps = createDeps();
    const now = 1_000_000;
    await reportActivityIfDue({ ...deps, now });
    await reportActivityIfDue({ ...deps, now: now + 1_000 });
    await handleAppStateChange('active', { ...deps, now: now + 5_000 });
    await handleAppStateChange('background', { ...deps, now: now + 6_000 });
    await handleAppStateChange('active', { ...deps, now: now + 10_000 });
    assert.equal(deps.calls.length, 1);

    const later = await reportActivityIfDue({
      ...deps,
      now: now + ACTIVITY_PING_THROTTLE_MS,
    });
    assert.equal(later.pinged, true);
    assert.equal(deps.calls.length, 2);
  });

  it('logged out: no ping and no crash', async () => {
    const deps = createDeps({ token: null });
    const result = await handleAppStateChange('active', deps);
    assert.equal(result.pinged, false);
    assert.equal(result.reason, 'logged_out');
    assert.equal(deps.calls.length, 0);

    const empty = await reportActivityIfDue({
      getToken: async () => '',
      ping: async () => { throw new Error('should not run'); },
    });
    assert.equal(empty.pinged, false);
  });
});

describe('bindActivityPing', () => {
  beforeEach(() => {
    resetActivityPingForTests();
  });

  it('pings on initial active and ignores rapid subsequent actives', async () => {
    const listeners = [];
    const AppState = {
      currentState: 'active',
      addEventListener: (_event, cb) => {
        listeners.push(cb);
        return { remove: () => {} };
      },
    };
    const deps = createDeps();
    bindActivityPing({ AppState, getToken: deps.getToken, ping: deps.ping });

    await Promise.resolve();
    assert.equal(deps.calls.length, 1);

    listeners[0]('background');
    listeners[0]('active');
    listeners[0]('inactive');
    listeners[0]('active');
    await Promise.resolve();
    assert.equal(deps.calls.length, 1);
  });
});
