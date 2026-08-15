export const ACTIVITY_PING_THROTTLE_MS = 15 * 60 * 1000;

let lastPingAt = 0;

export function resetActivityPingForTests() {
  lastPingAt = 0;
}

/**
 * POST /api/users/ping at most once per 15 minutes when a JWT is present.
 * Call only from AppState → active (and the initial active state). Do not
 * hook this to screen focus, scroll, or socket reconnect.
 */
export async function reportActivityIfDue({
  getToken,
  ping,
  now = Date.now(),
} = {}) {
  if (typeof getToken !== 'function' || typeof ping !== 'function') {
    return { pinged: false, reason: 'unconfigured' };
  }

  let token;
  try {
    token = await getToken();
  } catch {
    return { pinged: false, reason: 'logged_out' };
  }

  if (!token) return { pinged: false, reason: 'logged_out' };

  if (lastPingAt && now - lastPingAt < ACTIVITY_PING_THROTTLE_MS) {
    return { pinged: false, reason: 'throttled' };
  }

  lastPingAt = now;
  try {
    await ping(token);
    return { pinged: true };
  } catch {
    return { pinged: false, reason: 'failed' };
  }
}

export function handleAppStateChange(nextState, deps) {
  if (nextState !== 'active') {
    return Promise.resolve({ pinged: false, reason: 'inactive' });
  }
  return reportActivityIfDue(deps);
}

/**
 * Bind AppState. Pings on transition to active and once if already active
 * (cold start / first launch while logged in).
 */
export function bindActivityPing({ AppState, getToken, ping } = {}) {
  if (!AppState?.addEventListener) return () => {};

  const deps = { getToken, ping };
  const onChange = (state) => {
    handleAppStateChange(state, deps);
  };

  const sub = AppState.addEventListener('change', onChange);
  if (AppState.currentState === 'active') {
    reportActivityIfDue(deps);
  }

  return () => {
    if (typeof sub?.remove === 'function') sub.remove();
  };
}
