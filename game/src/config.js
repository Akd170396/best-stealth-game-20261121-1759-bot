// Tuning constants and the colour palette for The Quiet Vault.
// One place for every number the other modules share, so the feel of the game
// (speeds, cone sizes, detection rates) can be adjusted without hunting code.

export const VIEW = {
  width: 1280,
  height: 720,
  tile: 40, // pixels per level tile
  hudTop: 64, // pixels of HUD strip above the playfield
};

export const PLAYER = {
  radius: 13,
  walkSpeed: 172, // px/s, audible
  sneakSpeed: 92, // px/s, silent
  noiseRadius: 118, // px: guards hear walking inside this ring
  catchRadius: 26, // px: a chasing guard this close has caught you
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 78,
  chaseSpeed: 196,
  searchSpeed: 118,
  coneRange: 232, // px of flashlight reach
  coneHalfAngle: 0.62, // radians either side of facing
  coneRays: 26, // rays cast to shape the visible cone polygon
  pauseAtWaypoint: 1.1, // seconds standing at each patrol point
  turnRate: 2.6, // radians per second
};

export const DETECTION = {
  fillNear: 1.5, // meter per second at point blank, dead centre of a cone
  fillFar: 0.38, // meter per second at the cone's rim
  drainRate: 0.34, // meter per second regained while hidden
  suspiciousAt: 0.35, // guards start turning toward you above this
  alarmAt: 1.0, // full meter: alarm, guards give chase
  calmAfter: 6.0, // seconds unseen before the alarm cools down
};

export const COLOURS = {
  page: '#07090f',
  floorA: '#1b2133',
  floorB: '#171d2c',
  floorLine: '#11151f',
  rug: '#3a2b4a',
  wall: '#39415c',
  wallTop: '#4b5578',
  wallEdge: '#20263c',
  crate: '#6d5433',
  crateTop: '#87683f',
  crateLine: '#4d3a22',
  playerCloak: '#2e7d6b',
  playerTrim: '#9fe8d2',
  guardCoat: '#8c3b46',
  guardTrim: '#f2c14e',
  gem: '#53e0ff',
  gemCore: '#e8fbff',
  exit: '#39d98a',
  exitDark: '#14532d',
  coneCalm: 'rgba(255, 205, 92, 0.42)',
  coneCalmEdge: 'rgba(255, 226, 150, 0.75)',
  coneSuspicious: 'rgba(255, 170, 80, 0.38)',
  coneAlarm: 'rgba(255, 80, 70, 0.40)',
  coneAlarmEdge: 'rgba(255, 120, 100, 0.7)',
  text: '#e8ecf6',
  textDim: '#9aa5c4',
  hudBar: '#0d1120',
  meterFill: '#ffb347',
  meterHot: '#ff5a4e',
};
