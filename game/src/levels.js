// The three floors of the vault. Each level is a grid of characters:
//   # wall   C crate (cover: blocks sight and movement)   . floor   r rug
//   P player start   G the gem   E exit door
// Guards are listed per level with patrol waypoints in tile coordinates; a guard
// walks its waypoints in order, pauses at each, then walks back the way it came.

export const LEVELS = [
  {
    name: 'Floor 1 — The Anteroom',
    briefing: 'Take the gem from the north gallery and slip out the east door.',
    grid: [
      '########################',
      '#......#.......#.......#',
      '#.P....#...G...#...C...#',
      '#......#.......#.......#',
      '#..CC..#...C...#...C...#',
      '#......#.......#.......#',
      '#......###.#####...C...#',
      '#......................#',
      '#..C.....C.....C.......#',
      '#......................#',
      '#......#####.###...E...#',
      '#......#.......#.......#',
      '#..C...#...C...#...C...#',
      '########################',
    ],
    guards: [
      { patrol: [[3, 7], [20, 7]] },
      { patrol: [[20, 1], [20, 4]] },
    ],
  },
  {
    name: 'Floor 2 — The Counting Hall',
    briefing: 'Three lanterns sweep the hall. Patience beats speed.',
    grid: [
      '########################',
      '#......#........#......#',
      '#.P....#...CC...#..G...#',
      '#......#........#......#',
      '#..C...#....C...##.###.#',
      '#......#........#......#',
      '###.####..####..###.####',
      '#......................#',
      '#..CC....C....C....CC..#',
      '#......................#',
      '#....C......C......C...#',
      '#......................#',
      '#..C....C....C.....E...#',
      '########################',
    ],
    guards: [
      { patrol: [[2, 7], [21, 7]] },
      { patrol: [[10, 1], [10, 5]] },
      { patrol: [[4, 11], [19, 11]] },
    ],
  },
  {
    name: 'Floor 3 — The Inner Vault',
    briefing: 'Four lanterns, one gem. Leave no alarm behind you.',
    grid: [
      '########################',
      '#....#......#......#...#',
      '#.P..#..G...#..C...#...#',
      '#....#......#......#.#.#',
      '#.CC.#..C...#......#...#',
      '#....#......###.####...#',
      '#....###.####..........#',
      '#......................#',
      '#..C....C....C....C....#',
      '#......................#',
      '####.#####.####.####.###',
      '#......................#',
      '#..C....C....C.....E...#',
      '########################',
    ],
    guards: [
      { patrol: [[2, 7], [21, 7]] },
      { patrol: [[9, 1], [9, 5]] },
      { patrol: [[17, 1], [17, 4]] },
      { patrol: [[3, 11], [20, 11]] },
    ],
  },
];
