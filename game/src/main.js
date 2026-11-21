// The Quiet Vault — game loop and screen state machine. Owns the current
// level, player, guards and detection state; wires their events to sound and
// screen changes; and, when opened with ?shot=<name>, freezes a staged moment
// from shots.js instead of starting play (used for the entry's screenshots).

import { VIEW } from './config.js';
import { LEVELS } from './levels.js';
import { buildLevel } from './world.js';
import { installInput, readMoveWish, consumeConfirm } from './input.js';
import { makePlayer, updatePlayer } from './player.js';
import { makeGuard, updateGuard } from './guards.js';
import { makeDetection, updateDetection } from './detection.js';
import {
  initAudio,
  playAlarmSting,
  playCaughtThud,
  playClearJingle,
  playGemChime,
  playGuardFootstep,
  playPlayerFootstep,
  playSuspicionTick,
} from './audio.js';
import { drawCaught, drawClear, drawGame, drawTitle } from './render.js';
import { SHOT_LEVELS, stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const statusLine = document.getElementById('status');

function announce(text) {
  if (statusLine) statusLine.textContent = text;
}

function loadFloor(index) {
  const definition = LEVELS[index];
  const level = buildLevel(definition);
  return {
    screen: 'play',
    levelIndex: index,
    level,
    player: makePlayer(level.playerStart),
    guards: definition.guards.map((g) => makeGuard(g.patrol)),
    detection: makeDetection(),
    time: 0,
    elapsed: 0,
  };
}

const state = loadFloor(0);
state.screen = 'title';

const shotName = new URLSearchParams(window.location.search).get('shot');
let frozen = false;
if (shotName && shotName in SHOT_LEVELS) {
  const staged = loadFloor(SHOT_LEVELS[shotName]);
  Object.assign(state, staged);
  stageShot(shotName, state);
  state.time = 1.0;
  frozen = true;
}

installInput();
window.addEventListener('keydown', initAudio, { once: true });
window.addEventListener('pointerdown', initAudio, { once: true });

const events = {
  onSuspicious() {
    playSuspicionTick();
  },
  onAlarm() {
    playAlarmSting();
    announce('Alarm! Break their line of sight.');
  },
  onCalm() {
    announce('The alarm cools down. You are hidden again.');
  },
  onCaught() {
    if (state.screen !== 'play') return;
    state.screen = 'caught';
    playCaughtThud();
    announce('Caught. Press Enter to try the floor again.');
  },
};

function update(dt) {
  state.time += dt;
  if (state.screen === 'title') {
    // Let the patrols drift behind the title so the vault feels alive.
    for (const guard of state.guards) updateGuard(guard, state.level, state.player, dt, () => {});
    if (consumeConfirm()) {
      state.screen = 'play';
      announce(state.level.briefing);
    }
    return;
  }
  if (state.screen === 'caught') {
    if (consumeConfirm()) Object.assign(state, loadFloor(state.levelIndex));
    return;
  }
  if (state.screen === 'clear') {
    if (consumeConfirm()) {
      const next = state.levelIndex + 1;
      Object.assign(state, loadFloor(next < LEVELS.length ? next : 0));
    }
    return;
  }

  state.elapsed += dt;
  const wish = readMoveWish();
  updatePlayer(state.player, state.level, wish, dt, (p) => playPlayerFootstep(p.sneaking));
  for (const guard of state.guards) {
    updateGuard(guard, state.level, state.player, dt, (g) =>
      playGuardFootstep(Math.hypot(g.x - state.player.x, g.y - state.player.y)),
    );
  }
  updateDetection(state.detection, state.guards, state.level, state.player, dt, events);

  const gem = state.level.gem;
  if (gem && !gem.taken && Math.hypot(gem.x - state.player.x, gem.y - state.player.y) < 24) {
    gem.taken = true;
    state.player.hasGem = true;
    playGemChime();
    announce('Gem taken. Reach the exit.');
  }
  const exit = state.level.exit;
  if (exit && state.player.hasGem && Math.hypot(exit.x - state.player.x, exit.y - state.player.y) < 26) {
    state.screen = 'clear';
    playClearJingle();
    announce('Floor cleared. Press Enter to continue.');
  }
}

function render() {
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'caught') drawCaught(ctx, state);
  else if (state.screen === 'clear') drawClear(ctx, state, state.levelIndex === LEVELS.length - 1);
  else drawGame(ctx, state);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!frozen) update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
