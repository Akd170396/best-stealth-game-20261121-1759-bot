// Detection: the shared suspicion meter and the alarm. Standing in a guard's
// cone fills the meter — fast up close, slow at the rim — and hiding drains it,
// so a near miss is a warning, not an instant failure. A full meter raises the
// alarm: guards chase your last seen position, then search, then calm down.

import { DETECTION, GUARD, PLAYER } from './config.js';
import { angleDifference, hasLineOfSight } from './world.js';
import { playerNoiseRadius } from './player.js';

export function makeDetection() {
  return {
    meter: 0, // 0 calm … 1 alarm
    alarm: false,
    unseenTimer: 0, // seconds since any guard last saw the player
    timesAlarmed: 0,
    seenNow: false, // some guard has eyes on the player this frame
  };
}

// How strongly one guard sees the player right now: 0 unseen, up to 1 for a
// point-blank stare down the middle of the cone.
export function sightStrength(guard, level, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.coneRange) return 0;
  const offAxis = Math.abs(angleDifference(Math.atan2(dy, dx), guard.facing));
  if (offAxis > GUARD.coneHalfAngle) return 0;
  if (!hasLineOfSight(level, guard, player)) return 0;
  const closeness = 1 - dist / GUARD.coneRange;
  const centrality = 1 - offAxis / GUARD.coneHalfAngle;
  return 0.25 + 0.75 * Math.max(closeness, centrality * 0.8);
}

export function updateDetection(detection, guards, level, player, dt, events) {
  let strongest = 0;
  let seer = null;
  for (const guard of guards) {
    const strength = sightStrength(guard, level, player);
    if (strength > strongest) {
      strongest = strength;
      seer = guard;
    }
  }
  detection.seenNow = strongest > 0;

  if (detection.seenNow) {
    detection.unseenTimer = 0;
    const rate = DETECTION.fillFar + (DETECTION.fillNear - DETECTION.fillFar) * strongest;
    detection.meter = Math.min(1, detection.meter + rate * dt);
    if (seer) {
      seer.stimulus = { x: player.x, y: player.y };
      if (detection.alarm) seer.lastSeen = { x: player.x, y: player.y };
      else if (detection.meter >= DETECTION.suspiciousAt && seer.state === 'patrol') {
        seer.state = 'suspicious';
        events.onSuspicious(seer);
      }
    }
  } else {
    detection.unseenTimer += dt;
    detection.meter = Math.max(0, detection.meter - DETECTION.drainRate * dt);
  }

  // Footsteps: a walking player inside the noise ring makes nearby guards curious.
  const noise = playerNoiseRadius(player);
  if (noise > 0 && !detection.alarm) {
    for (const guard of guards) {
      const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
      if (dist < noise && guard.state === 'patrol') {
        guard.state = 'suspicious';
        guard.stimulus = { x: player.x, y: player.y };
        events.onSuspicious(guard);
      }
    }
  }

  if (!detection.alarm && detection.meter >= DETECTION.alarmAt) {
    detection.alarm = true;
    detection.timesAlarmed += 1;
    for (const guard of guards) {
      guard.state = 'chase';
      guard.lastSeen = { x: player.x, y: player.y };
    }
    events.onAlarm();
  }

  if (detection.alarm) {
    // Chasers who reach the last seen spot without finding you start searching.
    for (const guard of guards) {
      if (guard.state !== 'chase' || detection.seenNow) continue;
      const target = guard.lastSeen;
      if (target && Math.hypot(target.x - guard.x, target.y - guard.y) < 14) {
        guard.state = 'search';
        guard.searchTimer = 2.4;
      }
    }
    if (detection.unseenTimer >= DETECTION.calmAfter) {
      detection.alarm = false;
      detection.meter = 0.3;
      for (const guard of guards) {
        if (guard.state === 'chase' || guard.state === 'search') guard.state = 'return';
      }
      events.onCalm();
    }
  } else if (detection.meter < DETECTION.suspiciousAt) {
    for (const guard of guards) {
      if (guard.state === 'suspicious') guard.state = 'patrol';
    }
  }

  // Caught: a chasing guard lays a hand on you.
  if (detection.alarm) {
    for (const guard of guards) {
      if (guard.state !== 'chase') continue;
      if (Math.hypot(player.x - guard.x, player.y - guard.y) < PLAYER.catchRadius) {
        events.onCaught(guard);
        break;
      }
    }
  }
}
