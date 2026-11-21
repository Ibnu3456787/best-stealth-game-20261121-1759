// The screenshot scenes behind ?shot=cover|patrol|alarm|manual. Each one plays
// the real rules forward from a fresh world for fixed 1/60s steps, steered
// by a small autopilot that holds the same keys a player would — so the
// frame is what a short game really looks like, and the same seed always
// gives the same frame. The driver is a fake input device: it steers the
// real world with goTo / follow / waitUntil / runFor helpers.
//
// goTo stops within 12px of its target and gives up after a timeout.
// Steering uses an 8px dead zone: a target closer than that on an axis does
// not count as a direction. runFor takes a *direction* (not a target), so a
// short sprint still moves even though its delta is small.
import { STEP, STEER_DEAD_ZONE } from './config.js';
import { createFakeInput } from './input.js';
import { SCREEN_PLAY } from './world.js';

const ARRIVE = 12;
const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];

function releaseMove(input) {
  for (const key of MOVE_KEYS) input.release(key);
}

function steer(input, dx, dy, primaryVertical) {
  // One axis at a time, the longer axis first, chosen once per leg: the
  // L-shaped path this gives is what keeps the cover route's timing clear
  // of the patrols, and a leg never re-decides its axis mid-way (re-deciding
  // every step weaves a staircase down the diagonal — straight through a
  // crate corner the game then has to slide around). An 8px dead zone per
  // axis: a delta smaller than that does not count as a direction on it.
  releaseMove(input);
  if (primaryVertical) {
    if (dy > STEER_DEAD_ZONE) input.press('KeyS');
    else if (dy < -STEER_DEAD_ZONE) input.press('KeyW');
    else if (dx > STEER_DEAD_ZONE) input.press('KeyD');
    else if (dx < -STEER_DEAD_ZONE) input.press('KeyA');
  } else {
    if (dx > STEER_DEAD_ZONE) input.press('KeyD');
    else if (dx < -STEER_DEAD_ZONE) input.press('KeyA');
    else if (dy > STEER_DEAD_ZONE) input.press('KeyS');
    else if (dy < -STEER_DEAD_ZONE) input.press('KeyW');
  }
}

function holdDirection(input, dir) {
  releaseMove(input);
  if (dir.x > 0) input.press('KeyD');
  else if (dir.x < 0) input.press('KeyA');
  if (dir.y > 0) input.press('KeyS');
  else if (dir.y < 0) input.press('KeyW');
}

function stepWorld(world, input, steps) {
  for (let i = 0; i < steps; i += 1) world.step(STEP, input);
}

// Walk (or crouch-walk, with `crouch` set) to a point. Returns true when the
// player arrives, false on timeout.
export function goTo(world, input, x, y, options = {}) {
  const maxSeconds = options.maxSeconds ?? 40;
  const steps = Math.floor(maxSeconds / STEP);
  if (options.crouch) input.press('ShiftLeft');
  else input.release('ShiftLeft');
  // The longer axis leads the whole leg (see steer).
  const first = world.state.player;
  const primaryVertical = Math.abs(y - first.y) >= Math.abs(x - first.x);
  for (let i = 0; i < steps; i += 1) {
    const p = world.state.player;
    const dx = x - p.x;
    const dy = y - p.y;
    if (Math.hypot(dx, dy) <= ARRIVE) {
      releaseMove(input);
      return true;
    }
    steer(input, dx, dy, primaryVertical);
    world.step(STEP, input);
    if (world.state.screen !== SCREEN_PLAY) {
      releaseMove(input);
      return false;
    }
  }
  releaseMove(input);
  return false;
}

export function follow(world, input, points, options = {}) {
  for (const point of points) {
    if (!goTo(world, input, point.x, point.y, options)) return false;
  }
  return true;
}

// Step with no input until `condition` holds on the world snapshot, or the
// timeout runs out. Returns true when the condition was met.
export function waitUntil(world, input, condition, maxSeconds = 60) {
  releaseMove(input);
  const steps = Math.floor(maxSeconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    world.step(STEP, input);
    if (condition(world.snapshot())) return true;
    if (world.state.screen !== SCREEN_PLAY) return false;
  }
  return false;
}

// Hold a direction (and optionally crouch) for a fixed time.
export function runFor(world, input, seconds, dir, options = {}) {
  if (options.crouch) input.press('ShiftLeft');
  else input.release('ShiftLeft');
  holdDirection(input, dir);
  stepWorld(world, input, Math.floor(seconds / STEP));
  releaseMove(input);
}

function crouchFor(world, input, seconds) {
  input.press('ShiftLeft');
  releaseMove(input);
  stepWorld(world, input, Math.floor(seconds / STEP));
}

// Set `world` to the named scene and return the screen to draw over it plus
// a snapshot of the end state, for the screenshot verifier to check.
export function stageShot(name, world) {
  const input = createFakeInput();
  if (name === 'cover') {
    // Floor 1, crouched the long way round to the first page, ending
    // crouched by the low shelf.
    world.debug.startFloorAndPlay(0);
    follow(world, input, [
      { x: 240, y: 390 },
      { x: 620, y: 390 },
      { x: 620, y: 700 },
      { x: 620, y: 390 },
      { x: 700, y: 390 },
      { x: 700, y: 690 },
    ], { crouch: true });
    input.press('ShiftLeft');
    return { screen: SCREEN_PLAY, snapshot: world.snapshot() };
  }
  if (name === 'patrol') {
    // Floor 1, observe mode on: walk into a cone, wait for the "?" to
    // build, then run clear and crouch.
    world.debug.startFloorAndPlay(0);
    world.state.observe = true;
    follow(world, input, [
      { x: 240, y: 390 },
      { x: 470, y: 395 },
    ]);
    waitUntil(world, input, (snap) => snap.maxSuspicion >= 50, 40);
    goTo(world, input, 450, 300);
    crouchFor(world, input, 0.2);
    return { screen: SCREEN_PLAY, snapshot: world.snapshot() };
  }
  if (name === 'alarm') {
    // Floor 2: walk into the patrols until the alarm sounds, then sprint
    // south and freeze mid-flight.
    world.debug.startFloorAndPlay(1);
    follow(world, input, [
      { x: 740, y: 700 },
      { x: 740, y: 450 },
      { x: 740, y: 540 },
      { x: 500, y: 540 },
      { x: 350, y: 540 },
      { x: 350, y: 380 },
    ]);
    waitUntil(world, input, (snap) => snap.alarm.active, 60);
    runFor(world, input, 0.4, { x: 0, y: 1 });
    return { screen: SCREEN_PLAY, snapshot: world.snapshot() };
  }
  if (name === 'manual') {
    // Floor 1: let the patrols run for 4s, then open the Field Manual.
    world.debug.startFloorAndPlay(0);
    runFor(world, input, 4, { x: 0, y: 0 });
    world.state.manual = true;
    return { screen: SCREEN_PLAY, snapshot: world.snapshot() };
  }
  // Any other name: the title screen over the ambient archive.
  world.debug.startFloorAndPlay(0);
  world.state.screen = 'title';
  runFor(world, input, 2, { x: 0, y: 0 });
  return { screen: 'title', snapshot: world.snapshot() };
}
