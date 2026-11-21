// SuspicionMeter — how fast a guard stops trusting the dark. Suspicion runs
// 0-100 per guard: it climbs while the guard can see the player (faster up
// close, faster in a lamp pool, slower when the player crouches or hides in
// shadow) and bleeds away while it cannot. "?" at 30, "!" at 70, and at 100
// the guard sounds the alarm.
import { ALARM, SUSPICION } from './config.js';

// The build rate for a guard that can currently see the player.
export function suspicionRate(guard, player, inLamp) {
  let rate = SUSPICION.buildPerSecond;
  const dist = Math.hypot(player.x - guard.x, player.y - guard.y);
  if (dist < SUSPICION.closeRange) rate *= SUSPICION.closeMultiplier;
  if (player.crouch) rate *= SUSPICION.crouchMultiplier;
  rate *= inLamp ? SUSPICION.lampMultiplier : SUSPICION.darknessMultiplier;
  return rate;
}

// Advance one guard's suspicion by a step. Returns 'alarm' the step the
// meter crosses 100, 'investigate' the step it crosses 70 upward, else null.
export function updateSuspicion(guard, dt, seen, rate) {
  const before = guard.suspicion;
  if (seen) {
    guard.suspicion = Math.min(100, guard.suspicion + rate * dt);
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - SUSPICION.decayPerSecond * dt);
  }
  if (guard.suspicion >= SUSPICION.alarmAt && before < SUSPICION.alarmAt) return 'alarm';
  if (guard.suspicion >= SUSPICION.exclaimAt && before < SUSPICION.exclaimAt) return 'investigate';
  return null;
}

export function suspicionMark(guard) {
  if (guard.suspicion >= SUSPICION.exclaimAt) return '!';
  if (guard.suspicion >= SUSPICION.questionAt) return '?';
  return null;
}

// AlarmSystem — the shared alarm state. On a full detection every guard
// chases the last-seen point and the exit seals. The alarm only cools once
// no guard has seen the player for ALARM.coolAfterUnseenSeconds.
export function createAlarm() {
  return { active: false, sealLeft: 0, unseen: 0 };
}

export function triggerAlarm(alarm, sealSeconds) {
  alarm.active = true;
  alarm.sealLeft = sealSeconds;
  alarm.unseen = 0;
}

// Advance the alarm one step. `anySeen` says whether any guard sees the
// player right now. Returns true the step the alarm cools off.
export function updateAlarm(alarm, dt, anySeen) {
  if (!alarm.active) return false;
  if (alarm.sealLeft > 0) alarm.sealLeft = Math.max(0, alarm.sealLeft - dt);
  if (anySeen) {
    alarm.unseen = 0;
  } else {
    alarm.unseen += dt;
    if (alarm.unseen >= ALARM.coolAfterUnseenSeconds) {
      alarm.active = false;
      alarm.sealLeft = 0;
      alarm.unseen = 0;
      return true;
    }
  }
  return false;
}
