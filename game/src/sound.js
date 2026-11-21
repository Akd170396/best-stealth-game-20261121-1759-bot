// Moonlit Post — tiny WebAudio sounds, all synthesized (no audio files):
// soft footsteps for the courier, heavier boots for sentries (louder as
// they near), a chime when a letter is delivered, and a low thud when
// the courier is caught. Audio starts on the first key press, as browsers
// require a gesture before sound.

let audioCtx = null;

export function ensureAudio() {
  if (audioCtx === null) {
    const Factory = window.AudioContext || window.webkitAudioContext;
    if (Factory) {
      audioCtx = new Factory();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function noiseBurst(duration, volume, filterFreq) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  const buffer = audioCtx.createBuffer(1, Math.max(1, Math.floor(audioCtx.sampleRate * duration)), audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  source.connect(filter).connect(gain).connect(audioCtx.destination);
  source.start(t);
}

function tone(freq, duration, volume, type = 'sine', when = 0) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime + when;
  const osc = audioCtx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + duration);
}

// The courier's own soft steps; sneaking steps are barely audible.
export function playCourierStep(sneaking) {
  noiseBurst(0.07, sneaking ? 0.03 : 0.08, 700);
}

// A sentry's boots: volume follows how close the sentry is (0 far, 1 near).
export function playSentryStep(closeness) {
  noiseBurst(0.09, 0.02 + closeness * 0.14, 420);
}

// Rising two-note chime when a letter reaches the gate.
export function playDeliveredChime() {
  tone(659.25, 0.22, 0.12);
  tone(987.77, 0.34, 0.12, 'sine', 0.14);
}

// Low thud and a descending tone when the courier is caught.
export function playCaughtThud() {
  noiseBurst(0.18, 0.22, 240);
  tone(196, 0.4, 0.14, 'triangle', 0.02);
  tone(147, 0.5, 0.12, 'triangle', 0.16);
}

// Short warning tick while a sentry's lantern is on the courier.
export function playSpottedTick() {
  tone(1174.66, 0.06, 0.05, 'square');
}
