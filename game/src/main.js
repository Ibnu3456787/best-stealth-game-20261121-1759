// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps (several in a slow frame, none in a fast one), and the
// renderer paints what is there. The game moves between title, brief, play,
// paused, caught, level clear and victory, with the Field Manual hanging
// over play.
//
// ?seed=N fixes the floor shading. ?shot=cover|patrol|alarm|manual (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot. The debug hook
// window.SHADOWSHIFT exposes the world, so a screenshot run can read the
// staged end state back and check it.
import { STEP, VIEW } from './config.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

// The longest frame the loop catches up on; a longer stall (a hidden tab)
// is dropped, not replayed.
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();
const world = createWorld(createRandom(seed), audio);
const renderer = createRenderer(canvas);

// A line screen readers announce when the screen changes.
function announce(message) {
  if (status) status.textContent = message;
}

window.SHADOWSHIFT = { world, seed };

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else {
      window.__shotReady = true;
      window.__shotSnapshot = scene.snapshot;
    }
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, VIEW);
  let screen = world.state.screen;
  let accumulator = 0;
  let last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    if (world.state.screen === 'title' || world.state.screen === 'play' || world.state.screen === 'brief') {
      while (accumulator >= STEP) {
        world.step(STEP, input);
        accumulator -= STEP;
        if (world.state.screen !== 'title' && world.state.screen !== 'play' && world.state.screen !== 'brief') break;
      }
    } else {
      accumulator = 0;
      // Screens that freeze the world still take their advance key.
      world.step(STEP, input);
    }
    if (world.state.screen !== screen) {
      screen = world.state.screen;
      announce(`SHADOWSHIFT: ${screen}.`);
    }
    renderer.draw(world.state);
  }

  // Leaving the tab pauses a running game rather than letting guards close
  // in unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && world.state.screen === 'play') world.state.screen = 'paused';
  });

  announce('SHADOWSHIFT. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
