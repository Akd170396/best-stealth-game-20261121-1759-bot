// Guards: lantern-carrying watchmen who walk learnable patrols, turn toward
// anything suspicious, chase on alarm, and search the last place they saw you
// before giving up and returning to their route. Each guard's vision cone is
// shaped by casting rays that stop at walls and crates, so cover truly hides you.

import { GUARD } from './config.js';
import { castRay, moveCircle, tileCenter, turnToward } from './world.js';

export function makeGuard(patrolTiles) {
  const waypoints = patrolTiles.map(([col, row]) => tileCenter(col, row));
  return {
    x: waypoints[0].x,
    y: waypoints[0].y,
    facing: 0,
    waypoints,
    waypointIndex: 1 % waypoints.length,
    waypointDir: 1,
    state: 'patrol', // patrol | suspicious | chase | search | return
    pauseTimer: 0,
    stimulus: null, // {x, y} the guard is curious about
    lastSeen: null, // {x, y} where the player was last seen during a chase
    searchTimer: 0,
    stepTimer: 0,
  };
}

function walkToward(guard, level, target, speed, dt) {
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  guard.facing = turnToward(guard.facing, Math.atan2(dy, dx), GUARD.turnRate * dt);
  moveCircle(level, guard, GUARD.radius, (dx / dist) * speed * dt, (dy / dist) * speed * dt);
  return dist < 10;
}

export function updateGuard(guard, level, player, dt, onFootstep) {
  guard.stepTimer -= dt;
  if (guard.stepTimer <= 0 && guard.state !== 'suspicious') {
    guard.stepTimer = guard.state === 'chase' ? 0.22 : 0.34;
    onFootstep(guard);
  }

  switch (guard.state) {
    case 'patrol': {
      if (guard.pauseTimer > 0) {
        guard.pauseTimer -= dt;
        break;
      }
      const target = guard.waypoints[guard.waypointIndex];
      if (walkToward(guard, level, target, GUARD.patrolSpeed, dt)) {
        guard.pauseTimer = GUARD.pauseAtWaypoint;
        guard.waypointIndex += guard.waypointDir;
        if (guard.waypointIndex >= guard.waypoints.length) {
          guard.waypointIndex = guard.waypoints.length - 2;
          guard.waypointDir = -1;
        } else if (guard.waypointIndex < 0) {
          guard.waypointIndex = 1;
          guard.waypointDir = 1;
        }
      }
      break;
    }
    case 'suspicious': {
      // Stand still and stare at whatever caught your eye; detection decides
      // when curiosity fades or turns into an alarm.
      if (guard.stimulus) {
        const angle = Math.atan2(guard.stimulus.y - guard.y, guard.stimulus.x - guard.x);
        guard.facing = turnToward(guard.facing, angle, GUARD.turnRate * 1.6 * dt);
      }
      break;
    }
    case 'chase': {
      const target = guard.lastSeen ?? player;
      walkToward(guard, level, target, GUARD.chaseSpeed, dt);
      break;
    }
    case 'search': {
      const target = guard.lastSeen ?? guard.waypoints[0];
      if (walkToward(guard, level, target, GUARD.searchSpeed, dt)) {
        guard.searchTimer -= dt;
        guard.facing += Math.sin(guard.searchTimer * 2.2) * 1.6 * dt; // sweeping look
        if (guard.searchTimer <= 0) guard.state = 'return';
      }
      break;
    }
    case 'return': {
      const target = guard.waypoints[guard.waypointIndex];
      if (walkToward(guard, level, target, GUARD.searchSpeed, dt)) {
        guard.state = 'patrol';
        guard.pauseTimer = 0.4;
      }
      break;
    }
  }
}

// The visible cone as a polygon: the guard's position plus one point per ray,
// each ray stopping at the first wall or crate it meets.
export function visionConePolygon(guard, level) {
  const points = [{ x: guard.x, y: guard.y }];
  const start = guard.facing - GUARD.coneHalfAngle;
  const span = GUARD.coneHalfAngle * 2;
  for (let i = 0; i <= GUARD.coneRays; i++) {
    const angle = start + (span * i) / GUARD.coneRays;
    const range = castRay(level, guard, angle, GUARD.coneRange);
    points.push({ x: guard.x + Math.cos(angle) * range, y: guard.y + Math.sin(angle) * range });
  }
  return points;
}
