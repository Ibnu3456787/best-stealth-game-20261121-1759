// PatrolSystem — guards walk fixed waypoint loops, pause at each waypoint to
// look around, and move with a turn-rate-limited step so their facing (and
// therefore their vision cone) lags the direction they walk and sweeps on
// every turn. Routes are fixed and learnable; the same module also drives the
// investigate, chase and return legs, which reuse the same steering.
import { GUARD } from './config.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_INVESTIGATE = 'investigate';
export const GUARD_CHASE = 'chase';
export const GUARD_RETURN = 'return';

// Smallest signed angle from `from` to `to`, in (-PI, PI].
export function angleDelta(from, to) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

// Turn `facing` toward `target` by at most `maxTurn` radians.
export function turnToward(facing, target, maxTurn) {
  const d = angleDelta(facing, target);
  if (Math.abs(d) <= maxTurn) return target;
  return facing + Math.sign(d) * maxTurn;
}

export function createGuard(def, index) {
  const start = def.route[0];
  const next = def.route[1 % def.route.length];
  return {
    id: index,
    x: start.x,
    y: start.y,
    // Starts facing along the first leg, so the opening frame already reads.
    facing: Math.atan2(next.y - start.y, next.x - start.x),
    route: def.route,
    waypoint: 1 % def.route.length,
    dwell: def.dwell ?? GUARD.dwellDefault,
    dwellLeft: 0,
    // Dwell-and-scan: the guard sweeps its facing around the heading it
    // arrived on, flipping direction at the sweep's edge.
    scanBase: 0,
    scanDir: 1,
    speedMult: def.speedMult ?? 1,
    state: GUARD_PATROL,
    // Where an investigating or chasing guard is headed, and how long it
    // will study the spot once it gets there.
    target: null,
    studyLeft: 0,
    suspicion: 0,
    // Last place this guard saw the player (chase target).
    lastSeen: null,
  };
}

// Index of the waypoint nearest the guard — where it returns to after a
// chase or an investigation.
export function nearestWaypoint(guard) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < guard.route.length; i += 1) {
    const d = Math.hypot(guard.route[i].x - guard.x, guard.route[i].y - guard.y);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

// Step toward (tx, ty) at `speed`, turning the facing toward the direction of
// travel at the guard turn rate. Returns true when the guard is within
// `arrive` px of the target. Position moves straight at the target; only the
// facing lags, which is what makes cones sweep on turns.
export function moveToward(guard, tx, ty, dt, speed, arrive = 6) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= arrive) return true;
  const want = Math.atan2(dy, dx);
  guard.facing = turnToward(guard.facing, want, GUARD.turnSpeed * dt);
  const step = Math.min(speed * dt, dist);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  return dist - step <= arrive;
}

// One patrol step: walk the route, dwell-and-scan at each waypoint.
export function updatePatrol(guard, dt) {
  if (guard.dwellLeft > 0) {
    guard.dwellLeft -= dt;
    // Sweep the facing ±1.0 rad around the heading the guard arrived on.
    guard.facing += guard.scanDir * 1.1 * dt;
    if (Math.abs(angleDelta(guard.scanBase, guard.facing)) > 1.0) {
      guard.scanDir *= -1;
      guard.facing = guard.scanBase + Math.sign(angleDelta(guard.scanBase, guard.facing)) * 1.0;
    }
    if (guard.dwellLeft <= 0) {
      guard.dwellLeft = 0;
      guard.facing = guard.scanBase;
    }
    return;
  }
  const target = guard.route[guard.waypoint];
  const speed = GUARD.patrolSpeed * guard.speedMult;
  if (moveToward(guard, target.x, target.y, dt, speed)) {
    guard.waypoint = (guard.waypoint + 1) % guard.route.length;
    guard.dwellLeft = guard.dwell;
    guard.scanBase = guard.facing;
    guard.scanDir = 1;
  }
}

// Send a guard to look at a point: it walks to a standoff distance, scans
// for a while, then heads home. Never walks onto the point itself, so a
// player who made the noise always has room to slip away.
export function sendToInvestigate(guard, x, y, studySeconds = GUARD.investigateSeconds) {
  guard.state = GUARD_INVESTIGATE;
  guard.target = { x, y };
  guard.studyLeft = studySeconds;
  guard.dwellLeft = 0;
}

export function sendToChase(guard, x, y) {
  guard.state = GUARD_CHASE;
  guard.lastSeen = { x, y };
  guard.studyLeft = GUARD.searchSeconds;
  guard.target = null;
  guard.dwellLeft = 0;
}

export function sendHome(guard) {
  guard.state = GUARD_RETURN;
  guard.target = null;
  guard.dwellLeft = 0;
}
