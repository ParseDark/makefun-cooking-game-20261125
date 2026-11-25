// Line Cook Rush — game state and rules. Rendering lives in render.js; this
// file only decides what happens when the cook works, serves, or runs out of
// time. Sounds are reported through run.fx (names the Sfx class plays).

import {
  CUSTOMERS,
  LEVELS,
  MAX_ORDERS,
  MAX_STRIKES,
  RECIPES,
  TIME_BONUS,
  WORK_SECONDS,
  mulberry32,
  recipeById,
  stationById,
} from './data.js';

export function createRun(seed = 1) {
  return {
    screen: 'menu', // menu | recipes | playing | paused | leveldone | dayover | win
    level: 0,
    score: 0,
    best: 0,
    strikes: 0,
    orders: [], // { id, recipeId, customer, timeLeft, timeTotal }
    nextOrderId: 1,
    selected: 0,
    bench: null, // { recipeId, done } — the dish being assembled on your plate
    tray: null, // { recipeId } — a finished dish waiting on the serving window
    dayLeft: LEVELS[0].daySeconds,
    spawnIn: 4,
    msg: '',
    msgT: 0,
    popups: [], // { text, x, y, t }
    work: null, // { station, t } — the short "working" animation
    rng: mulberry32(seed),
    fx: [], // sound names queued since the last frame
    help: false,
    overReason: '',
    served: 0,
    seed,
  };
}

export function levelOf(run) {
  return LEVELS[run.level];
}

function setMsg(run, text) {
  run.msg = text;
  run.msgT = 3.5;
}

function addPopup(run, text, x, y) {
  run.popups.push({ text, x, y, t: 1.2 });
  if (run.popups.length > 6) run.popups.shift();
}

export function startLevel(run, idx) {
  run.level = idx;
  run.strikes = 0;
  run.orders = [];
  run.bench = null;
  run.tray = null;
  run.dayLeft = LEVELS[idx].daySeconds;
  run.spawnIn = 3;
  run.selected = 0;
  run.work = null;
  run.popups = [];
  run.screen = 'playing';
  const lv = LEVELS[idx];
  setMsg(run, `Level ${idx + 1}: ${lv.name} — reach ${lv.target} pts before closing.`);
}

export function startRun(run) {
  run.score = 0;
  run.served = 0;
  startLevel(run, 0);
}

function newOrder(run) {
  const recipe = RECIPES[Math.floor(run.rng() * RECIPES.length)];
  const customer = CUSTOMERS[Math.floor(run.rng() * CUSTOMERS.length)];
  const total = recipe.seconds * levelOf(run).rush;
  run.orders.push({
    id: run.nextOrderId++,
    recipeId: recipe.id,
    customer,
    timeLeft: total,
    timeTotal: total,
  });
}

function strike(run, reason) {
  run.strikes += 1;
  run.fx.push('buzz');
  setMsg(run, reason);
  if (run.strikes >= MAX_STRIKES) endDay(run, 'strikes');
}

function endDay(run, reason) {
  run.overReason = reason;
  run.best = Math.max(run.best, run.score);
  if (reason === 'strikes') {
    run.screen = 'dayover';
    run.fx.push('fail');
    return;
  }
  if (reason === 'target') {
    run.screen = 'dayover';
    run.fx.push('fail');
    return;
  }
  // reason === 'clear': the level target was met at closing time.
  if (run.level >= LEVELS.length - 1) {
    run.screen = 'win';
  } else {
    run.screen = 'leveldone';
  }
  run.fx.push('win');
}

export function tick(run, dt) {
  if (run.screen !== 'playing') return;
  if (run.work) {
    run.work.t -= dt;
    if (run.work.t <= 0) run.work = null;
  }
  if (run.msgT > 0) run.msgT -= dt;
  for (const p of run.popups) {
    p.t -= dt;
    p.y -= 28 * dt;
  }
  run.popups = run.popups.filter((p) => p.t > 0);

  // New tickets walk in on a loose schedule, never more than MAX_ORDERS.
  run.spawnIn -= dt;
  if (run.spawnIn <= 0) {
    if (run.orders.length < MAX_ORDERS) newOrder(run);
    run.spawnIn = levelOf(run).spawnEvery * (0.85 + run.rng() * 0.3);
  }

  // Order timers: an expired ticket is a strike.
  for (let i = run.orders.length - 1; i >= 0; i--) {
    const o = run.orders[i];
    o.timeLeft -= dt;
    if (o.timeLeft <= 0) {
      const recipe = recipeById(o.recipeId);
      run.orders.splice(i, 1);
      if (run.selected >= run.orders.length) run.selected = Math.max(0, run.orders.length - 1);
      strike(run, `Timed out: ${o.customer}'s ${recipe.name} walked out.`);
      if (run.screen !== 'playing') return;
    }
  }

  // The day ends at closing time: target met, or not.
  run.dayLeft -= dt;
  if (run.dayLeft <= 0) {
    run.dayLeft = 0;
    endDay(run, run.score >= levelOf(run).target ? 'clear' : 'target');
  }
}

export function cycleOrder(run, dir = 1) {
  if (run.orders.length === 0) return;
  run.selected = (run.selected + dir + run.orders.length) % run.orders.length;
  run.fx.push('click');
}

export function pickOrder(run, index) {
  if (index < 0 || index >= run.orders.length) return;
  run.selected = index;
  run.fx.push('click');
}

// Work a station. The 'window' station serves instead of working.
export function workAt(run, stationId) {
  if (run.screen !== 'playing' || run.work) return;
  if (stationId === 'window') {
    serveDish(run);
    return;
  }
  if (!run.bench) {
    if (run.orders.length === 0) {
      setMsg(run, 'No orders yet — wait for a ticket on the board.');
      return;
    }
    const picked = run.orders[run.selected] ?? run.orders[0];
    run.bench = { recipeId: picked.recipeId, done: 0 };
  }
  const recipe = recipeById(run.bench.recipeId);
  const step = recipe.steps[run.bench.done];
  if (!step) return;
  if (step.station !== stationId) {
    const needed = stationById(step.station);
    strike(run, `Wrong station — "${step.label}" needs the ${needed.name}.`);
    return;
  }
  run.work = { station: stationId, t: WORK_SECONDS };
  run.fx.push(stationId === 'stove' ? 'sizzle' : stationId === 'board' ? 'chop' : 'ding');
  run.bench.done += 1;
  if (run.bench.done >= recipe.steps.length) {
    run.tray = { recipeId: run.bench.recipeId };
    run.bench = null;
    run.fx.push('ding');
    setMsg(run, `${recipe.name} is plated — serve it at the window (4 / Space).`);
  }
}

export function serveDish(run) {
  if (run.screen !== 'playing') return;
  if (!run.tray) {
    setMsg(run, 'Nothing plated yet — finish a dish first.');
    return;
  }
  const at = run.orders.findIndex((o) => o.recipeId === run.tray.recipeId);
  if (at < 0) {
    strike(run, 'Nobody ordered that dish — it goes in the bin.');
    run.tray = null;
    return;
  }
  const order = run.orders[at];
  const recipe = recipeById(order.recipeId);
  const bonus = Math.round(TIME_BONUS * Math.max(0, order.timeLeft / order.timeTotal));
  const pts = recipe.points + bonus;
  run.score += pts;
  run.served += 1;
  run.orders.splice(at, 1);
  if (run.selected >= run.orders.length) run.selected = Math.max(0, run.orders.length - 1);
  addPopup(run, `+${pts}`, 1080, 250);
  run.fx.push('ding');
  setMsg(run, `${recipe.name} served to ${order.customer} — +${pts} pts (${recipe.points} + ${bonus} speed).`);
  run.tray = null;
}

// Deterministic staged states for the three screenshots (?shot=…&seed=1).
export function shotSetup(run, kind) {
  run.fx = [];
  run.popups = [];
  run.work = null;
  run.help = false;
  if (kind === 'menu') {
    run.screen = 'menu';
    run.score = 0;
    run.orders = [];
    run.bench = null;
    run.tray = null;
    return;
  }
  if (kind === 'recipes') {
    run.screen = 'recipes';
    return;
  }
  // gameplay: two tickets, one dish mid-assembly, one plated and ready.
  run.screen = 'playing';
  run.level = 0;
  run.score = 240;
  run.strikes = 0;
  run.dayLeft = 62;
  run.spawnIn = 6;
  run.orders = [
    { id: 1, recipeId: 'pasta', customer: 'Maya', timeLeft: 15, timeTotal: 24 },
    { id: 2, recipeId: 'sandwich', customer: 'Leo', timeLeft: 9, timeTotal: 26 },
  ];
  run.selected = 0;
  run.bench = { recipeId: 'pasta', done: 1 };
  run.tray = { recipeId: 'salad' };
  run.msg = 'Pasta is on the board — boil it next (key 2).';
  run.msgT = 3;
}
