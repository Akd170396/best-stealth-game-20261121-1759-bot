// Keyboard input: tracks which keys are held and turns them into a movement
// wish for the player. Sneaking is Shift; Enter and Space confirm screens.

const held = new Set();
let confirmPressed = false;

export function installInput() {
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    if ((key === 'enter' || key === ' ') && !held.has(key)) confirmPressed = true;
    held.add(key);
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.key.toLowerCase());
  });
  window.addEventListener('blur', () => held.clear());
}

// The direction the player wants to move this frame, normalised, plus whether
// they are sneaking (Shift held) — slow and silent instead of fast and audible.
export function readMoveWish() {
  let x = 0;
  let y = 0;
  if (held.has('a') || held.has('arrowleft')) x -= 1;
  if (held.has('d') || held.has('arrowright')) x += 1;
  if (held.has('w') || held.has('arrowup')) y -= 1;
  if (held.has('s') || held.has('arrowdown')) y += 1;
  const len = Math.hypot(x, y);
  if (len > 0) {
    x /= len;
    y /= len;
  }
  return {
    x,
    y,
    moving: len > 0,
    sneaking: held.has('shift'),
  };
}

// True once per Enter/Space press, for title, caught and clear screens.
export function consumeConfirm() {
  const was = confirmPressed;
  confirmPressed = false;
  return was;
}
