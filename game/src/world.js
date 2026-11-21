// The world: builds a playable level from a character grid, answers collision
// questions, and tests line of sight between two points. Walls and crates are
// solid; crates double as cover because they block sight as well as movement.

import { VIEW } from './config.js';

const TILE = VIEW.tile;

export function tileCenter(col, row) {
  return { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
}

export function buildLevel(definition) {
  const rows = definition.grid.length;
  const cols = definition.grid[0].length;
  const solid = [];
  let playerStart = tileCenter(1, 1);
  let gem = null;
  let exit = null;
  for (let row = 0; row < rows; row++) {
    solid.push([]);
    for (let col = 0; col < cols; col++) {
      const ch = definition.grid[row][col];
      solid[row].push(ch === '#' || ch === 'C');
      if (ch === 'P') playerStart = tileCenter(col, row);
      if (ch === 'G') gem = { ...tileCenter(col, row), taken: false };
      if (ch === 'E') exit = { ...tileCenter(col, row), col, row };
    }
  }
  return {
    name: definition.name,
    briefing: definition.briefing,
    grid: definition.grid,
    cols,
    rows,
    solid,
    playerStart,
    gem,
    exit,
    widthPx: cols * TILE,
    heightPx: rows * TILE,
  };
}

export function isSolidAt(level, x, y) {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  if (col < 0 || row < 0 || col >= level.cols || row >= level.rows) return true;
  return level.solid[row][col];
}

// Moves a circle by (dx, dy), sliding along walls axis by axis so the mover
// never clips a corner. Returns the new position.
export function moveCircle(level, pos, radius, dx, dy) {
  const next = { x: pos.x + dx, y: pos.y };
  if (!circleHitsWall(level, next.x, next.y, radius)) pos.x = next.x;
  next.y = pos.y + dy;
  if (!circleHitsWall(level, pos.x, next.y, radius)) pos.y = next.y;
  return pos;
}

function circleHitsWall(level, x, y, radius) {
  const minCol = Math.floor((x - radius) / TILE);
  const maxCol = Math.floor((x + radius) / TILE);
  const minRow = Math.floor((y - radius) / TILE);
  const maxRow = Math.floor((y + radius) / TILE);
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (col < 0 || row < 0 || col >= level.cols || row >= level.rows) return true;
      if (!level.solid[row][col]) continue;
      const nearestX = Math.max(col * TILE, Math.min(x, (col + 1) * TILE));
      const nearestY = Math.max(row * TILE, Math.min(y, (row + 1) * TILE));
      const distSq = (x - nearestX) ** 2 + (y - nearestY) ** 2;
      if (distSq < radius * radius) return true;
    }
  }
  return false;
}

// True when nothing solid stands between two points. Samples the segment every
// few pixels; crates and walls both break the line, which is what makes cover work.
export function hasLineOfSight(level, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isSolidAt(level, from.x + dx * t, from.y + dy * t)) return false;
  }
  return true;
}

// Casts one ray from an origin along an angle and returns how far it travels
// before it meets something solid (or the given maximum range).
export function castRay(level, origin, angle, maxRange) {
  const step = 5;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  for (let d = step; d <= maxRange; d += step) {
    if (isSolidAt(level, origin.x + dx * d, origin.y + dy * d)) return d - step;
  }
  return maxRange;
}

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function turnToward(current, target, maxStep) {
  const diff = angleDifference(target, current);
  if (Math.abs(diff) <= maxStep) return target;
  return current + Math.sign(diff) * maxStep;
}
