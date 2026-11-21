// Screenshot staging: when the page is opened with ?shot=<name>, the game is
// placed into a fixed, representative moment and frozen, so the entry's
// screenshots are real renders of the game's own code at moments a player
// would recognise — the hall mid-patrol, a near miss, a full alarm, the escape.

import { tileCenter } from './world.js';

function place(entity, col, row, facing) {
  const p = tileCenter(col, row);
  entity.x = p.x;
  entity.y = p.y;
  if (facing !== undefined) entity.facing = facing;
}

const SCENES = {
  // The cover: the Counting Hall mid-patrol — three lantern cones, crates for
  // cover, the gem in the north-east gallery and the exit glowing below it.
  cover(state) {
    place(state.player, 8, 8, 0);
    state.player.sneaking = true;
    place(state.guards[0], 13, 7, 0);
    place(state.guards[1], 11, 3, Math.PI / 2);
    place(state.guards[2], 10, 11, Math.PI);
    state.detection.meter = 0.18;
    state.elapsed = 47;
  },
  // A near miss: caught at the rim of a cone, the meter nearly full.
  nearmiss(state) {
    place(state.player, 13, 7, 0);
    state.player.sneaking = true;
    place(state.guards[0], 17, 7, Math.PI);
    state.guards[0].state = 'suspicious';
    state.guards[0].stimulus = { x: state.player.x, y: state.player.y };
    place(state.guards[1], 10, 3, Math.PI / 2);
    place(state.guards[2], 6, 11, 0);
    state.detection.meter = 0.72;
    state.detection.seenNow = true;
    state.elapsed = 83;
  },
  // Full alarm in the Inner Vault: red cones, guards converging, the thief
  // running loud for the crates.
  alarm(state) {
    place(state.player, 11, 7, 0);
    state.player.moving = true;
    place(state.guards[0], 5, 7, 0);
    place(state.guards[1], 9, 3, Math.PI / 2);
    place(state.guards[2], 17, 2, Math.PI);
    place(state.guards[3], 15, 11, Math.PI);
    for (const guard of state.guards) {
      guard.state = 'chase';
      guard.lastSeen = { x: state.player.x, y: state.player.y };
    }
    state.detection.meter = 1;
    state.detection.alarm = true;
    state.detection.timesAlarmed = 1;
    state.detection.seenNow = true;
    state.elapsed = 121;
  },
  // The escape: gem in hand at the exit door, the floor cleared as a ghost.
  escape(state) {
    place(state.player, 19, 10, Math.PI / 2);
    state.player.hasGem = true;
    state.level.gem.taken = true;
    place(state.guards[0], 8, 7, Math.PI);
    place(state.guards[1], 20, 3, Math.PI / 2);
    state.screen = 'clear';
    state.elapsed = 96;
  },
};

// Which floor each scene plays on (index into LEVELS).
export const SHOT_LEVELS = { cover: 1, nearmiss: 1, alarm: 2, escape: 0 };

export function stageShot(name, state) {
  const scene = SCENES[name];
  if (!scene) return false;
  scene(state);
  return true;
}
