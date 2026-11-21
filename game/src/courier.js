// Moonlit Post — the night courier: movement with tile collision, and the
// facing direction the painter uses to draw the cloak and satchel.

import {
  TILE,
  COURIER_WALK_SPEED,
  COURIER_SNEAK_SPEED,
  COURIER_RADIUS,
  SOLID_TILES,
} from './settings.js';
import { tileAtPixel } from './maps.js';

export function createCourier(start) {
  return {
    x: start.x,
    y: start.y,
    facing: 0, // radians; 0 faces right
    moving: false,
    sneaking: false,
    stepPhase: 0, // advances while walking, drives footstep sounds
  };
}

// Would a circle at (x, y) overlap any solid tile? Checks the four corners
// of the circle's bounding box plus its edge midpoints.
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

// Move the courier one tick. Axis-separated movement lets the courier slide
// along hedges and crates instead of sticking to them.
export function moveCourier(courier, grid, vector, sneaking, dt) {
  const speed = sneaking ? COURIER_SNEAK_SPEED : COURIER_WALK_SPEED;
  courier.sneaking = sneaking;
  courier.moving = vector.x !== 0 || vector.y !== 0;
  if (!courier.moving) {
    return;
  }
  courier.facing = Math.atan2(vector.y, vector.x);
  const nextX = courier.x + vector.x * speed * dt;
  if (!circleHitsSolid(grid, nextX, courier.y, COURIER_RADIUS)) {
    courier.x = nextX;
  }
  const nextY = courier.y + vector.y * speed * dt;
  if (!circleHitsSolid(grid, courier.x, nextY, COURIER_RADIUS)) {
    courier.y = nextY;
  }
  courier.stepPhase += dt * (sneaking ? 5 : 8);
}

// Distance from the courier to a point, used for the gate and capture tests.
export function courierDistanceTo(courier, point) {
  const dx = courier.x - point.x;
  const dy = courier.y - point.y;
  return Math.hypot(dx, dy);
}
