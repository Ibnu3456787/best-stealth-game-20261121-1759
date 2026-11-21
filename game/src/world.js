// The game state machine and all update logic — the big module. Screens:
// title → brief → play → (caught | levelclear) → brief (next floor) → … →
// victory. Pause (P) and the Field Manual (H) hang off play. Everything
// here is pure logic: no canvas, no DOM, no Math.random. The only browser
// touch is the optional audio hooks object, which defaults to silence, so
// the headless tests can drive this module in plain Node.
import { ALARM, GUARD, HIDE, LIGHT, NOISE, PLAYER, ratingFor } from './config.js';
import { LEVELS, allSolids, pointInRect } from './levels.js';
import { canSee } from './vision.js';
import {
  GUARD_CHASE,
  GUARD_INVESTIGATE,
  GUARD_PATROL,
  GUARD_RETURN,
  createGuard,
  moveToward,
  nearestWaypoint,
  sendHome,
  sendToChase,
  sendToInvestigate,
  turnToward,
  updatePatrol,
} from './patrol.js';
import { createAlarm, suspicionRate, triggerAlarm, updateAlarm, updateSuspicion } from './suspicion.js';
import { addNoise, createNoise, guardHears, throwCoin, updateNoise } from './noise.js';
import { createSilentAudio } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_BRIEF = 'brief';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_LEVEL_CLEAR = 'levelclear';
export const SCREEN_VICTORY = 'victory';

const CONFIRM_CODES = new Set(['Space', 'Enter', 'PointerConfirm']);

// Push a circle out of any solid it overlaps, along the shortest escape.
function resolveOverlap(entity, radius, solids) {
  for (let i = 0; i < solids.length; i += 1) {
    const r = solids[i];
    const cx = Math.max(r.x, Math.min(entity.x, r.x + r.w));
    const cy = Math.max(r.y, Math.min(entity.y, r.y + r.h));
    let dx = entity.x - cx;
    let dy = entity.y - cy;
    let dist = Math.hypot(dx, dy);
    if (dist >= radius) continue;
    if (dist === 0) {
      // Centre inside the rectangle: push out along the smallest penetration.
      const left = entity.x - r.x;
      const right = r.x + r.w - entity.x;
      const top = entity.y - r.y;
      const bottom = r.y + r.h - entity.y;
      const min = Math.min(left, right, top, bottom);
      if (min === left) entity.x = r.x - radius;
      else if (min === right) entity.x = r.x + r.w + radius;
      else if (min === top) entity.y = r.y - radius;
      else entity.y = r.y + r.h + radius;
      continue;
    }
    dx /= dist;
    dy /= dist;
    dist = radius - dist;
    entity.x += dx * dist;
    entity.y += dy * dist;
  }
}

export function createWorld(random, audio) {
  const sound = audio ?? createSilentAudio();
  const state = {
    screen: SCREEN_TITLE,
    floorIndex: 0,
    level: LEVELS[0],
    solids: allSolids(LEVELS[0]),
    player: { x: 80, y: 700, facing: -Math.PI / 2, crouch: false, hidden: false, moving: false },
    guards: [],
    pages: [],
    floorCoins: [],
    coins: NOISE.startCoins,
    alarm: createAlarm(),
    noise: createNoise(),
    floorTime: 0,
    totalTime: 0,
    totalAlarms: 0,
    floorAlarms: 0,
    peakSuspicion: 0,
    lastSeen: null,
    observe: false,
    manual: false,
    muted: false,
    toasts: [],
    rating: null,
    floorResults: [],
  };

  function addToast(text) {
    state.toasts.unshift({ text, ttl: 3.5 });
    if (state.toasts.length > 4) state.toasts.pop();
  }

  function startFloor(index) {
    const level = LEVELS[index];
    state.floorIndex = index;
    state.level = level;
    state.solids = allSolids(level);
    state.player.x = level.start.x;
    state.player.y = level.start.y;
    state.player.facing = -Math.PI / 2;
    state.player.crouch = false;
    state.player.hidden = false;
    state.player.moving = false;
    state.guards = level.guards.map((def, i) => createGuard(def, i));
    state.pages = level.pages.map((p) => ({ x: p.x, y: p.y, taken: false }));
    state.floorCoins = level.coins.map((c) => ({ x: c.x, y: c.y, taken: false }));
    state.alarm = createAlarm();
    state.noise = createNoise();
    state.floorTime = 0;
    state.floorAlarms = 0;
    state.peakSuspicion = 0;
    state.lastSeen = null;
    state.toasts = [];
    state.rating = null;
    state.manual = false;
  }

  function reset() {
    state.coins = NOISE.startCoins;
    state.totalTime = 0;
    state.totalAlarms = 0;
    state.floorResults = [];
    state.observe = false;
    startFloor(0);
    state.screen = SCREEN_TITLE;
  }

  function pagesTaken() {
    let n = 0;
    for (const p of state.pages) if (p.taken) n += 1;
    return n;
  }

  function playerInLamp() {
    for (const lamp of state.level.lamps) {
      if (Math.hypot(state.player.x - lamp.x, state.player.y - lamp.y) <= LIGHT.lampRadius) return true;
    }
    return false;
  }

  // Crouching inside a plant hides the player — unless a guard is close
  // enough AND its cone covers the player. A guard walking past with its
  // back turned does not reveal a hidden player.
  function updateHidden() {
    const p = state.player;
    let inPlant = false;
    for (const plant of state.level.plants) {
      if (pointInRect(p.x, p.y, plant)) {
        inPlant = true;
        break;
      }
    }
    if (!p.crouch || !inPlant) {
      p.hidden = false;
      return;
    }
    for (const guard of state.guards) {
      const dist = Math.hypot(guard.x - p.x, guard.y - p.y);
      if (dist < HIDE.revealDistance && canSee(guard, p.x, p.y, state.level.coneRange, state.solids)) {
        p.hidden = false;
        return;
      }
    }
    p.hidden = true;
  }

  function movePlayer(dt, dir) {
    const p = state.player;
    const speed = p.crouch ? PLAYER.crouchSpeed : PLAYER.walkSpeed;
    const len = Math.hypot(dir.x, dir.y);
    if (len === 0) {
      p.moving = false;
      return;
    }
    const nx = dir.x / len;
    const ny = dir.y / len;
    p.facing = Math.atan2(ny, nx);
    p.moving = true;
    // Move the full step, then push the circle out of any solid it touched.
    // A purely axis-separated block wedges a diagonally-walking player in a
    // solid's corner (neither axis can move, though the corner is roundable);
    // pushing out along the shortest escape slides along walls and rounds
    // corners instead, which is the behaviour the cover needs.
    p.x += nx * speed * dt;
    p.y += ny * speed * dt;
    resolveOverlap(p, PLAYER.radius, state.solids);
    if (p.moving && !p.crouch) {
      if (state.noise.stepTimer <= 0) {
        addNoise(state.noise, p.x, p.y, PLAYER.walkNoiseRadius);
        sound.footstep(0);
        state.noise.stepTimer = 0.38;
      }
    }
  }

  function doThrowCoin(target) {
    if (state.coins <= 0) {
      addToast('No coins left — find the gold coins on the floor.');
      return;
    }
    const p = state.player;
    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dist = Math.hypot(dx, dy);
    const range = Math.min(dist, PLAYER.coinRange);
    const toX = dist === 0 ? p.x : p.x + (dx / dist) * range;
    const toY = dist === 0 ? p.y : p.y + (dy / dist) * range;
    state.coins -= 1;
    throwCoin(state.noise, p.x, p.y, toX, toY);
  }

  function clearFloor() {
    const rating = ratingFor(state.floorAlarms, state.peakSuspicion);
    state.rating = rating;
    state.floorResults.push({
      floor: state.floorIndex + 1,
      name: state.level.name,
      time: state.floorTime,
      alarms: state.floorAlarms,
      peak: state.peakSuspicion,
      rating: rating.name,
      stars: rating.stars,
    });
    sound.clear();
    if (state.floorIndex >= LEVELS.length - 1) {
      state.screen = SCREEN_VICTORY;
    } else {
      state.screen = SCREEN_LEVEL_CLEAR;
    }
  }

  function updateGuards(dt) {
    const p = state.player;
    const inLamp = playerInLamp();
    let anySeen = false;
    for (const guard of state.guards) {
      const seen = !p.hidden && canSee(guard, p.x, p.y, state.level.coneRange, state.solids);
      if (seen) {
        anySeen = true;
        state.lastSeen = { x: p.x, y: p.y };
      }
      const event = updateSuspicion(guard, dt, seen, suspicionRate(guard, p, inLamp));
      if (guard.suspicion > state.peakSuspicion) state.peakSuspicion = guard.suspicion;
      if (event === 'investigate' && guard.state === GUARD_PATROL && state.lastSeen) {
        sendToInvestigate(guard, state.lastSeen.x, state.lastSeen.y);
      }
      if (event === 'alarm') {
        triggerAlarm(state.alarm, ALARM.sealSeconds);
        for (const other of state.guards) sendToChase(other, state.lastSeen.x, state.lastSeen.y);
        state.totalAlarms += 1;
        state.floorAlarms += 1;
        addToast('ALARM — the exit is sealed!');
        sound.alarm();
      }

      // Movement by state.
      if (guard.state === GUARD_PATROL) {
        updatePatrol(guard, dt);
      } else if (guard.state === GUARD_INVESTIGATE && guard.target) {
        const d = Math.hypot(guard.target.x - guard.x, guard.target.y - guard.y);
        if (d > GUARD.investigateStandoff) {
          moveToward(guard, guard.target.x, guard.target.y, dt, GUARD.patrolSpeed * guard.speedMult);
        } else {
          guard.studyLeft -= dt;
          guard.facing = turnToward(
            guard.facing,
            Math.atan2(guard.target.y - guard.y, guard.target.x - guard.x),
            GUARD.turnSpeed * dt,
          );
          if (guard.studyLeft <= 0) sendHome(guard);
        }
      } else if (guard.state === GUARD_CHASE) {
        if (seen) {
          guard.lastSeen = { x: p.x, y: p.y };
          guard.studyLeft = GUARD.searchSeconds;
          moveToward(guard, p.x, p.y, dt, GUARD.chaseSpeed * guard.speedMult);
        } else if (guard.lastSeen) {
          const d = Math.hypot(guard.lastSeen.x - guard.x, guard.lastSeen.y - guard.y);
          if (d > GUARD.searchStopShort) {
            moveToward(guard, guard.lastSeen.x, guard.lastSeen.y, dt, GUARD.chaseSpeed * guard.speedMult);
          } else {
            guard.studyLeft -= dt;
            guard.facing += 0.9 * dt;
            if (guard.studyLeft <= 0) sendHome(guard);
          }
        } else {
          sendHome(guard);
        }
      } else if (guard.state === GUARD_RETURN) {
        const wi = nearestWaypoint(guard);
        const target = guard.route[wi];
        if (moveToward(guard, target.x, target.y, dt, GUARD.patrolSpeed * guard.speedMult)) {
          guard.state = GUARD_PATROL;
          guard.waypoint = (wi + 1) % guard.route.length;
          guard.dwellLeft = guard.dwell;
          guard.scanBase = guard.facing;
          guard.scanDir = 1;
        }
      }
      resolveOverlap(guard, GUARD.radius, state.solids);

      // Footsteps, panned by where the guard is relative to the player.
      if (guard.stepTimer === undefined) guard.stepTimer = 0;
      guard.stepTimer -= dt;
      if (guard.stepTimer <= 0 && (guard.state === GUARD_PATROL || guard.state === GUARD_CHASE)) {
        const d = Math.hypot(guard.x - p.x, guard.y - p.y);
        if (d < 340) {
          sound.guardStep(Math.max(-1, Math.min(1, (guard.x - p.x) / 300)));
          guard.stepTimer = 0.45;
        } else {
          guard.stepTimer = 0.2;
        }
      }
    }

    // The alarm cools only after a stretch with nobody seeing the player.
    if (updateAlarm(state.alarm, dt, anySeen)) {
      for (const guard of state.guards) {
        if (guard.state !== GUARD_PATROL) sendHome(guard);
      }
      addToast('The alarm cooled — stay out of the cones.');
    }
    return anySeen;
  }

  function updatePlay(dt, input, pressed) {
    const p = state.player;
    state.floorTime += dt;
    state.totalTime += dt;
    for (let i = state.toasts.length - 1; i >= 0; i -= 1) {
      state.toasts[i].ttl -= dt;
      if (state.toasts[i].ttl <= 0) state.toasts.splice(i, 1);
    }

    p.crouch = input.crouchHeld();
    movePlayer(dt, input.direction());

    // Coin throws: F key, or a right-click queued by the input driver.
    if (pressed.has('KeyF')) doThrowCoin(input.mouse);
    for (const target of input.takeCoinThrows()) doThrowCoin(target);

    // The coin lands and rings; guards in earshot come to look.
    const ring = updateNoise(state.noise, dt);
    if (ring) {
      addNoise(state.noise, ring.x, ring.y, ring.radius, 'ring');
      sound.coin();
    }
    for (const event of state.noise.events) {
      for (const guard of state.guards) {
        // A footstep is only a lead when the guard has nothing better: a
        // guard that already saw something (suspicion above zero) or can
        // see the player right now stays on its visual lead instead of
        // chasing a stale footstep — otherwise a step at the edge of its
        // cone drags it off patrol just as the player walks into view.
        // A ringing coin is a deliberate lure and always pulls a guard.
        if (event.kind === 'step' && guard.suspicion > 0) continue;
        const guardSees = !p.hidden && canSee(guard, p.x, p.y, state.level.coneRange, state.solids);
        if (event.kind === 'step' && guardSees) continue;
        if (guardHears(guard, event)) sendToInvestigate(guard, event.x, event.y);
      }
    }

    // Pickups: ledger pages and loose coins.
    for (const page of state.pages) {
      if (!page.taken && Math.hypot(page.x - p.x, page.y - p.y) <= PLAYER.pickupRadius) {
        page.taken = true;
        sound.page();
        addToast(`Ledger page ${pagesTaken()}/${state.pages.length} — the Meridian Ledger is coming home.`);
        if (pagesTaken() === state.pages.length) addToast('All pages found — the exit is open. Run for it.');
      }
    }
    for (const coin of state.floorCoins) {
      if (!coin.taken && Math.hypot(coin.x - p.x, coin.y - p.y) <= PLAYER.pickupRadius) {
        coin.taken = true;
        state.coins += 1;
        addToast('Coin pocketed — throw it with F to pull a guard away.');
      }
    }

    updateHidden();
    const anySeen = updateGuards(dt);

    // Caught: only while the alarm sounds, only up close, only with a clear
    // line of sight, and never while the player is hidden.
    if (state.alarm.active && !p.hidden) {
      for (const guard of state.guards) {
        if (
          Math.hypot(guard.x - p.x, guard.y - p.y) < GUARD.catchDistance &&
          canSee(guard, p.x, p.y, state.level.coneRange, state.solids)
        ) {
          state.screen = SCREEN_CAUGHT;
          sound.caught();
          return;
        }
      }
    }

    // The exit opens only with every page taken and the alarm seal expired.
    if (pagesTaken() === state.pages.length && state.alarm.sealLeft <= 0) {
      if (pointInRect(p.x, p.y, state.level.exit.zone)) clearFloor();
    }
  }

  // The title and brief screens keep the guards walking behind the panel, so
  // the first thing a player sees is already alive.
  function updateAmbient(dt) {
    for (const guard of state.guards) {
      updatePatrol(guard, dt);
      resolveOverlap(guard, GUARD.radius, state.solids);
    }
  }

  function step(dt, input) {
    const pressed = input.takePressed();
    const confirm = [...pressed].some((code) => CONFIRM_CODES.has(code));

    if (state.screen === SCREEN_TITLE) {
      updateAmbient(dt);
      if (confirm) {
        sound.ensure();
        sound.click();
        state.screen = SCREEN_BRIEF;
      }
      return;
    }
    if (state.screen === SCREEN_BRIEF) {
      updateAmbient(dt);
      if (confirm) {
        sound.ensure();
        sound.click();
        state.screen = SCREEN_PLAY;
      }
      return;
    }
    if (state.screen === SCREEN_PLAY) {
      if (pressed.has('KeyM')) {
        state.muted = !state.muted;
        sound.setMuted(state.muted);
      }
      if (pressed.has('KeyH')) {
        state.manual = !state.manual;
        sound.click();
        return;
      }
      if (state.manual) return;
      if (pressed.has('KeyP')) {
        state.screen = SCREEN_PAUSED;
        sound.click();
        return;
      }
      if (pressed.has('KeyO')) {
        state.observe = !state.observe;
        sound.click();
      }
      if (pressed.has('KeyR')) {
        startFloor(state.floorIndex);
        state.screen = SCREEN_BRIEF;
        return;
      }
      updatePlay(dt, input, pressed);
      return;
    }
    if (state.screen === SCREEN_PAUSED) {
      if (pressed.has('KeyH')) {
        state.manual = !state.manual;
        sound.click();
        return;
      }
      if (state.manual) return;
      if (pressed.has('KeyP') || confirm) {
        state.screen = SCREEN_PLAY;
        sound.click();
        return;
      }
      if (pressed.has('KeyR')) {
        startFloor(state.floorIndex);
        state.screen = SCREEN_BRIEF;
      }
      return;
    }
    if (state.screen === SCREEN_CAUGHT) {
      if (confirm || pressed.has('KeyR')) {
        startFloor(state.floorIndex);
        state.screen = SCREEN_BRIEF;
        sound.click();
      }
      return;
    }
    if (state.screen === SCREEN_LEVEL_CLEAR) {
      if (confirm) {
        sound.click();
        startFloor(state.floorIndex + 1);
        state.screen = SCREEN_BRIEF;
      }
      return;
    }
    if (state.screen === SCREEN_VICTORY) {
      if (confirm) {
        sound.click();
        reset();
      }
      return;
    }
  }

  // A plain snapshot for tests, staged screenshots and the debug hook: no
  // functions, no circular references, safe to stringify and compare.
  function snapshot() {
    return {
      screen: state.screen,
      floor: state.floorIndex + 1,
      floorName: state.level.name,
      pagesTaken: pagesTaken(),
      pagesTotal: state.pages.length,
      coins: state.coins,
      player: {
        x: Math.round(state.player.x * 10) / 10,
        y: Math.round(state.player.y * 10) / 10,
        crouch: state.player.crouch,
        hidden: state.player.hidden,
      },
      peakSuspicion: Math.round(state.peakSuspicion * 10) / 10,
      maxSuspicion: Math.round(Math.max(0, ...state.guards.map((g) => g.suspicion)) * 10) / 10,
      alarm: { active: state.alarm.active, sealLeft: Math.round(state.alarm.sealLeft * 100) / 100 },
      exitOpen: pagesTaken() === state.pages.length && state.alarm.sealLeft <= 0,
      guards: state.guards.map((g) => ({
        x: Math.round(g.x),
        y: Math.round(g.y),
        suspicion: Math.round(g.suspicion * 10) / 10,
        state: g.state,
      })),
      floorTime: Math.round(state.floorTime * 10) / 10,
      totalTime: Math.round(state.totalTime * 10) / 10,
      floorAlarms: state.floorAlarms,
      totalAlarms: state.totalAlarms,
      rating: state.rating,
      observe: state.observe,
      manual: state.manual,
    };
  }

  reset();

  return {
    state,
    reset,
    startFloor,
    step,
    snapshot,
    pagesTaken,
    // Debug hooks for tests and staged screenshots. They drive the world
    // through its own public transitions; nothing here writes a file.
    debug: {
      teleport(x, y) {
        state.player.x = x;
        state.player.y = y;
      },
      setScreen(screen) {
        state.screen = screen;
      },
      startFloorAndPlay(index) {
        startFloor(index);
        state.screen = SCREEN_PLAY;
      },
      // Collect every page, open the exit, walk into it: the floor clears
      // on the next step.
      forceLevelClear() {
        for (const page of state.pages) page.taken = true;
        const zone = state.level.exit.zone;
        state.player.x = zone.x + zone.w / 2;
        state.player.y = zone.y + zone.h / 2;
        state.alarm.sealLeft = 0;
        state.screen = SCREEN_PLAY;
      },
    },
  };
}
