// Moonlit Post — shared constants for every module.

// Canvas and tile geometry. The play field is a 40 by 21 tile garden under a
// 48 pixel HUD strip, drawn on a 1280 by 720 canvas.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 48;
export const TILE = 32;
export const COLS = 40;
export const ROWS = 21;

// Courier movement, in pixels per second. Sneaking is slower but quieter.
export const COURIER_WALK_SPEED = 150;
export const COURIER_SNEAK_SPEED = 78;
export const COURIER_RADIUS = 10;

// Sentry movement and lantern sight.
export const SENTRY_PATROL_SPEED = 62;
export const SENTRY_CHASE_SPEED = 138;
export const SENTRY_RADIUS = 10;
export const SENTRY_TURN_RATE = 2.6; // radians per second while patrolling
export const LANTERN_RANGE = 176; // pixels
export const LANTERN_HALF_ANGLE = 0.62; // radians either side of facing
export const CONE_RAYS = 28; // rays cast to shape one lantern cone

// Detection: how fast the alarm meter fills and empties.
export const SPOT_RATE_NEAR = 1.15; // meter per second at point blank
export const SPOT_RATE_FAR = 0.38; // meter per second at cone edge
export const SNEAK_SPOT_FACTOR = 0.55; // sneaking fills the meter slower
export const METER_DECAY = 0.34; // meter per second while unseen
export const SUSPICION_AT = 0.45; // meter level where a sentry turns suspicious
export const SEARCH_SECONDS = 2.6; // time sentries search the last seen spot
export const ALARM_MEMORY_SECONDS = 2.4; // unseen time before alarm cools down

// Palette: a moonlit estate garden at night.
export const PALETTE = {
  nightSky: '#0a0f1e',
  hudInk: '#e8dfc8',
  grassA: '#1d3a2a',
  grassB: '#234532',
  pathStone: '#3d4457',
  wallStone: '#59637a',
  wallTop: '#76839e',
  hedgeDark: '#14301f',
  hedgeLight: '#2c5c3a',
  crateWood: '#7a5a33',
  crateEdge: '#543d20',
  pondDeep: '#173a5e',
  pondShine: '#2a5a8a',
  lanternGlow: 'rgba(255, 196, 92, 0.30)',
  lanternGlowHot: 'rgba(255, 92, 72, 0.34)',
  gateGold: '#f4c95d',
  gateGlow: 'rgba(244, 201, 93, 0.35)',
  courierCloak: '#7c4dff',
  courierTrim: '#ffd166',
  sentryCoat: '#b33939',
  sentryTrim: '#f2e6c9',
  meterCalm: '#8fd18b',
  meterWarn: '#f4c95d',
  meterAlarm: '#ff6b5e',
};

// Tile characters used by the level maps in maps.js.
export const TILE_CHARS = {
  WALL: '#',
  HEDGE: 'H',
  CRATE: 'c',
  POND: 'w',
  FLOOR: '.',
  START: 'P',
  GATE: 'X',
};

// Tiles that block movement.
export const SOLID_TILES = new Set([
  TILE_CHARS.WALL,
  TILE_CHARS.HEDGE,
  TILE_CHARS.CRATE,
  TILE_CHARS.POND,
]);

// Tiles that block a lantern's light (ponds do not: light crosses water).
export const SIGHT_BLOCKERS = new Set([
  TILE_CHARS.WALL,
  TILE_CHARS.HEDGE,
  TILE_CHARS.CRATE,
]);
