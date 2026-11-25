// Line Cook Rush — static data: recipes, stations, levels, customers, palette.
// Nothing here is fetched or read from anywhere else: everything the game
// draws or plays comes from these tables plus the canvas and the synth.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const STATIONS = [
  { id: 'board', key: '1', name: 'Chopping Board', verb: 'Chop', color: '#6da34a', dark: '#4c7a33', hint: 'Knife work: chop, slice, butter' },
  { id: 'stove', key: '2', name: 'Stove', verb: 'Cook', color: '#d96a3b', dark: '#a84a24', hint: 'Heat: fry, boil, toast' },
  { id: 'table', key: '3', name: 'Plating Table', verb: 'Plate', color: '#5a8fd6', dark: '#3a6bab', hint: 'Finish: toss, stack, plate' },
  { id: 'window', key: '4', name: 'Serving Window', verb: 'Serve', color: '#9a6bc0', dark: '#74489a', hint: 'Hand the finished dish over' },
];

export const RECIPES = [
  {
    id: 'pasta',
    name: 'Tomato Pasta',
    points: 100,
    seconds: 24,
    blurb: 'The house classic: bright, fast, forgiving.',
    steps: [
      { label: 'Chop the tomato', station: 'board' },
      { label: 'Boil the pasta', station: 'stove' },
      { label: 'Toss & plate', station: 'table' },
    ],
  },
  {
    id: 'sandwich',
    name: 'Fried Egg Sandwich',
    points: 110,
    seconds: 26,
    blurb: 'Crispy bread, runny yolk, happy customer.',
    steps: [
      { label: 'Fry the egg', station: 'stove' },
      { label: 'Butter the bread', station: 'board' },
      { label: 'Stack & plate', station: 'table' },
    ],
  },
  {
    id: 'salad',
    name: 'Fruit Salad',
    points: 120,
    seconds: 28,
    blurb: 'Two chops and a toss. The fussy one.',
    steps: [
      { label: 'Chop the apple', station: 'board' },
      { label: 'Chop the berries', station: 'board' },
      { label: 'Toss & plate', station: 'table' },
    ],
  },
];

export const recipeById = (id) => RECIPES.find((r) => r.id === id);
export const stationById = (id) => STATIONS.find((s) => s.id === id);

export const LEVELS = [
  { name: 'Opening Shift', target: 300, daySeconds: 90, spawnEvery: 9, rush: 1.0 },
  { name: 'Lunch Rush', target: 650, daySeconds: 100, spawnEvery: 7, rush: 0.9 },
  { name: 'Dinner Blitz', target: 1100, daySeconds: 110, spawnEvery: 5.5, rush: 0.78 },
];

export const CUSTOMERS = [
  'Maya', 'Leo', 'Nina', 'Omar', 'Ivy', 'Sam',
  'Rosa', 'Ken', 'Tara', 'Eli', 'June', 'Max',
];

export const MAX_ORDERS = 4;
export const MAX_STRIKES = 3;
export const TIME_BONUS = 50;
export const WORK_SECONDS = 0.35;

export const PALETTE = {
  wall: '#f6ead2',
  wallDark: '#e8d5b0',
  counter: '#b07a45',
  counterDark: '#8a5c2e',
  ink: '#2e2118',
  softInk: '#6b543d',
  panel: '#fff8e8',
  line: '#d8c49a',
  gold: '#e0a52e',
  red: '#c94f3d',
  green: '#5d8a3c',
};

// A small deterministic RNG so the ?shot=… frames are reproducible.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
