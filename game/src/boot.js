// Moonlit Post — game boot and main loop. Holds the shared game state,
// advances the courier, sentries, detection meter and alarm each tick,
// plays the footstep sounds, and hands every frame to the painter.

import {
  TILE,
  SPOT_RATE_NEAR,
  SPOT_RATE_FAR,
  SNEAK_SPOT_FACTOR,
  METER_DECAY,
  ALARM_MEMORY_SECONDS,
} from './settings.js';
import { LEVELS, parseMap } from './maps.js';
import { createKeyboard, watchSneakKey } from './keyboard.js';
import { createCourier, moveCourier, courierDistanceTo } from './courier.js';
import { createSentry, updateSentry, noteGlimpse } from './sentries.js';
import { lanternVisibility } from './sight.js';
import { drawFrame } from './painter.js';
import {
  ensureAudio,
  playCourierStep,
  playSentryStep,
  playDeliveredChime,
  playCaughtThud,
  playSpottedTick,
} from './sound.js';
import { applyScenario, requestedShot } from './scenarios.js';

const GATE_REACH = 20; // pixels from the gate centre that count as delivered
const CAPTURE_REACH = 17; // pixels from a sentry that count as caught

function freshAlarm() {
  return { active: false, lastSeen: null, unseenFor: 0 };
}

function loadLevel(state, index) {
  const level = LEVELS[index];
  const parsed = parseMap(level, TILE);
  state.levelIndex = index;
  state.levelName = level.name;
  state.grid = parsed.grid;
  state.gate = parsed.gate;
  state.courier = createCourier(parsed.start);
  state.sentries = level.sentries.map((def) => createSentry(def));
  state.meter = 0;
  state.alarm = freshAlarm();
  state.phase = 'playing';
}

function createState() {
  const state = {
    phase: 'title',
    frozen: false,
    time: 0,
    levelIndex: 0,
    levelName: LEVELS[0].name,
    levelCount: LEVELS.length,
    delivered: 0,
    grid: null,
    gate: { x: 0, y: 0 },
    courier: null,
    sentries: [],
    meter: 0,
    alarm: freshAlarm(),
  };
  loadLevel(state, 0);
  state.phase = 'title';
  return state;
}

// How visible the courier is right now: the strongest lantern factor.
function strongestVisibility(state) {
  let best = 0;
  let bestSentry = null;
  for (const sentry of state.sentries) {
    const v = lanternVisibility(state.grid, sentry, state.courier);
    if (v > best) {
      best = v;
      bestSentry = sentry;
    }
  }
  return { factor: best, sentry: bestSentry };
}

function updateDetection(state, dt, sound) {
  const { factor, sentry } = strongestVisibility(state);
  if (factor > 0) {
    const rate = SPOT_RATE_FAR + (SPOT_RATE_NEAR - SPOT_RATE_FAR) * factor;
    const sneakFactor = state.courier.sneaking ? SNEAK_SPOT_FACTOR : 1;
    state.meter = Math.min(1, state.meter + rate * sneakFactor * dt);
    state.alarm.lastSeen = { x: state.courier.x, y: state.courier.y };
    state.alarm.unseenFor = 0;
    if (sentry) noteGlimpse(sentry, state.courier);
    sound.spottedTimer -= dt;
    if (sound.spottedTimer <= 0) {
      playSpottedTick();
      sound.spottedTimer = 0.28;
    }
    if (state.meter >= 1 && !state.alarm.active) {
      state.alarm.active = true;
    }
  } else {
    state.meter = Math.max(0, state.meter - METER_DECAY * dt);
    if (state.alarm.active) {
      state.alarm.unseenFor += dt;
      if (state.alarm.unseenFor >= ALARM_MEMORY_SECONDS) {
        state.alarm.active = false;
        state.meter = Math.min(state.meter, 0.4);
      }
    }
  }
}

function updateFootsteps(state, sound) {
  const courierBeat = Math.floor(state.courier.stepPhase);
  if (state.courier.moving && courierBeat !== sound.courierBeat) {
    playCourierStep(state.courier.sneaking);
    sound.courierBeat = courierBeat;
  }
  for (const sentry of state.sentries) {
    const beat = Math.floor(sentry.stepPhase);
    if (beat !== sentry.heardBeat) {
      sentry.heardBeat = beat;
      const dist = courierDistanceTo(state.courier, sentry);
      const closeness = Math.max(0, 1 - dist / 420);
      if (closeness > 0.05) {
        playSentryStep(closeness);
      }
    }
  }
}

function updatePlaying(state, keyboard, pointer, dt, sound) {
  let vector = keyboard.moveVector();
  if (pointer.down) {
    const dx = pointer.x - state.courier.x;
    const dy = pointer.y - state.courier.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 8) {
      vector = { x: dx / dist, y: dy / dist };
    }
  }
  moveCourier(state.courier, state.grid, vector, keyboard.shiftDown === true, dt);
  updateDetection(state, dt, sound);
  for (const sentry of state.sentries) {
    updateSentry(sentry, state.grid, state.alarm, state.meter, dt);
  }
  updateFootsteps(state, sound);

  for (const sentry of state.sentries) {
    if (courierDistanceTo(state.courier, sentry) < CAPTURE_REACH) {
      state.phase = 'caught';
      playCaughtThud();
      return;
    }
  }
  if (courierDistanceTo(state.courier, state.gate) < GATE_REACH) {
    state.delivered += 1;
    playDeliveredChime();
    state.phase = state.levelIndex + 1 >= LEVELS.length ? 'gameComplete' : 'levelComplete';
  }
}

function handlePhaseKeys(state, keyboard) {
  if (state.phase === 'title' && keyboard.takePress('Enter')) {
    loadLevel(state, 0);
    state.delivered = 0;
  } else if (state.phase === 'caught' && keyboard.takePress('Enter')) {
    loadLevel(state, state.levelIndex);
  } else if (state.phase === 'levelComplete' && keyboard.takePress('Enter')) {
    loadLevel(state, state.levelIndex + 1);
  } else if (state.phase === 'gameComplete' && keyboard.takePress('Enter')) {
    state.delivered = 0;
    loadLevel(state, 0);
  }
  if (state.phase === 'playing' && keyboard.takePress('KeyR')) {
    loadLevel(state, state.levelIndex);
  }
}

function main() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const state = createState();
  const keyboard = createKeyboard();
  watchSneakKey(keyboard);
  const sound = { courierBeat: 0, spottedTimer: 0 };

  // Mouse play: hold the button and the courier walks toward the pointer.
  const pointer = { down: false, x: 0, y: 0 };
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.down = true;
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top - 48;
    ensureAudio();
  });
  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top - 48;
  });
  window.addEventListener('pointerup', () => {
    pointer.down = false;
  });
  window.addEventListener('keydown', () => ensureAudio());

  // Screenshot staging: freeze one composed frame and stop there.
  const shot = requestedShot();
  if (shot && applyScenario(state, shot)) {
    drawFrame(ctx, state);
    window.__shotReady = true;
    return;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    state.time += dt;
    handlePhaseKeys(state, keyboard);
    if (state.phase === 'playing') {
      updatePlaying(state, keyboard, pointer, dt, sound);
    }
    drawFrame(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

main();
