// Line Cook Rush v3 — data: dishes, levels, customers, palette, seeded random.
// Every value here is the game's own design; nothing is copied from another game.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// Warm kitchen palette (cream walls, wood counters, dark outlines).
export const PALETTE = {
  wall: '#f7ead0',
  wallShadow: '#ecd9b4',
  floor: '#e3cfa5',
  counterTop: '#c98f4e',
  counterSide: '#a9743a',
  counterEdge: '#8a5a28',
  outline: '#3a2a1a',
  ink: '#2e2118',
  paper: '#fff8e8',
  ticketShadow: 'rgba(58,42,26,0.25)',
  hud: '#fff3d6',
  red: '#d84a3a',
  green: '#3f9e57',
  amber: '#e8a13a',
};

// The four stations. Keys 1-4, click also works.
export const STATIONS = [
  { id: 'board', key: '1', name: 'Chopping Board', short: 'CHOP', color: '#58b368', x: 336, y: 300 },
  { id: 'stove', key: '2', name: 'Stove', short: 'STOVE', color: '#e8862e', x: 528, y: 300 },
  { id: 'plating', key: '3', name: 'Plating Table', short: 'PLATE', color: '#4a90d9', x: 720, y: 300 },
  { id: 'serving', key: '4', name: 'Serving Window', short: 'SERVE', color: '#9b6dd6', x: 912, y: 300 },
];

// Three dishes, three steps each. step.station must be one of the station ids.
export const DISHES = [
  {
    id: 'pasta',
    name: 'Tomato Pasta',
    color: '#e05a4e',
    points: 100,
    seconds: 24,
    steps: [
      { label: 'Chop tomato', station: 'board' },
      { label: 'Boil pasta', station: 'stove', heat: true },
      { label: 'Toss & plate', station: 'plating' },
    ],
  },
  {
    id: 'sandwich',
    name: 'Fried Egg Sandwich',
    color: '#f2c14e',
    points: 110,
    seconds: 26,
    steps: [
      { label: 'Fry egg', station: 'stove', heat: true },
      { label: 'Butter bread', station: 'board' },
      { label: 'Stack & plate', station: 'plating' },
    ],
  },
  {
    id: 'salad',
    name: 'Fruit Salad',
    color: '#6fbf5a',
    points: 120,
    seconds: 28,
    steps: [
      { label: 'Chop apple', station: 'board' },
      { label: 'Chop berries', station: 'board' },
      { label: 'Toss & plate', station: 'plating' },
    ],
  },
];

export const dishById = (id) => DISHES.find((d) => d.id === id);

// Three days. Score is cumulative; targets are cumulative too.
export const LEVELS = [
  { day: 1, name: 'Day 1 — First Shift', target: 300, daySeconds: 150, spawnEvery: 7.0, timeFactor: 1.0, rush: false },
  { day: 2, name: 'Day 2 — Lunch Crowd', target: 650, daySeconds: 150, spawnEvery: 6.0, timeFactor: 0.9, rush: false },
  { day: 3, name: 'Day 3 — RUSH HOUR', target: 1100, daySeconds: 140, spawnEvery: 5.0, timeFactor: 0.78, rush: true },
];

export const TIME_BONUS = 50; // points for serving an order before its timer runs out
export const MAX_STRIKES = 3;
export const MAX_ORDERS = 4;

// Twelve rotating customers. Each has a colour and a little hat/hair style.
export const CUSTOMERS = [
  { name: 'Mia', color: '#e56b8c', hair: 'bun' },
  { name: 'Leo', color: '#4a90d9', hair: 'cap' },
  { name: 'Ana', color: '#8e6cc8', hair: 'long' },
  { name: 'Ben', color: '#3f9e57', hair: 'spiky' },
  { name: 'Zoe', color: '#e8862e', hair: 'bob' },
  { name: 'Max', color: '#c94f4f', hair: 'flat' },
  { name: 'Lia', color: '#2fa8a0', hair: 'pony' },
  { name: 'Sam', color: '#a8743a', hair: 'curly' },
  { name: 'Ivy', color: '#7a5fd0', hair: 'bun' },
  { name: 'Kai', color: '#4f7ec9', hair: 'spiky' },
  { name: 'Nora', color: '#d9739b', hair: 'long' },
  { name: 'Eli', color: '#5a9e3f', hair: 'cap' },
];

// Heat gauge zones (percent of heat). Green is the perfect window.
export const HEAT = {
  perfectLow: 55,
  perfectHigh: 80,
  burnAt: 96,
  risePerSecond: 26, // heat 0 -> ~100 in about 4 seconds on the stove
};

// Small deterministic RNG (mulberry32) so screenshot mode is reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function formatClock(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + String(r).padStart(2, '0');
}
