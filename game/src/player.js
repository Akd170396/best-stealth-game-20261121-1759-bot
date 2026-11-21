// The player: a thief crossing the vault. Walking is quick but audible — guards
// hear footsteps inside the noise ring — while sneaking (Shift) is slow and silent.

import { PLAYER } from './config.js';
import { moveCircle } from './world.js';

export function makePlayer(start) {
  return {
    x: start.x,
    y: start.y,
    facing: 0,
    moving: false,
    sneaking: false,
    stepTimer: 0, // counts down to the next footstep tick
    hasGem: false,
  };
}

export function updatePlayer(player, level, wish, dt, onFootstep) {
  player.moving = wish.moving;
  player.sneaking = wish.sneaking;
  if (!wish.moving) {
    player.stepTimer = 0;
    return;
  }
  player.facing = Math.atan2(wish.y, wish.x);
  const speed = wish.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  moveCircle(level, player, PLAYER.radius, wish.x * speed * dt, wish.y * speed * dt);

  // Footsteps: a soft tick while sneaking, a clear one while walking. The
  // callback lets the audio module play it and detection hear it.
  player.stepTimer -= dt;
  if (player.stepTimer <= 0) {
    player.stepTimer = wish.sneaking ? 0.42 : 0.27;
    onFootstep(player);
  }
}

// The radius at which guards can hear this player right now: nothing while
// sneaking or standing still, the full noise ring while walking.
export function playerNoiseRadius(player) {
  if (!player.moving || player.sneaking) return 0;
  return PLAYER.noiseRadius;
}
