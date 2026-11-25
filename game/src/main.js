// Line Cook Rush v3 — main: boot, screens, game loop, keyboard + mouse input,
// and the deterministic screenshot mode (?shot=gameplay|rush|recipes|menu).

import { VIEW_W, VIEW_H, STATIONS, LEVELS } from './data.js';
import { Kitchen } from './engine.js';
import { SoundFX } from './audio.js';
import { render } from './draw.js';

const params = new URLSearchParams(window.location.search);
const SHOT = params.get('shot');
const SEED = Number(params.get('seed') || '1');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const sound = new SoundFX();

const game = {
  screen: 'menu', // menu | game | recipes | help | dayEnd
  paused: false,
  showTutorial: true,
  kitchen: new Kitchen(SEED),
  lastTime: 0,
  hint: '',
  hintUntil: 0,
};
window.__game = game; // debug handle (also used by the screenshot smoke test)

// Screenshot mode: a frozen, seeded frame, then raise the ready flag.
// The page note below the canvas is hidden so the shot is exactly 1280x720.
if (SHOT) {
  const note = document.getElementById('note');
  if (note) note.style.display = 'none';
}
if (SHOT === 'gameplay' || SHOT === 'rush') {
  game.screen = 'game';
  game.showTutorial = false;
  game.kitchen.loadShot(SHOT);
} else if (SHOT === 'recipes') {
  game.screen = 'recipes';
} else if (SHOT === 'menu') {
  game.screen = 'menu';
  game.kitchen.loadDemo();
}

function playEvent(ev) {
  switch (ev.type) {
    case 'chop': sound.chop(); break;
    case 'sizzle': sound.sizzle(); break;
    case 'ding': sound.ding(); break;
    case 'pop': sound.pop(); break;
    case 'error': sound.error(); break;
    case 'serve': sound.serve(); break;
    case 'burnt': sound.burnt(); break;
    case 'win': sound.win(); break;
    case 'lose': sound.lose(); break;
    case 'select': sound.pop(); break;
    case 'hint':
      game.hint = ev.text;
      game.hintUntil = performance.now() + 2200;
      break;
    default: break;
  }
}

function startGame() {
  sound.unlock();
  game.kitchen.newGame();
  game.screen = 'game';
  game.paused = false;
  game.showTutorial = true;
}

function toRecipes() {
  game.screen = 'recipes';
}

function backToMenu() {
  game.screen = 'menu';
  game.kitchen.loadDemo();
}

function advanceDay() {
  const k = game.kitchen;
  if (k.phase === 'won' || k.phase === 'lost') {
    startGame();
    return;
  }
  if (k.dayResult === 'pass') {
    k.nextLevel();
    game.screen = 'game';
    game.showTutorial = false;
  } else {
    k.startLevel(k.levelIndex); // retry the same day, score keeps its place
    game.screen = 'game';
  }
}

// ---------- input ----------

const STATION_BY_KEY = { 1: 'board', 2: 'stove', 3: 'plating', 4: 'serving' };

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  const key = e.key.toLowerCase();
  sound.unlock();

  if (key === 'm') {
    const muted = sound.toggleMute();
    game.hint = muted ? 'Sound off' : 'Sound on';
    game.hintUntil = performance.now() + 1200;
    return;
  }

  if (game.screen === 'menu') {
    if (key === 'enter' || key === ' ') startGame();
    else if (key === 'r') toRecipes();
    else if (key === 'h') game.screen = 'help';
    return;
  }
  if (game.screen === 'recipes') {
    if (key === 'enter' || key === ' ' || key === 'escape') backToMenu();
    return;
  }
  if (game.screen === 'help') {
    if (key === 'h' || key === 'escape') game.screen = game.kitchen ? 'game' : 'menu';
    return;
  }
  if (game.screen === 'dayEnd') {
    if (key === 'enter' || key === 'r') advanceDay();
    return;
  }

  // gameplay
  if (key === 'p' || key === 'escape') {
    game.paused = !game.paused;
    return;
  }
  if (game.paused) return;
  if (key === 'h') { game.screen = 'help'; return; }
  if (key === 'r') { game.kitchen.startLevel(game.kitchen.levelIndex); return; }
  if (key === 'tab') {
    e.preventDefault();
    game.kitchen.cycleOrder();
    return;
  }
  if (STATION_BY_KEY[key]) {
    game.kitchen.pressStation(STATION_BY_KEY[key]);
  }
});

function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * VIEW_W,
    y: ((e.clientY - rect.top) / rect.height) * VIEW_H,
  };
}

canvas.addEventListener('click', (e) => {
  sound.unlock();
  const { x, y } = canvasPos(e);

  if (game.screen === 'menu') {
    // start button
    if (x >= 500 && x <= 780 && y >= 400 && y <= 456) startGame();
    return;
  }
  if (game.screen === 'recipes') { backToMenu(); return; }
  if (game.screen === 'help') { game.screen = 'game'; return; }
  if (game.screen === 'dayEnd') { advanceDay(); return; }
  if (game.paused) return;

  // order tickets: x 24-296, first ticket top depends on the rush banner
  const boardTop = game.kitchen.level.rush ? 96 : 74;
  const firstTicket = boardTop + 38;
  if (x >= 24 && x <= 296 && y >= firstTicket) {
    const idx = Math.floor((y - firstTicket) / 122);
    const order = game.kitchen.orders[idx];
    if (order) { game.kitchen.selectOrder(order.id); return; }
  }

  // stations: counter row
  for (const st of STATIONS) {
    if (Math.abs(x - st.x) <= 88 && y >= st.y - 110 && y <= st.y + 130) {
      game.kitchen.pressStation(st.id);
      return;
    }
  }
  // tray: click a READY dish to serve it too
  if (x >= 852 && x <= 1072 && y >= 422 && y <= 536 && game.kitchen.tray.length > 0) {
    game.kitchen.pressStation('serving');
  }
});

// ---------- loop ----------

function frame(t) {
  const dt = Math.min(0.05, (t - game.lastTime) / 1000 || 0);
  game.lastTime = t;
  const now = t / 1000;

  if (game.screen === 'game' && !game.paused && !game.kitchen.frozen) {
    game.kitchen.update(dt);
    for (const ev of game.kitchen.drainEvents()) playEvent(ev);
    if (game.kitchen.phase === 'dayEnd' || game.kitchen.phase === 'won' || game.kitchen.phase === 'lost') {
      game.screen = 'dayEnd';
    }
    // hide the tutorial once the player serves their first dish
    if (game.kitchen.servedCount > 0) game.showTutorial = false;
  }

  render(ctx, game, now);

  // one-line hint toast above the bottom bar
  if (game.hint && performance.now() < game.hintUntil) {
    ctx.fillStyle = 'rgba(46,33,24,0.9)';
    ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
    ctx.textAlign = 'center';
    const w = ctx.measureText(game.hint).width + 28;
    ctx.beginPath();
    ctx.roundRect(640 - w / 2, 606, w, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#fff8e8';
    ctx.fillText(game.hint, 640, 626);
  }

  if (SHOT) {
    // deterministic frame: render once, then signal the screenshot tool
    window.__SHOT_READY__ = true;
    return;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
