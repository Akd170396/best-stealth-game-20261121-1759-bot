// Sound, synthesised with WebAudio so the game ships no audio files: soft
// footsteps (yours, and the guards' — louder as they near, which tells you
// where they are), a suspicion tick, the alarm sting, and the gem's chime.

let ctx = null;
let master = null;

export function initAudio() {
  if (ctx) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  ctx = new AudioCtor();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
}

function blip(freq, seconds, type, volume, slideTo) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + seconds);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + seconds + 0.02);
}

function noiseBurst(seconds, volume, lowpassHz) {
  if (!ctx) return;
  const t = ctx.currentTime;
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpassHz;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
  source.connect(filter).connect(gain).connect(master);
  source.start(t);
}

// The player's own step: a muffled tap, quieter and duller while sneaking.
export function playPlayerFootstep(sneaking) {
  noiseBurst(0.07, sneaking ? 0.05 : 0.13, sneaking ? 500 : 900);
}

// A guard's step, its volume set by distance so you can hear patrols approach.
export function playGuardFootstep(distancePx) {
  const volume = Math.max(0, 0.16 * (1 - distancePx / 460));
  if (volume > 0.005) noiseBurst(0.08, volume, 700);
}

export function playSuspicionTick() {
  blip(660, 0.09, 'triangle', 0.12);
}

export function playAlarmSting() {
  blip(880, 0.35, 'sawtooth', 0.16, 440);
  blip(1174, 0.35, 'square', 0.07, 587);
}

export function playGemChime() {
  blip(1046, 0.18, 'sine', 0.16);
  blip(1568, 0.3, 'sine', 0.12);
}

export function playClearJingle() {
  blip(523, 0.16, 'triangle', 0.14);
  blip(659, 0.16, 'triangle', 0.14);
  blip(784, 0.34, 'triangle', 0.16);
}

export function playCaughtThud() {
  blip(160, 0.4, 'sine', 0.25, 60);
  noiseBurst(0.2, 0.2, 400);
}
