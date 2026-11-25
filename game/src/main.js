// Line Cook Rush — bootstrap: canvas, input, the frame loop, and the
// deterministic ?shot=… mode the screenshots are taken from.

import { VIEW_H, VIEW_W } from './data.js';
import { Sfx } from './audio.js';
import {
  createRun,
  cycleOrder,
  pickOrder,
  serveDish,
  shotSetup,
  startLevel,
  startRun,
  tick,
  workAt,
} from './state.js';
import { draw } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sfx = new Sfx();
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;
const run = createRun(seed);
const ui = { t: 0, hover: { x: -1, y: -1 }, buttons: [], tickets: [], stations: [] };

function toGame(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (VIEW_W / rect.width),
    y: (e.clientY - rect.top) * (VIEW_H / rect.height),
  };
}

function hit(list, p) {
  return list.find((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
}

function pressButton(id) {
  sfx.ensure();
  if (id === 'start' || id === 'again') {
    sfx.play('click');
    startRun(run);
  } else if (id === 'recipes') {
    sfx.play('click');
    run.screen = 'recipes';
  } else if (id === 'back' || id === 'menu') {
    sfx.play('click');
    run.screen = 'menu';
  } else if (id === 'next') {
    sfx.play('click');
    startLevel(run, run.level + 1);
  } else if (id === 'retry') {
    sfx.play('click');
    startRun(run);
  }
}

canvas.addEventListener('mousemove', (e) => {
  ui.hover = toGame(e);
});

canvas.addEventListener('click', (e) => {
  sfx.ensure();
  const p = toGame(e);
  const button = hit(ui.buttons, p);
  if (button) {
    pressButton(button.id);
    return;
  }
  if (run.screen !== 'playing') return;
  const ticket = hit(ui.tickets, p);
  if (ticket) {
    pickOrder(run, ticket.index);
    return;
  }
  const station = hit(ui.stations, p);
  if (station) workAt(run, station.id);
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'Tab' || e.code === 'Space') e.preventDefault();
  sfx.ensure();
  const k = e.code;
  if (k === 'KeyM') {
    sfx.setMuted(!sfx.muted);
    return;
  }
  if (run.screen === 'menu') {
    if (k === 'Enter' || k === 'Space') pressButton('start');
    else if (k === 'KeyR') pressButton('recipes');
    return;
  }
  if (run.screen === 'recipes') {
    if (k === 'Escape' || k === 'Enter') pressButton('back');
    return;
  }
  if (run.screen === 'leveldone') {
    if (k === 'Enter' || k === 'Space') pressButton('next');
    return;
  }
  if (run.screen === 'dayover') {
    if (k === 'KeyR') pressButton('retry');
    else if (k === 'Escape') pressButton('menu');
    return;
  }
  if (run.screen === 'win') {
    if (k === 'KeyR') pressButton('again');
    else if (k === 'Escape') pressButton('menu');
    return;
  }
  if (run.screen === 'paused') {
    if (k === 'KeyP' || k === 'Escape') {
      run.screen = 'playing';
      sfx.play('click');
    }
    return;
  }
  // playing
  if (k === 'KeyH') {
    run.help = !run.help;
    sfx.play('click');
    return;
  }
  if (run.help) {
    if (k === 'Escape') run.help = false;
    return;
  }
  if (k === 'KeyP' || k === 'Escape') {
    run.screen = 'paused';
    sfx.play('click');
    return;
  }
  if (k === 'Tab') {
    cycleOrder(run, e.shiftKey ? -1 : 1);
    return;
  }
  if (k === 'Digit1') workAt(run, 'board');
  else if (k === 'Digit2') workAt(run, 'stove');
  else if (k === 'Digit3') workAt(run, 'table');
  else if (k === 'Digit4' || k === 'Space') serveDish(run);
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  ui.t += dt;
  tick(run, dt);
  for (const name of run.fx) sfx.play(name);
  run.fx.length = 0;
  draw(ctx, run, ui);
  requestAnimationFrame(frame);
}

if (shot === 'menu' || shot === 'gameplay' || shot === 'recipes') {
  // One fixed frame, no clock: the screenshot is reproducible.
  shotSetup(run, shot);
  draw(ctx, run, ui);
  window.__SHOT_READY__ = true;
} else {
  requestAnimationFrame(frame);
}
