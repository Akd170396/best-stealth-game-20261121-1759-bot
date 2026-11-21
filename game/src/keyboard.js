// Moonlit Post — keyboard input. WASD or arrow keys move the courier,
// Shift sneaks (slower, quieter), R restarts the level, N skips ahead
// after a delivery, and Enter confirms on the title and end screens.

const MOVE_KEYS = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

export function createKeyboard() {
  const held = new Set();
  const pressed = new Set();
  const keyboard = {
    shiftDown: false,
    // Unit-ish movement vector from the keys currently held down.
    moveVector() {
      let x = 0;
      let y = 0;
      if (held.has('left')) x -= 1;
      if (held.has('right')) x += 1;
      if (held.has('up')) y -= 1;
      if (held.has('down')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.SQRT2;
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    // True once for a fresh key press; consumes it.
    takePress(code) {
      if (pressed.has(code)) {
        pressed.delete(code);
        return true;
      }
      return false;
    },
    clearPresses() {
      pressed.clear();
    },
  };

  window.addEventListener('keydown', (event) => {
    const dir = MOVE_KEYS[event.code];
    if (dir) {
      held.add(dir);
      event.preventDefault();
    }
    if (!event.repeat) {
      pressed.add(event.code);
    }
    if (event.code === 'Space') {
      event.preventDefault();
    }
  });

  window.addEventListener('keyup', (event) => {
    const dir = MOVE_KEYS[event.code];
    if (dir) {
      held.delete(dir);
    }
  });

  window.addEventListener('blur', () => {
    held.clear();
  });

  return keyboard;
}

// Shift is tracked separately because it is a held modifier, not a direction.
export function watchSneakKey(keyboardState) {
  window.addEventListener('keydown', (event) => {
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      keyboardState.shiftDown = true;
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      keyboardState.shiftDown = false;
    }
  });
}
