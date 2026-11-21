// NoiseSystem — sound the guards can hear. Walking is audible; crouching is
// silent. A thrown coin flies for a moment, then rings, and every guard in
// earshot comes to look at the spot where it landed.
import { NOISE } from './config.js';

export function createNoise() {
  return {
    // Recent sounds, each {x, y, radius, ttl}: guards in `radius` investigate.
    events: [],
    // A coin in the air, or null: {x, y, fromX, fromY, toX, toY, t}.
    coin: null,
    // Footstep sounds are spaced out so a walking player does not spam events.
    stepTimer: 0,
  };
}

// A footstep at (x, y) that guards within `radius` can hear.
export function addNoise(noise, x, y, radius, kind = 'step') {
  noise.events.push({ x, y, radius, ttl: 0.6, kind });
}

// Throw a coin from (fromX, fromY) toward (toX, toY). The coin flies in a
// straight line and rings when it lands.
export function throwCoin(noise, fromX, fromY, toX, toY) {
  noise.coin = { fromX, fromY, toX, toY, x: fromX, y: fromY, t: 0 };
}

// Advance the flying coin and age out old sounds. Returns the ring event
// {x, y, radius} the step the coin lands, or null.
export function updateNoise(noise, dt) {
  let ring = null;
  if (noise.coin) {
    const coin = noise.coin;
    coin.t += dt;
    const k = Math.min(1, coin.t / NOISE.coinFlightSeconds);
    coin.x = coin.fromX + (coin.toX - coin.fromX) * k;
    coin.y = coin.fromY + (coin.toY - coin.fromY) * k;
    if (coin.t >= NOISE.coinFlightSeconds) {
      ring = { x: coin.toX, y: coin.toY, radius: NOISE.coinHearRadius, kind: 'ring' };
      noise.coin = null;
    }
  }
  for (let i = noise.events.length - 1; i >= 0; i -= 1) {
    noise.events[i].ttl -= dt;
    if (noise.events[i].ttl <= 0) noise.events.splice(i, 1);
  }
  if (noise.stepTimer > 0) noise.stepTimer -= dt;
  return ring;
}

// Should this guard hear the sound? Only patrolling guards turn to look;
// a guard already chasing or investigating stays on its job.
export function guardHears(guard, event) {
  if (guard.state !== 'patrol') return false;
  return Math.hypot(event.x - guard.x, event.y - guard.y) <= event.radius;
}
