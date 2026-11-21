// Moonlit Post — lantern sight: line-of-sight tests and the vision-cone
// polygon the painter fills. Light stops at walls, hedges and crates, but
// crosses ponds, so open water is a risky place to be caught standing.

import { TILE, SIGHT_BLOCKERS, LANTERN_RANGE, LANTERN_HALF_ANGLE, CONE_RAYS } from './settings.js';
import { tileAtPixel } from './maps.js';

const RAY_STEP = 4; // pixels between samples along one ray

// March from (x0, y0) toward (x1, y1); true when no sight-blocking tile
// stands between the two points.
export function hasLineOfSight(grid, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) {
    return true;
  }
  const steps = Math.ceil(dist / RAY_STEP);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x0 + dx * t;
    const py = y0 + dy * t;
    if (SIGHT_BLOCKERS.has(tileAtPixel(grid, TILE, px, py))) {
      return false;
    }
  }
  return true;
}

// How far lantern light travels from (x, y) along `angle` before a blocker.
export function rayReach(grid, x, y, angle, maxRange) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let travelled = 0;
  while (travelled < maxRange) {
    travelled += RAY_STEP;
    const px = x + dx * travelled;
    const py = y + dy * travelled;
    if (SIGHT_BLOCKERS.has(tileAtPixel(grid, TILE, px, py))) {
      return travelled - RAY_STEP;
    }
  }
  return maxRange;
}

// The cone outline as a list of points, starting at the lantern itself.
export function conePolygon(grid, x, y, facing) {
  const points = [{ x, y }];
  for (let i = 0; i <= CONE_RAYS; i++) {
    const angle = facing - LANTERN_HALF_ANGLE + (2 * LANTERN_HALF_ANGLE * i) / CONE_RAYS;
    const reach = rayReach(grid, x, y, angle, LANTERN_RANGE);
    points.push({ x: x + Math.cos(angle) * reach, y: y + Math.sin(angle) * reach });
  }
  return points;
}

// Is the target inside this lantern's light? Returns 0 when unseen, else a
// closeness factor: 1 at the lantern, fading to 0 at the cone's far edge.
export function lanternVisibility(grid, sentry, target) {
  const dx = target.x - sentry.x;
  const dy = target.y - sentry.y;
  const dist = Math.hypot(dx, dy);
  if (dist > LANTERN_RANGE) {
    return 0;
  }
  let angleDiff = Math.atan2(dy, dx) - sentry.facing;
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
  if (Math.abs(angleDiff) > LANTERN_HALF_ANGLE) {
    return 0;
  }
  if (!hasLineOfSight(grid, sentry.x, sentry.y, target.x, target.y)) {
    return 0;
  }
  return 1 - dist / LANTERN_RANGE;
}
