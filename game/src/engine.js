// Line Cook Rush v3 — engine: orders, steps, the stove heat gauge, scoring,
// strikes, levels and the frozen screenshot states. No drawing here.

import {
  DISHES, LEVELS, CUSTOMERS, HEAT, MAX_STRIKES, MAX_ORDERS, TIME_BONUS,
  mulberry32, dishById,
} from './data.js';

let nextOrderId = 1;

export class Kitchen {
  constructor(seed = 1) {
    this.rng = mulberry32(seed);
    this.seed = seed;
    this.events = [];
    this.floats = [];
    this.newGame();
  }

  newGame() {
    this.score = 0;
    this.levelIndex = 0;
    this.strikes = 0;
    this.servedCount = 0;
    this.customerCursor = 0;
    this.phase = 'playing'; // playing | dayEnd | won | lost
    this.dayResult = null; // 'pass' | 'fail'
    this.startLevel(0);
  }

  startLevel(i) {
    const level = LEVELS[i];
    this.levelIndex = i;
    this.level = level;
    this.dayLeft = level.daySeconds;
    this.orders = [];
    this.tray = [];
    this.selectedId = null;
    this.spawnTimer = 2.0;
    this.phase = 'playing';
    this.dayResult = null;
    this.spawnOrder();
    this.spawnOrder();
  }

  spawnOrder() {
    if (this.orders.length >= MAX_ORDERS) return null;
    const dish = DISHES[Math.floor(this.rng() * DISHES.length)];
    const customer = CUSTOMERS[this.customerCursor % CUSTOMERS.length];
    this.customerCursor++;
    const timeMax = dish.seconds * this.level.timeFactor;
    const order = {
      id: nextOrderId++,
      dishId: dish.id,
      customer: customer.name,
      customerIdx: CUSTOMERS.indexOf(customer),
      timeMax,
      timeLeft: timeMax,
      stepIndex: 0,
      cooking: null, // { station, kind: 'plain'|'heat', progress, heat }
      done: false,
    };
    this.orders.push(order);
    if (this.selectedId === null) this.selectedId = order.id;
    this.events.push({ type: 'spawn' });
    return order;
  }

  selectedOrder() {
    return this.orders.find((o) => o.id === this.selectedId) || null;
  }

  cycleOrder() {
    if (this.orders.length === 0) return;
    const idx = this.orders.findIndex((o) => o.id === this.selectedId);
    const next = this.orders[(idx + 1) % this.orders.length];
    this.selectedId = next.id;
    this.events.push({ type: 'select' });
  }

  selectOrder(id) {
    if (this.orders.some((o) => o.id === id)) {
      this.selectedId = id;
      this.events.push({ type: 'select' });
    }
  }

  addFloat(x, y, text, color) {
    this.floats.push({ x, y, text, color, ttl: 1.4 });
  }

  addStrike(reason, x, y) {
    this.strikes++;
    this.events.push({ type: 'strike', reason });
    this.addFloat(x ?? 640, y ?? 120, reason, '#d84a3a');
    if (this.strikes >= MAX_STRIKES) this.endDay();
  }

  endDay() {
    if (this.phase !== 'playing') return;
    const passed = this.score >= this.level.target;
    this.phase = 'dayEnd';
    this.dayResult = passed ? 'pass' : 'fail';
    this.events.push({ type: passed ? 'win' : 'lose', level: this.levelIndex });
    if (passed && this.levelIndex === LEVELS.length - 1) this.phase = 'won';
    if (!passed) this.phase = 'lost';
  }

  nextLevel() {
    if (this.levelIndex + 1 < LEVELS.length) {
      this.strikes = 0;
      this.startLevel(this.levelIndex + 1);
    }
  }

  // The player's main verb: press a station (key 1-4 or click).
  pressStation(stationId) {
    if (this.phase !== 'playing') return;

    // Serving window: hand over the oldest ready dish on the tray.
    if (stationId === 'serving') {
      const ready = this.tray[0];
      if (!ready) {
        this.events.push({ type: 'hint', text: 'Nothing ready to serve yet' });
        return;
      }
      this.tray.shift();
      const dish = dishById(ready.dishId);
      const bonus = ready.onTime ? TIME_BONUS : 0;
      this.score += dish.points + bonus;
      this.servedCount++;
      this.events.push({ type: 'serve', points: dish.points + bonus, bonus });
      this.addFloat(960, 260, '+' + (dish.points + bonus), '#3f9e57');
      return;
    }

    const order = this.selectedOrder();
    if (!order) {
      this.events.push({ type: 'hint', text: 'Pick an order first (Tab or click)' });
      return;
    }
    if (order.done) {
      this.events.push({ type: 'hint', text: 'That dish is already plated — serve it!' });
      return;
    }
    const dish = dishById(order.dishId);
    const step = dish.steps[order.stepIndex];

    // A step is already cooking: only the same station can touch it.
    if (order.cooking) {
      if (order.cooking.station !== stationId) return; // busy elsewhere, ignore
      if (order.cooking.kind === 'heat') this.pullFromStove(order);
      return;
    }

    // Starting a step at the wrong station is a strike.
    if (step.station !== stationId) {
      this.events.push({ type: 'error' });
      this.addStrike('WRONG STATION!', 640, 150);
      return;
    }

    if (step.heat) {
      order.cooking = { station: stationId, kind: 'heat', heat: 0 };
      this.events.push({ type: 'sizzle' });
    } else {
      order.cooking = { station: stationId, kind: 'plain', progress: 0 };
      this.events.push({ type: 'chop' });
    }
  }

  // Pull the dish off the stove: green = perfect, raw = not yet, red = burnt.
  pullFromStove(order) {
    const heat = order.cooking.heat;
    if (heat < HEAT.perfectLow) {
      this.events.push({ type: 'hint', text: 'Still raw — wait for the green!' });
      return;
    }
    if (heat <= HEAT.perfectHigh) {
      this.completeStep(order, true);
      return;
    }
    // Pulled in the red zone: burnt.
    order.cooking = null;
    this.events.push({ type: 'burnt' });
    this.addStrike('BURNT!', 640, 150);
  }

  completeStep(order, perfect) {
    order.cooking = null;
    order.stepIndex++;
    this.events.push({ type: perfect ? 'ding' : 'pop' });
    if (order.stepIndex >= 3) {
      order.done = true;
      const onTime = order.timeLeft > 0;
      this.tray.push({ orderId: order.id, dishId: order.dishId, onTime });
      this.orders = this.orders.filter((o) => o.id !== order.id);
      if (this.selectedId === order.id) {
        this.selectedId = this.orders.length ? this.orders[0].id : null;
      }
      this.events.push({ type: 'ready', dishId: order.dishId });
      this.addFloat(960, 240, 'READY!', '#3f9e57');
    }
  }

  update(dt) {
    if (this.phase !== 'playing') return;
    this.dayLeft -= dt;
    if (this.dayLeft <= 0) {
      this.dayLeft = 0;
      this.endDay();
      return;
    }

    // Spawn new orders on a steady beat.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnOrder();
      this.spawnTimer = this.level.spawnEvery * (0.9 + this.rng() * 0.2);
    }

    // Order timers; a timeout is a strike and the customer walks out.
    for (const order of [...this.orders]) {
      order.timeLeft -= dt;
      if (order.timeLeft <= 0) {
        order.timeLeft = 0;
        this.orders = this.orders.filter((o) => o.id !== order.id);
        if (this.selectedId === order.id) {
          this.selectedId = this.orders.length ? this.orders[0].id : null;
        }
        this.events.push({ type: 'timeout', customer: order.customer });
        this.addStrike('TIME OUT!', 640, 150);
        if (this.phase !== 'playing') return;
      }
    }

    // Cooking progress: plain steps fill a bar; stove steps heat up.
    for (const order of this.orders) {
      if (!order.cooking) continue;
      if (order.cooking.kind === 'plain') {
        order.cooking.progress += dt / 1.1;
        if (order.cooking.progress >= 1) this.completeStep(order, false);
      } else {
        order.cooking.heat += HEAT.risePerSecond * dt;
        if (order.cooking.heat >= HEAT.burnAt) {
          order.cooking = null;
          this.events.push({ type: 'burnt' });
          this.addStrike('BURNT!', 640, 150);
          if (this.phase !== 'playing') return;
        }
      }
    }

    // Floating score texts fade out.
    for (const f of this.floats) f.ttl -= dt;
    this.floats = this.floats.filter((f) => f.ttl > 0);
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  // ---- Frozen, deterministic states for screenshots (no timers run) ----
  loadShot(kind) {
    this.frozen = true;
    this.events = [];
    this.floats = [];
    if (kind === 'gameplay') {
      this.score = 240;
      this.levelIndex = 0;
      this.level = LEVELS[0];
      this.dayLeft = 62;
      this.strikes = 0;
      this.servedCount = 2;
      this.phase = 'playing';
      this.orders = [
        {
          id: 101, dishId: 'pasta', customer: 'Mia', customerIdx: 0,
          timeMax: 24, timeLeft: 15, stepIndex: 2,
          cooking: { station: 'plating', kind: 'plain', progress: 0.66 }, done: false,
        },
        {
          id: 102, dishId: 'sandwich', customer: 'Leo', customerIdx: 1,
          timeMax: 26, timeLeft: 19, stepIndex: 0,
          cooking: { station: 'stove', kind: 'heat', heat: 78 }, done: false,
        },
      ];
      this.selectedId = 101;
      this.tray = [{ orderId: 100, dishId: 'salad', onTime: true }];
    } else if (kind === 'rush') {
      this.score = 980;
      this.levelIndex = 2;
      this.level = LEVELS[2];
      this.dayLeft = 38;
      this.strikes = 1;
      this.servedCount = 9;
      this.phase = 'playing';
      this.orders = [
        {
          id: 201, dishId: 'salad', customer: 'Zoe', customerIdx: 4,
          timeMax: 21.8, timeLeft: 6, stepIndex: 1, cooking: null, done: false,
        },
        {
          id: 202, dishId: 'sandwich', customer: 'Ben', customerIdx: 3,
          timeMax: 20.3, timeLeft: 12, stepIndex: 2,
          cooking: { station: 'plating', kind: 'plain', progress: 0.5 }, done: false,
        },
        {
          id: 203, dishId: 'pasta', customer: 'Ana', customerIdx: 2,
          timeMax: 18.7, timeLeft: 15, stepIndex: 0, cooking: null, done: false,
        },
        {
          id: 204, dishId: 'sandwich', customer: 'Max', customerIdx: 5,
          timeMax: 20.3, timeLeft: 17, stepIndex: 0,
          cooking: { station: 'stove', kind: 'heat', heat: 78 }, done: false,
        },
      ];
      this.selectedId = 201;
      this.tray = [{ orderId: 199, dishId: 'salad', onTime: true }];
    }
  }

  // A calm decorative kitchen for the menu background.
  loadDemo() {
    this.frozen = true;
    this.score = 0;
    this.levelIndex = 0;
    this.level = LEVELS[0];
    this.dayLeft = 150;
    this.strikes = 0;
    this.phase = 'playing';
    this.orders = [
      {
        id: 301, dishId: 'pasta', customer: 'Mia', customerIdx: 0,
        timeMax: 24, timeLeft: 18, stepIndex: 1,
        cooking: { station: 'stove', kind: 'heat', heat: 66 }, done: false,
      },
      {
        id: 302, dishId: 'salad', customer: 'Leo', customerIdx: 1,
        timeMax: 28, timeLeft: 22, stepIndex: 0, cooking: null, done: false,
      },
    ];
    this.selectedId = 301;
    this.tray = [{ orderId: 300, dishId: 'sandwich', onTime: true }];
  }
}
