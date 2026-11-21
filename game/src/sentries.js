// Moonlit Post — sentry behaviour. A sentry patrols fixed waypoints, turns
// suspicious when the alarm meter climbs, chases the courier's last seen
// position while the alarm sounds, searches there, then walks back to its
// patrol. Fixed routes reward a patient courier who watches and waits.

import {
  TILE,
  SENTRY_PATROL_SPEED,
  SENTRY_CHASE_SPEED,
  SENTRY_RADIUS,
  SENTRY_TURN_RATE,
  SOLID_TILES,
} from './settings.js';
import { tileAtPixel } from './maps.js';

export const SENTRY_MODES = {
  PATROL: 'patrol',
  SUSPICIOUS: 'suspicious',
  CHASE: 'chase',
  SEARCH: 'search',
  RETURN: 'return',
};

export function createSentry(definition) {
  const points = definition.waypoints.map(([col, row]) => ({
    x: col * TILE + TILE / 2,
    y: row * TILE + TILE / 2,
  }));
  const first = points[0];
  const second = points[1] ?? first;
  return {
    x: first.x,
    y: first.y,
    facing: Math.atan2(second.y - first.y, second.x - first.x),
    waypoints: points,
    waypointIndex: 1 % points.length,
    mode: SENTRY_MODES.PATROL,
    pauseTimer: 0,
    searchTimer: 0,
    lastSeen: null,
    stepPhase: Math.random() * 6,
  };
}

function circleHitsSolid(grid, x, y, radius) {
  const probes = [
    [x - radius, y - radius],
    [x + radius, y - radius],
    [x - radius, y + radius],
    [x + radius, y + radius],
    [x, y - radius],
    [x, y + radius],
    [x - radius, y],
    [x + radius, y],
  ];
  for (const [px, py] of probes) {
    if (SOLID_TILES.has(tileAtPixel(grid, TILE, px, py))) {
      return true;
    }
  }
  return false;
}

// Turn `facing` toward `targetAngle` at most `maxStep` radians.
function turnToward(facing, targetAngle, maxStep) {
  let diff = targetAngle - facing;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  if (Math.abs(diff) <= maxStep) {
    return targetAngle;
  }
  return facing + Math.sign(diff) * maxStep;
}

// Walk toward a point at `speed`, sliding along solid tiles. Returns true
// when the sentry has (nearly) arrived.
function walkToward(sentry, grid, point, speed, dt) {
  const dx = point.x - sentry.x;
  const dy = point.y - sentry.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) {
    return true;
  }
  const desired = Math.atan2(dy, dx);
  sentry.facing = turnToward(sentry.facing, desired, SENTRY_TURN_RATE * dt * 2);
  const stepX = (dx / dist) * speed * dt;
  const stepY = (dy / dist) * speed * dt;
  if (!circleHitsSolid(grid, sentry.x + stepX, sentry.y, SENTRY_RADIUS)) {
    sentry.x += stepX;
  }
  if (!circleHitsSolid(grid, sentry.x, sentry.y + stepY, SENTRY_RADIUS)) {
    sentry.y += stepY;
  }
  sentry.stepPhase += dt * (speed > SENTRY_PATROL_SPEED ? 10 : 6);
  return Math.hypot(point.x - sentry.x, point.y - sentry.y) < 5;
}

// Advance one sentry by dt seconds. `alarm` is the shared game alarm state:
// { active, lastSeen, unseenFor }. `suspicion` is the current meter 0..1.
export function updateSentry(sentry, grid, alarm, suspicion, dt) {
  if (alarm.active && alarm.lastSeen) {
    sentry.lastSeen = alarm.lastSeen;
    if (sentry.mode !== SENTRY_MODES.CHASE && sentry.mode !== SENTRY_MODES.SEARCH) {
      sentry.mode = SENTRY_MODES.CHASE;
    }
  }

  switch (sentry.mode) {
    case SENTRY_MODES.PATROL: {
      if (suspicion > 0.45) {
        sentry.mode = SENTRY_MODES.SUSPICIOUS;
        break;
      }
      if (sentry.pauseTimer > 0) {
        sentry.pauseTimer -= dt;
        // A paused sentry slowly sweeps its lantern across the path.
        sentry.facing += Math.sin(sentry.pauseTimer * 1.4) * 0.35 * dt;
        break;
      }
      const target = sentry.waypoints[sentry.waypointIndex];
      if (walkToward(sentry, grid, target, SENTRY_PATROL_SPEED, dt)) {
        sentry.waypointIndex = (sentry.waypointIndex + 1) % sentry.waypoints.length;
        sentry.pauseTimer = 0.9;
      }
      break;
    }
    case SENTRY_MODES.SUSPICIOUS: {
      // Stand still and stare toward the last glimpse.
      if (sentry.lastSeen) {
        const desired = Math.atan2(sentry.lastSeen.y - sentry.y, sentry.lastSeen.x - sentry.x);
        sentry.facing = turnToward(sentry.facing, desired, SENTRY_TURN_RATE * dt);
      }
      if (suspicion <= 0.05) {
        sentry.mode = SENTRY_MODES.PATROL;
      }
      break;
    }
    case SENTRY_MODES.CHASE: {
      const goal = sentry.lastSeen ?? sentry.waypoints[sentry.waypointIndex];
      if (walkToward(sentry, grid, goal, SENTRY_CHASE_SPEED, dt)) {
        sentry.mode = SENTRY_MODES.SEARCH;
        sentry.searchTimer = 2.6;
      }
      break;
    }
    case SENTRY_MODES.SEARCH: {
      sentry.searchTimer -= dt;
      sentry.facing += dt * 1.5; // sweep the lantern in a slow circle
      if (sentry.searchTimer <= 0) {
        sentry.mode = SENTRY_MODES.RETURN;
      }
      break;
    }
    case SENTRY_MODES.RETURN: {
      const home = sentry.waypoints[sentry.waypointIndex];
      if (walkToward(sentry, grid, home, SENTRY_PATROL_SPEED, dt)) {
        sentry.mode = SENTRY_MODES.PATROL;
        sentry.pauseTimer = 0.4;
      }
      break;
    }
  }
}

// Remember where the courier was glimpsed, for suspicious staring.
export function noteGlimpse(sentry, point) {
  sentry.lastSeen = { x: point.x, y: point.y };
}
