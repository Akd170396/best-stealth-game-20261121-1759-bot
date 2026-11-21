// Moonlit Post — the three estate gardens the courier must cross.
//
// Each map is 21 rows of 40 tiles. Tile letters:
//   # stone wall      H hedge (tall cover)   c crate (low cover)
//   w pond (blocks feet, not light)          . moonlit grass
//   P courier start   X letter gate (the exit)
//
// Sentries patrol between waypoints given in tile coordinates; their routes
// are fixed so a patient courier can learn them.

import { TILE_CHARS } from './settings.js';

export const LEVELS = [
  {
    name: 'Level 1 — The Front Garden',
    rows: [
      '########################################',
      '#......................................#',
      '#..P...................................#',
      '#....HHHHH..........cc.................#',
      '#....HHHHH..........cc......HHHH.......#',
      '#...................cc......HHHH.......#',
      '#.........wwwww........................#',
      '#.........wwwww..........cc............#',
      '#........................cc............#',
      '#....cc...........#####................#',
      '#....cc...........#####.......HHHH.....#',
      '#.................#####.......HHHH.....#',
      '#....HHHHH.............................#',
      '#....HHHHH.........cc..................#',
      '#..................cc.......wwwww......#',
      '#...........................wwwww......#',
      '#......cc..............................#',
      '#......cc..........HHHHH..........X....#',
      '#..................HHHHH...............#',
      '#......................................#',
      '########################################',
    ],
    sentries: [
      { waypoints: [[8, 2], [34, 2]] },
      { waypoints: [[36, 4], [36, 17]] },
    ],
  },
  {
    name: 'Level 2 — The Statue Court',
    rows: [
      '########################################',
      '#......................................#',
      '#..P....cc....................cc.......#',
      '#.......cc.......HHHHH........cc.......#',
      '#................HHHHH.................#',
      '#.....#####............................#',
      '#.....#####.........cc.......#####.....#',
      '#...................cc.......#####.....#',
      '#..cc..........................#####...#',
      '#..cc..........HHHHHH..................#',
      '#..............HHHHHH.........cc.......#',
      '#..............HHHHHH.........cc.......#',
      '#.....cc...............................#',
      '#.....cc.......#####.......HHHHH.......#',
      '#..............#####.......HHHHH.......#',
      '#..........................HHHHH.......#',
      '#....wwwww.............................#',
      '#....wwwww..........cc.................#',
      '#...................cc..........X......#',
      '#......................................#',
      '########################################',
    ],
    sentries: [
      { waypoints: [[4, 19], [34, 19]] },
      { waypoints: [[24, 2], [24, 8]] },
      { waypoints: [[12, 13], [12, 18]] },
    ],
  },
  {
    name: 'Level 3 — The Walled Orchard',
    rows: [
      '########################################',
      '#..P...................................#',
      '#......................................#',
      '#....HHHHHHHHHHH.....HHHHHHHHHHHHH.....#',
      '#....H.........................H.......#',
      '#....H.....cc......wwwww.......H...cc..#',
      '#....H.....cc......wwwww.......H...cc..#',
      '#....H.........................H.......#',
      '#....HHHHHHHHHHHH.....HHHHHHHHHHH......#',
      '#......................................#',
      '#......cc..........#####..........cc...#',
      '#......cc..........#####..........cc...#',
      '#......................................#',
      '#....HHHHHHHHHHH.....HHHHHHHHHHHHH.....#',
      '#....H.........................H.......#',
      '#....H.....cc......wwwww.......H...cc..#',
      '#....H.....cc......wwwww.......H...cc..#',
      '#....H.........................H.......#',
      '#....HHHHHHHHHHHH.....HHHHHHHHHHH...X..#',
      '#......................................#',
      '########################################',
    ],
    sentries: [
      { waypoints: [[8, 2], [34, 2]] },
      { waypoints: [[6, 9], [34, 9]] },
      { waypoints: [[34, 12], [6, 12]] },
      { waypoints: [[8, 19], [32, 19]] },
    ],
  },
];

// Turn one level definition into a playable grid: a 2D array of tile letters,
// plus the pixel-centre positions of the courier start and the letter gate.
export function parseMap(level, tileSize) {
  const grid = [];
  let start = { x: tileSize, y: tileSize };
  let gate = { x: tileSize, y: tileSize };
  for (let row = 0; row < level.rows.length; row++) {
    const line = level.rows[row];
    const cells = [];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      if (ch === TILE_CHARS.START) {
        start = { x: col * tileSize + tileSize / 2, y: row * tileSize + tileSize / 2 };
        cells.push(TILE_CHARS.FLOOR);
      } else if (ch === TILE_CHARS.GATE) {
        gate = { x: col * tileSize + tileSize / 2, y: row * tileSize + tileSize / 2 };
        cells.push(TILE_CHARS.FLOOR);
      } else {
        cells.push(ch);
      }
    }
    grid.push(cells);
  }
  return { grid, start, gate };
}

// The tile letter at a pixel position, or a wall when outside the garden.
export function tileAtPixel(grid, tileSize, px, py) {
  const col = Math.floor(px / tileSize);
  const row = Math.floor(py / tileSize);
  if (row < 0 || row >= grid.length || col < 0 || col >= grid[row].length) {
    return TILE_CHARS.WALL;
  }
  return grid[row][col];
}
