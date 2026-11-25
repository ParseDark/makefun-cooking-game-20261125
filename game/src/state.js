// state.js — pure game state + rules. No drawing, no DOM, no audio.
// A deterministic RNG (seedable) so ?seed=1 gives a fixed layout for shots.

import { RECIPES, SELECT_RECIPES, LEVELS, MAX_MISTAKES } from './config.js';

export function makeRNG(seed) {
  // Mulberry32 — small, deterministic.
  let a = seed >>> 0;
  return function() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let _nextId = 1;

export function newOrder(rng, level, now) {
  const key = SELECT_RECIPES[Math.floor(rng() * SELECT_RECIPES.length)];
  const recipe = RECIPES[key];
  // Rush/higher levels tighten the timer.
  const factor = level >= 3 ? 0.78 : level === 2 ? 0.9 : 1.0;
  const limit = Math.round(recipe.time * factor);
  return {
    id: _nextId++,
    recipe: recipe.id,
    stepIndex: 0,
    createdAt: now,
    limit,
    remaining: limit,
    state: 'active', // active | done | failed
  };
}

export function createState(opts) {
  const seed = opts && opts.seed != null ? opts.seed : 12345;
  return {
    screen: 'menu', // menu | playing | paused | recipes | win | fail
    rng: makeRNG(seed),
    seed,
    levelIndex: 0,
    score: 0,
    mistakes: 0,
    orders: [],
    served: 0,
    ordersSpawned: 0,
    selectedStation: 'board',
    current: null, // dish in progress: {recipe, stepIndex}
    spawnTimer: 0,
    now: 0,
    muted: false,
    tutorialSeen: false,
    lastEvent: null, // {type, text, at} for animations/sound hooks
    flash: 0, // screen flash timer for mistakes
    serveAnim: 0, // plate-fly animation timer
  };
}

export function level(s) { return LEVELS[s.levelIndex]; }

// Begin preparing a dish of a given recipe (if none in progress).
export function startDish(s, recipeId) {
  if (s.current) return false;
  s.current = { recipe: recipeId, stepIndex: 0 };
  return true;
}

// Player performs the action at `stationId` with optional ingredient.
// Returns an event type string for audio/animation.
export function doAction(s, stationId) {
  if (s.screen !== 'playing') return 'none';
  if (!s.current) {
    // Clicking a station with no dish: try to auto-start the oldest active
    // order's recipe so the game is forgiving.
    const o = s.orders.find((x) => x.state === 'active');
    if (!o) return 'none';
    s.current = { recipe: o.recipe, stepIndex: 0 };
  }
  const recipe = RECIPES[s.current.recipe];
  const step = recipe.steps[s.current.stepIndex];
  if (step.station !== stationId) {
    return mistake(s, 'Wrong station');
  }
  s.current.stepIndex++;
  s.lastEvent = { type: 'step', text: step.label, at: s.now };
  if (s.current.stepIndex >= recipe.steps.length) {
    return finishDish(s);
  }
  return 'step';
}

function finishDish(s) {
  // Serve to the oldest matching active order.
  const idx = s.orders.findIndex(
    (o) => o.state === 'active' && o.recipe === s.current.recipe
  );
  if (idx === -1) {
    // Cooked a dish nobody ordered.
    s.current = null;
    return mistake(s, 'No matching order');
  }
  const o = s.orders[idx];
  const recipe = RECIPES[o.recipe];
  // Bonus for serving with time to spare.
  const speedBonus = Math.max(0, Math.round(o.remaining * 2));
  s.score += recipe.reward + speedBonus;
  o.state = 'done';
  s.served++;
  s.current = null;
  s.serveAnim = 0.6;
  s.lastEvent = { type: 'serve', text: recipe.name + ' served!', at: s.now };
  checkLevel(s);
  return 'serve';
}

function mistake(s, why) {
  s.mistakes++;
  s.flash = 0.35;
  s.current = null;
  s.lastEvent = { type: 'error', text: why, at: s.now };
  if (s.mistakes >= MAX_MISTAKES) {
    s.screen = 'fail';
    s.lastEvent = { type: 'fail', text: 'Too many mistakes', at: s.now };
  }
  return 'error';
}

function checkLevel(s) {
  const lv = level(s);
  if (s.score >= lv.target) {
    if (s.levelIndex >= LEVELS.length - 1) {
      s.screen = 'win';
      s.lastEvent = { type: 'win', text: 'Daily target reached!', at: s.now };
    } else {
      s.levelIndex++;
      s.ordersSpawned = 0;
      s.served = 0;
      s.spawnTimer = 0;
      s.lastEvent = { type: 'level', text: 'Level ' + (s.levelIndex + 1), at: s.now };
    }
  }
}

// Advance the simulation by dt seconds.
export function update(s, dt) {
  if (s.screen !== 'playing') return;
  s.now += dt;
  if (s.flash > 0) s.flash = Math.max(0, s.flash - dt);
  if (s.serveAnim > 0) s.serveAnim = Math.max(0, s.serveAnim - dt);
  const lv = level(s);
  // Count down active orders.
  for (const o of s.orders) {
    if (o.state !== 'active') continue;
    o.remaining -= dt;
    if (o.remaining <= 0) {
      o.remaining = 0;
      o.state = 'failed';
      mistake(s, 'Order timed out');
    }
  }
  // Drop resolved tickets after a short delay so the player sees the result.
  s.orders = s.orders.filter(
    (o) => o.state === 'active' || s.now - o.createdAt < o.limit + 1.2
  );
  // Spawn new customers until this level's order quota is met.
  const active = s.orders.filter((o) => o.state === 'active').length;
  if (s.ordersSpawned < lv.orders && active < lv.maxActive) {
    s.spawnTimer += dt;
    if (s.spawnTimer >= lv.spawnEvery || s.ordersSpawned === 0) {
      s.spawnTimer = 0;
      s.orders.push(newOrder(s.rng, lv.level, s.now));
      s.ordersSpawned++;
    }
  }
  // Closing time: all orders for the level issued and resolved.
  if (
    s.ordersSpawned >= lv.orders &&
    s.orders.every((o) => o.state !== 'active') &&
    !s.current
  ) {
    if (s.score >= lv.target) checkLevel(s);
    else if (s.screen === 'playing') {
      s.screen = 'fail';
      s.lastEvent = { type: 'fail', text: 'Target missed at closing', at: s.now };
    }
  }
}

// Build a fixed, good-looking state for deterministic screenshots.
export function shotState(kind, seed) {
  const s = createState({ seed: seed || 1 });
  s.tutorialSeen = true;
  if (kind === 'menu') { s.screen = 'menu'; return s; }
  if (kind === 'recipes') { s.screen = 'recipes'; return s; }
  // gameplay: 2 orders on the board, a dish mid-assembly, timer running,
  // a plated dish ready to serve.
  s.screen = 'playing';
  s.score = 240;
  s.now = 8;
  s.orders = [
    { id: 1, recipe: 'pasta', stepIndex: 0, createdAt: 2, limit: 22, remaining: 14, state: 'active' },
    { id: 2, recipe: 'sandwich', stepIndex: 0, createdAt: 4, limit: 24, remaining: 19, state: 'active' },
  ];
  _nextId = 3;
  s.current = { recipe: 'pasta', stepIndex: 1 }; // tomato chopped, pasta next
  s.selectedStation = 'stove';
  s.serveAnim = 0.4;
  return s;
}
