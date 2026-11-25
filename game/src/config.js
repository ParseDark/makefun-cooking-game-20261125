// config.js — recipes, levels, palette, canvas size. Pure data, no logic.
// Edit recipes/levels here; the rest of the game reads from these tables.

export const W = 960;
export const H = 600;

// Flat colour palette for the whole game (readable at a glance).
export const PAL = {
  bg: '#2b2f3a',
  floor: '#3a4150',
  counter: '#c7a17a',
  counterDark: '#a9855f',
  wall: '#4b5468',
  ink: '#1c1a18',
  paper: '#f5efd9',
  paperLine: '#d8cfa8',
  accent: '#ffb23e',
  accentDark: '#d98a1f',
  good: '#5ac36a',
  bad: '#e0514a',
  pan: '#3b3b42',
  panLight: '#55555f',
  flame: '#ff7a2f',
  white: '#faf7ee',
  shadow: 'rgba(0,0,0,0.25)',
};

// Ingredient id -> how it looks (drawn as flat shapes in render.js).
export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#e0514a', shape: 'round' },
  pasta: { name: 'Pasta', color: '#f1d27a', shape: 'noodle' },
  egg: { name: 'Egg', color: '#f7e6b0', shape: 'egg' },
  bread: { name: 'Bread', color: '#d9a55e', shape: 'slice' },
  apple: { name: 'Apple', color: '#6ac24a', shape: 'round' },
  berry: { name: 'Berry', color: '#8a4fd0', shape: 'round' },
};

// Stations the player clicks / selects with number keys 1..5.
// Each station performs one action on the dish-in-progress.
export const STATIONS = [
  { id: 'board', key: '1', name: 'Board', verb: 'Chop', x: 150, y: 430 },
  { id: 'stove', key: '2', name: 'Stove', verb: 'Cook', x: 360, y: 430 },
  { id: 'assemble', key: '3', name: 'Table', verb: 'Plate', x: 570, y: 430 },
  { id: 'serve', key: '4', name: 'Serve', verb: 'Serve', x: 780, y: 430 },
];

// 3 recipes, each with >=3 ordered steps. A step is {station, ingredient, label}.
// The player must perform the steps in order; a wrong action = a mistake.
export const RECIPES = {
  pasta: {
    id: 'pasta',
    name: 'Tomato Pasta',
    color: '#e0514a',
    time: 22,
    reward: 100,
    steps: [
      { station: 'board', ingredient: 'tomato', label: 'Chop tomato' },
      { station: 'stove', ingredient: 'pasta', label: 'Boil pasta' },
      { station: 'assemble', ingredient: null, label: 'Sauce + plate' },
    ],
  },
  sandwich: {
    id: 'sandwich',
    name: 'Fried Egg Sandwich',
    color: '#f1b24a',
    time: 24,
    reward: 110,
    steps: [
      { station: 'stove', ingredient: 'egg', label: 'Fry egg' },
      { station: 'board', ingredient: 'bread', label: 'Toast bread' },
      { station: 'assemble', ingredient: null, label: 'Assemble' },
    ],
  },
  salad: {
    id: 'salad',
    name: 'Fruit Salad',
    color: '#6ac24a',
    time: 26,
    reward: 120,
    steps: [
      { station: 'board', ingredient: 'apple', label: 'Chop apple' },
      { station: 'board', ingredient: 'berry', label: 'Chop berry' },
      { station: 'assemble', ingredient: null, label: 'Mix + serve' },
    ],
  },
};

export const RECIPE_LIST = [RECIPES.pasta, RECIPES.sandwich, RECIPES.salad];

// Levels: orders get faster and more numerous as levels rise.
// target = score needed before closing; spawnEvery = seconds between customers;
// maxActive = tickets on the board at once; rush = a timed rush-hour round.
export const LEVELS = [
  { level: 1, target: 300, spawnEvery: 6.0, maxActive: 2, orders: 5, rush: false },
  { level: 2, target: 650, spawnEvery: 5.0, maxActive: 3, orders: 7, rush: false },
  { level: 3, target: 1100, spawnEvery: 3.5, maxActive: 4, orders: 9, rush: true },
];

export const MAX_MISTAKES = 3;
export const SELECT_RECIPES = Object.keys(RECIPES);
