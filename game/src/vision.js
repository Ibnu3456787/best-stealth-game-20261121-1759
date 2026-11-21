// VisionConeSystem — raycast sight. A guard's cone is 26 rays cast against
// the solid rectangles; shelves and crates genuinely clip the cone, so cover
// works. The same raycast answers "can this guard see the player at all?".
import { GUARD } from './config.js';

export const CONE_RAYS = 26;

// Distance from (x, y) along the unit direction (dx, dy) to the nearest solid
// rectangle, or maxDist when the ray reaches that far unblocked. Ray versus
// axis-aligned rectangle, slab method, one rectangle at a time.
export function castRay(x, y, dx, dy, maxDist, solids) {
  let best = maxDist;
  for (let i = 0; i < solids.length; i += 1) {
    const r = solids[i];
    let tMin = 0;
    let tMax = best;
    let ok = true;
    // X slab.
    if (dx === 0) {
      if (x < r.x || x > r.x + r.w) ok = false;
    } else {
      let t1 = (r.x - x) / dx;
      let t2 = (r.x + r.w - x) / dx;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) ok = false;
    }
    // Y slab.
    if (ok) {
      if (dy === 0) {
        if (y < r.y || y > r.y + r.h) ok = false;
      } else {
        let t1 = (r.y - y) / dy;
        let t2 = (r.y + r.h - y) / dy;
        if (t1 > t2) {
          const tmp = t1;
          t1 = t2;
          t2 = tmp;
        }
        tMin = Math.max(tMin, t1);
        tMax = Math.min(tMax, t2);
        if (tMin > tMax) ok = false;
      }
    }
    if (ok && tMin < best && tMin >= 0) best = tMin;
  }
  return best;
}

// The cone as a polygon: the guard's position plus one point per ray, each
// ray stopped by the first solid it meets. The arc is centred on `facing`.
export function conePolygon(x, y, facing, range, solids) {
  const half = GUARD.coneArc / 2;
  const points = [{ x, y }];
  for (let i = 0; i <= CONE_RAYS; i += 1) {
    const angle = facing - half + (GUARD.coneArc * i) / CONE_RAYS;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const dist = castRay(x, y, dx, dy, range, solids);
    points.push({ x: x + dx * dist, y: y + dy * dist });
  }
  return points;
}

// Is the point (px, py) inside the guard's cone (range + angle), ignoring
// walls? Line of sight is checked separately.
export function inConeAngle(guard, px, py, range) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range || dist === 0) return false;
  let diff = Math.atan2(dy, dx) - guard.facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= GUARD.coneArc / 2;
}

// True when nothing solid stands between the two points.
export function lineOfSightClear(ax, ay, bx, by, solids) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.hypot(dx, dy);
  if (dist === 0) return true;
  const hit = castRay(ax, ay, dx / dist, dy / dist, dist, solids);
  return hit >= dist - 0.001;
}

// The full sight test: in the cone AND nothing in the way.
export function canSee(guard, px, py, range, solids) {
  return inConeAngle(guard, px, py, range) && lineOfSightClear(guard.x, guard.y, px, py, solids);
}
