// Moonlit Post — staged scenes for the entry screenshots. Loading the game
// with ?shot=cover (or suspicious, alarm, delivered) freezes one composed
// moment of real gameplay so the maker can photograph it: the same code
// draws these frames as draws live play, only the positions are arranged.

import { TILE } from './settings.js';
import { SENTRY_MODES } from './sentries.js';

function tileCentre(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

function placeSentry(sentry, col, row, facing, mode) {
  const p = tileCentre(col, row);
  sentry.x = p.x;
  sentry.y = p.y;
  sentry.facing = facing;
  if (mode) sentry.mode = mode;
}

function placeCourier(courier, col, row, facing) {
  const p = tileCentre(col, row);
  courier.x = p.x;
  courier.y = p.y;
  courier.facing = facing;
}

// Arrange `state` (already loaded with level 1) into one named scene and
// freeze it. Returns true when the name matched a scene.
export function applyScenario(state, name) {
  const [first, second] = state.sentries;
  state.phase = 'playing';
  state.frozen = true;

  if (name === 'cover') {
    // The whole front garden at a glance: two lantern cones sweeping the
    // paths, the courier tucked behind a hedge, the gate glowing far off.
    placeSentry(first, 16, 2, 0, SENTRY_MODES.PATROL);
    placeSentry(second, 36, 10, -Math.PI / 2, SENTRY_MODES.PATROL);
    placeCourier(state.courier, 7, 5, 0);
    state.meter = 0;
    return true;
  }

  if (name === 'suspicious') {
    // Caught at the lantern's edge: the meter is climbing and the sentry
    // has stopped to stare, question mark up.
    placeSentry(first, 16, 2, 0, SENTRY_MODES.SUSPICIOUS);
    placeSentry(second, 36, 13, Math.PI / 2, SENTRY_MODES.PATROL);
    placeCourier(state.courier, 19, 3, Math.PI);
    state.courier.x -= 4;
    state.courier.y -= 4;
    first.lastSeen = { x: state.courier.x, y: state.courier.y };
    state.meter = 0.62;
    return true;
  }

  if (name === 'alarm') {
    // The alarm is sounding: a sentry gives chase along the top path
    // while the courier bolts for the hedge line.
    placeSentry(first, 21, 2, 0, SENTRY_MODES.CHASE);
    placeSentry(second, 36, 8, Math.PI / 2, SENTRY_MODES.PATROL);
    placeCourier(state.courier, 24, 3, 0);
    first.lastSeen = { x: state.courier.x, y: state.courier.y };
    state.alarm.active = true;
    state.alarm.lastSeen = { x: state.courier.x, y: state.courier.y };
    state.meter = 1;
    return true;
  }

  if (name === 'delivered') {
    // The moment after a clean crossing: letter posted, garden crossed.
    placeSentry(first, 12, 2, Math.PI, SENTRY_MODES.PATROL);
    placeSentry(second, 36, 15, -Math.PI / 2, SENTRY_MODES.PATROL);
    placeCourier(state.courier, 33, 17, 0);
    state.delivered = 1;
    state.meter = 0;
    state.phase = 'levelComplete';
    return true;
  }

  return false;
}

// The ?shot= value from the page URL, or null for normal play.
export function requestedShot() {
  const params = new URLSearchParams(window.location.search);
  return params.get('shot');
}
