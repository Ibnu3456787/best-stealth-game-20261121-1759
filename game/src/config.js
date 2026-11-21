// SHADOWSHIFT — every tuning number and colour in one place.
// One screen per floor, no camera: the whole 1280x800 archive fits the canvas.
export const VIEW = { width: 1280, height: 800 };

// The simulation's fixed step: 60 updates a second whatever the display does.
export const STEP = 1 / 60;

// How far a steering target must be before the autopilot (and a held key) counts
// it as a direction at all; smaller deltas are treated as "arrived".
export const STEER_DEAD_ZONE = 8;

export const PLAYER = {
  radius: 13,
  walkSpeed: 165,
  crouchSpeed: 85,
  // A walking step is heard this far away; a crouched step is silent.
  walkNoiseRadius: 55,
  crouchNoiseRadius: 0,
  // A thrown coin can land at most this far from the thrower.
  coinRange: 320,
  // Pages and loose coins are picked up this close to the player's centre.
  pickupRadius: 26,
};

export const GUARD = {
  radius: 14,
  // The vision cone: total arc across, and how far it reaches per floor
  // (the per-floor reach lives on each level in levels.js).
  coneArc: (70 * Math.PI) / 180,
  patrolSpeed: 62,
  chaseSpeed: 132,
  // Facing turns at most this fast, so a cone sweeps as a guard turns.
  turnSpeed: 2.4,
  // A guard only catches the player this close, with a clear line of sight,
  // while the alarm is sounding.
  catchDistance: 22,
  // A patrolling guard pauses this long at each waypoint, looking around.
  // (Per-guard dwell overrides live on the level definitions.)
  dwellDefault: 1.0,
  // A chasing guard that lost the player stops this short of the last-seen
  // point and looks around for this long before giving up.
  searchStopShort: 60,
  searchSeconds: 3,
  // An investigating guard holds this far back from the noise it heard and
  // studies the spot for this long.
  investigateStandoff: 70,
  investigateSeconds: 4,
};

// Suspicion runs 0-100 per guard. It climbs while the guard can see the
// player and bleeds away while it cannot.
export const SUSPICION = {
  buildPerSecond: 42,
  decayPerSecond: 26,
  closeRange: 85,
  closeMultiplier: 1.6,
  crouchMultiplier: 0.55,
  darknessMultiplier: 0.45,
  lampMultiplier: 1.25,
  questionAt: 30,
  exclaimAt: 70,
  alarmAt: 100,
};

export const ALARM = {
  // While the alarm sounds the exit is sealed for this long.
  sealSeconds: 6,
  // Stay unseen for this long and the alarm cools off.
  coolAfterUnseenSeconds: 5,
};

export const NOISE = {
  // A ringing coin is heard this far away.
  coinHearRadius: 145,
  // A thrown coin takes this long to land and ring.
  coinFlightSeconds: 0.45,
  startCoins: 3,
};

export const HIDE = {
  // A guard this close can still spot a crouched player inside a plant,
  // but only if its cone covers the player too.
  revealDistance: 45,
};

export const LIGHT = {
  lampRadius: 120,
  lanternRadius: 70,
};

// Ghost ratings for a cleared floor.
export function ratingFor(alarms, peakSuspicion) {
  if (alarms === 0 && peakSuspicion <= 30) return { name: 'SPECTRE', stars: 3 };
  if (alarms === 0) return { name: 'GHOST', stars: 3 };
  if (alarms <= 1) return { name: 'SHADOW', stars: 2 };
  return { name: 'ROOKIE', stars: 1 };
}

export const PALETTE = {
  floorA: '#2b2118',
  floorB: '#33281d',
  wall: '#17120e',
  wallTop: '#4a3a28',
  shelf: '#5a3d22',
  crate: '#6b4e2e',
  plant: '#1e4d2b',
  plantLeaf: '#2f7a42',
  lamp: '#ffca6a',
  coneCalm: 'rgba(96,220,160,0.20)',
  coneCalmEdge: 'rgba(96,220,160,0.55)',
  coneWary: 'rgba(255,190,60,0.26)',
  coneWaryEdge: 'rgba(255,190,60,0.65)',
  coneAlarm: 'rgba(255,70,60,0.30)',
  coneAlarmEdge: 'rgba(255,70,60,0.75)',
  player: '#20242e',
  playerTrim: '#7fe7c8',
  guard: '#2c3a5e',
  guardCap: '#c94f43',
  page: '#ffe9a8',
  coin: '#ffd76a',
  exitOpen: '#59e389',
  exitShut: '#c94f43',
  exitGold: '#e8c15a',
  hudText: '#e8dcc3',
  hudDim: '#9a8f74',
  panel: '#14100c',
  panelEdge: '#6b5a34',
  backdrop: '#0d0a07',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
