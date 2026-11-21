// The three floors of the Meridian Archive, hand-designed. Coordinates are in
// the 1280x800 playfield; a 24px wall border runs around every floor.
// Rectangles are {x, y, w, h}; points are {x, y}.
//
// Plant placement rule: every plant centre sits at least 54px from every
// patrol leg and every waypoint, and never overlaps a solid. A plant on a
// patrol route is a trap — a returning guard's cone would sweep the player
// hiding inside it — so the layouts below were audited for that distance
// (see plantClearance in the test suite).

export const BORDER = 24;

export const LEVELS = [
  {
    name: 'FLOOR 1 — THE STACKS',
    seed: 1101,
    coneRange: 205,
    start: { x: 80, y: 700 },
    exit: { zone: { x: 1216, y: 360, w: 40, h: 80 }, door: { x: 1256, y: 360, w: 24, h: 80 } },
    briefing:
      'Three ledger pages are shelved among the stacks. Watch the patrols, stay out of the cones, and slip out the east door.',
    walls: [
      { x: 320, y: 24, w: 24, h: 200 },
      { x: 320, y: 520, w: 24, h: 256 },
      { x: 640, y: 24, w: 24, h: 160 },
      { x: 640, y: 460, w: 24, h: 316 },
      { x: 900, y: 300, w: 200, h: 24 },
      { x: 1050, y: 560, w: 150, h: 24 },
    ],
    shelves: [
      { x: 420, y: 140, w: 120, h: 36 },
      { x: 420, y: 560, w: 140, h: 36 },
      { x: 760, y: 120, w: 36, h: 140 },
      { x: 800, y: 640, w: 36, h: 110 },
      { x: 1020, y: 380, w: 120, h: 36 },
    ],
    crates: [
      { x: 480, y: 320, w: 44, h: 44 },
      { x: 528, y: 320, w: 44, h: 44 },
      { x: 1080, y: 180, w: 44, h: 44 },
      { x: 180, y: 420, w: 44, h: 44 },
    ],
    plants: [
      { x: 180, y: 340, w: 52, h: 52 },
      { x: 830, y: 420, w: 52, h: 52 },
      { x: 1150, y: 640, w: 52, h: 52 },
    ],
    lamps: [
      { x: 200, y: 140 },
      { x: 560, y: 380 },
      { x: 980, y: 140 },
      { x: 1150, y: 480 },
      { x: 560, y: 660 },
    ],
    guards: [
      {
        route: [
          { x: 380, y: 120 },
          { x: 380, y: 420 },
          { x: 560, y: 420 },
          { x: 560, y: 120 },
        ],
        dwell: 1.2,
      },
      {
        route: [
          { x: 700, y: 600 },
          { x: 1000, y: 600 },
          { x: 1000, y: 380 },
          { x: 700, y: 380 },
        ],
        dwell: 1.5,
      },
      {
        route: [
          { x: 1150, y: 120 },
          { x: 1150, y: 280 },
          { x: 980, y: 280 },
          { x: 980, y: 120 },
        ],
        dwell: 1.0,
      },
    ],
    pages: [
      { x: 90, y: 90 },
      { x: 620, y: 700 },
      { x: 1120, y: 90 },
    ],
    coins: [
      { x: 200, y: 560 },
      { x: 880, y: 660 },
      { x: 700, y: 120 },
    ],
  },
  {
    name: 'FLOOR 2 — GALLERY OF GLASS',
    seed: 2202,
    coneRange: 215,
    start: { x: 640, y: 720 },
    exit: { zone: { x: 600, y: 24, w: 80, h: 40 }, door: { x: 600, y: 0, w: 80, h: 24 } },
    briefing:
      'Four pages, four guards, and nowhere to hide but the display cases. The centre guard walks the whole hall — time your crossing.',
    walls: [
      { x: 400, y: 200, w: 28, h: 28 },
      { x: 460, y: 600, w: 28, h: 28 },
      { x: 800, y: 200, w: 28, h: 28 },
      { x: 800, y: 560, w: 28, h: 28 },
      { x: 520, y: 380, w: 120, h: 24 },
    ],
    shelves: [
      { x: 300, y: 120, w: 120, h: 36 },
      { x: 860, y: 120, w: 120, h: 36 },
      { x: 300, y: 620, w: 120, h: 36 },
      { x: 860, y: 620, w: 120, h: 36 },
      { x: 580, y: 120, w: 120, h: 36 },
      { x: 580, y: 620, w: 120, h: 36 },
    ],
    crates: [
      { x: 620, y: 300, w: 44, h: 44 },
      { x: 620, y: 440, w: 44, h: 44 },
    ],
    plants: [
      { x: 120, y: 500, w: 52, h: 52 },
      { x: 1100, y: 480, w: 52, h: 52 },
      { x: 640, y: 60, w: 52, h: 52 },
      { x: 640, y: 680, w: 52, h: 52 },
    ],
    lamps: [
      { x: 320, y: 400 },
      { x: 960, y: 400 },
      { x: 640, y: 200 },
      { x: 640, y: 560 },
      { x: 140, y: 140 },
      { x: 1140, y: 660 },
    ],
    guards: [
      {
        route: [
          { x: 200, y: 180 },
          { x: 500, y: 180 },
          { x: 500, y: 380 },
          { x: 200, y: 380 },
        ],
        dwell: 1.0,
      },
      {
        route: [
          { x: 780, y: 180 },
          { x: 1080, y: 180 },
          { x: 1080, y: 380 },
          { x: 780, y: 380 },
        ],
        dwell: 1.2,
      },
      {
        route: [
          { x: 200, y: 580 },
          { x: 500, y: 580 },
          { x: 500, y: 420 },
          { x: 200, y: 420 },
        ],
        dwell: 1.0,
      },
      {
        // The fast centre guard: walks the whole hall, 25% quicker than the rest.
        route: [
          { x: 700, y: 200 },
          { x: 700, y: 600 },
        ],
        dwell: 0.8,
        speedMult: 1.25,
      },
    ],
    pages: [
      { x: 90, y: 90 },
      { x: 1190, y: 90 },
      { x: 90, y: 710 },
      { x: 1190, y: 710 },
    ],
    coins: [
      { x: 320, y: 380 },
      { x: 960, y: 420 },
      { x: 640, y: 340 },
    ],
  },
  {
    name: 'FLOOR 3 — THE VAULT',
    seed: 3303,
    coneRange: 232,
    start: { x: 80, y: 90 },
    exit: { zone: { x: 1050, y: 736, w: 80, h: 40 }, door: { x: 1050, y: 776, w: 80, h: 24 } },
    briefing:
      'The last pages sit behind the vault patrol: five guards, longer cones, tighter routes. Crouch in the plants. Spend coins to pull guards away.',
    walls: [
      { x: 300, y: 24, w: 24, h: 280 },
      { x: 300, y: 500, w: 24, h: 276 },
      { x: 640, y: 200, w: 24, h: 200 },
      { x: 640, y: 560, w: 24, h: 216 },
      { x: 950, y: 24, w: 24, h: 200 },
      { x: 950, y: 480, w: 24, h: 296 },
      { x: 420, y: 380, w: 180, h: 24 },
    ],
    shelves: [
      { x: 380, y: 120, w: 120, h: 36 },
      { x: 760, y: 120, w: 120, h: 36 },
      { x: 380, y: 600, w: 120, h: 36 },
      { x: 760, y: 600, w: 120, h: 36 },
      { x: 1020, y: 300, w: 36, h: 140 },
    ],
    crates: [
      { x: 480, y: 220, w: 44, h: 44 },
      { x: 700, y: 480, w: 44, h: 44 },
      { x: 1100, y: 600, w: 44, h: 44 },
    ],
    plants: [
      { x: 360, y: 440, w: 52, h: 52 },
      { x: 860, y: 400, w: 52, h: 52 },
      { x: 1150, y: 180, w: 52, h: 52 },
      { x: 180, y: 650, w: 52, h: 52 },
    ],
    lamps: [
      { x: 200, y: 200 },
      { x: 480, y: 560 },
      { x: 820, y: 200 },
      { x: 1100, y: 400 },
      { x: 640, y: 680 },
      { x: 480, y: 120 },
    ],
    guards: [
      {
        route: [
          { x: 120, y: 120 },
          { x: 120, y: 400 },
          { x: 240, y: 400 },
          { x: 240, y: 120 },
        ],
        dwell: 1.0,
      },
      {
        route: [
          { x: 400, y: 170 },
          { x: 560, y: 170 },
          { x: 560, y: 300 },
          { x: 400, y: 300 },
        ],
        dwell: 1.2,
      },
      {
        route: [
          { x: 700, y: 170 },
          { x: 880, y: 170 },
          { x: 880, y: 300 },
          { x: 700, y: 300 },
        ],
        dwell: 1.0,
      },
      {
        route: [
          { x: 400, y: 560 },
          { x: 560, y: 560 },
          { x: 560, y: 700 },
          { x: 400, y: 700 },
        ],
        dwell: 1.2,
      },
      {
        route: [
          { x: 1020, y: 560 },
          { x: 1180, y: 560 },
          { x: 1180, y: 700 },
          { x: 1020, y: 700 },
        ],
        dwell: 1.0,
      },
    ],
    pages: [
      { x: 90, y: 700 },
      { x: 620, y: 90 },
      { x: 1120, y: 380 },
      { x: 480, y: 700 },
    ],
    coins: [
      { x: 200, y: 560 },
      { x: 820, y: 560 },
      { x: 620, y: 420 },
      { x: 1120, y: 120 },
    ],
  },
];

// Walls, shelves and crates all block movement and sight; plants and lamps do not.
export function solidsOf(level) {
  return level.walls.concat(level.shelves, level.crates);
}

// The 24px border walls, as rectangles, for collision and raycasts.
export function borderSolids() {
  return [
    { x: 0, y: 0, w: 1280, h: BORDER },
    { x: 0, y: 800 - BORDER, w: 1280, h: BORDER },
    { x: 0, y: 0, w: BORDER, h: 800 },
    { x: 1280 - BORDER, y: 0, w: BORDER, h: 800 },
  ];
}

// Every solid on a floor, border included.
export function allSolids(level) {
  return borderSolids().concat(solidsOf(level));
}

export function rectCentre(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

// Distance from a point to a line segment — used to audit plant placement
// against patrol legs.
export function distancePointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

// Smallest distance from any plant centre on the level to any patrol leg or
// waypoint. The design rule needs this to stay at or above 54px.
export function plantClearance(level) {
  let worst = Infinity;
  for (const plant of level.plants) {
    const centre = rectCentre(plant);
    for (const guard of level.guards) {
      const route = guard.route;
      for (let i = 0; i < route.length; i += 1) {
        const a = route[i];
        const b = route[(i + 1) % route.length];
        worst = Math.min(worst, distancePointToSegment(centre.x, centre.y, a.x, a.y, b.x, b.y));
        worst = Math.min(worst, Math.hypot(centre.x - a.x, centre.y - a.y));
      }
    }
    for (const solid of solidsOf(level)) {
      const overlaps =
        plant.x < solid.x + solid.w && plant.x + plant.w > solid.x && plant.y < solid.y + solid.h && plant.y + plant.h > solid.y;
      if (overlaps) worst = Math.min(worst, 0);
    }
  }
  return worst;
}
