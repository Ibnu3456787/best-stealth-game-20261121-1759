// Keyboard and mouse driver. Held keys give a steering direction; one-shot
// presses (advance a screen, pause, open the manual) are queued and taken
// once by the loop, so a press between two frames is never lost or counted
// twice. Mouse position is converted into playfield coordinates so a coin
// throw aims where the cursor points. A fake input with the same shape
// drives the scripted screenshot scenes and the headless tests.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MANUAL = 4;
export const ACTION_OBSERVE = 8;
export const ACTION_RESTART = 16;
export const ACTION_MUTE = 32;
export const ACTION_CROUCH_HELD = 64;

const MOVE_KEYS = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']);
const CROUCH_KEYS = new Set(['ShiftLeft', 'ShiftRight', 'KeyC']);
const CONFIRM_KEYS = new Set(['Space', 'Enter']);
const COIN_KEYS = new Set(['KeyF']);

export function createInput(canvas, view) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 640, y: 400, inside: false };
  const coinThrows = [];

  function toField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = view.width / rect.width;
    const scaleY = view.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  window.addEventListener('keydown', (event) => {
    if (MOVE_KEYS.has(event.code) || CROUCH_KEYS.has(event.code)) {
      keys.add(event.code);
      if (!event.repeat) pressed.add(event.code);
      event.preventDefault();
      return;
    }
    if (CONFIRM_KEYS.has(event.code)) {
      if (!event.repeat) pressed.add(event.code);
      event.preventDefault();
      return;
    }
    if (event.code === 'KeyP') {
      if (!event.repeat) pressed.add(event.code);
      return;
    }
    if (event.code === 'KeyH') {
      if (!event.repeat) pressed.add(event.code);
      return;
    }
    if (event.code === 'KeyO') {
      if (!event.repeat) pressed.add(event.code);
      return;
    }
    if (event.code === 'KeyR') {
      if (!event.repeat) pressed.add(event.code);
      return;
    }
    if (event.code === 'KeyM') {
      if (!event.repeat) pressed.add(event.code);
      return;
    }
    if (COIN_KEYS.has(event.code)) {
      if (!event.repeat) pressed.add(event.code);
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  // A key released while the tab is hidden never sends keyup: let go of
  // everything on blur so the player does not keep walking.
  window.addEventListener('blur', () => {
    keys.clear();
  });
  canvas.addEventListener('pointermove', (event) => {
    const p = toField(event.clientX, event.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.inside = true;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const p = toField(event.clientX, event.clientY);
    mouse.x = p.x;
    mouse.y = p.y;
    if (event.button === 2) {
      coinThrows.push({ x: p.x, y: p.y });
    } else {
      pressed.add('PointerConfirm');
    }
    event.preventDefault();
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  return {
    keys,
    pressed,
    mouse,
    coinThrows,
    // Steering direction from the held keys: -1, 0 or 1 on each axis.
    direction() {
      const left = keys.has('KeyA') || keys.has('ArrowLeft');
      const right = keys.has('KeyD') || keys.has('ArrowRight');
      const up = keys.has('KeyW') || keys.has('ArrowUp');
      const down = keys.has('KeyS') || keys.has('ArrowDown');
      return { x: (right ? 1 : 0) - (left ? 1 : 0), y: (down ? 1 : 0) - (up ? 1 : 0) };
    },
    crouchHeld() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyC');
    },
    // The one-shot presses since the last call; each is reported once.
    takePressed() {
      const taken = new Set(pressed);
      pressed.clear();
      return taken;
    },
    takeCoinThrows() {
      const taken = coinThrows.splice(0, coinThrows.length);
      return taken;
    },
  };
}

// A scripted stand-in for tests and staged screenshots: the caller sets keys
// and the mouse directly, and the world reads it exactly like a real input.
export function createFakeInput() {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 640, y: 400, inside: true };
  const coinThrows = [];
  return {
    keys,
    pressed,
    mouse,
    coinThrows,
    press(code) {
      keys.add(code);
      pressed.add(code);
    },
    release(code) {
      keys.delete(code);
    },
    tap(code) {
      pressed.add(code);
    },
    setMouse(x, y) {
      mouse.x = x;
      mouse.y = y;
      mouse.inside = true;
    },
    queueCoinThrow(x, y) {
      coinThrows.push({ x, y });
    },
    direction() {
      const left = keys.has('KeyA') || keys.has('ArrowLeft');
      const right = keys.has('KeyD') || keys.has('ArrowRight');
      const up = keys.has('KeyW') || keys.has('ArrowUp');
      const down = keys.has('KeyS') || keys.has('ArrowDown');
      return { x: (right ? 1 : 0) - (left ? 1 : 0), y: (down ? 1 : 0) - (up ? 1 : 0) };
    },
    crouchHeld() {
      return keys.has('ShiftLeft') || keys.has('ShiftRight') || keys.has('KeyC');
    },
    takePressed() {
      const taken = new Set(pressed);
      pressed.clear();
      return taken;
    },
    takeCoinThrows() {
      return coinThrows.splice(0, coinThrows.length);
    },
  };
}
