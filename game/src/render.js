// render.js — all drawing. Reads state, draws to the 2D canvas. No game logic.

import { W, H, PAL, INGREDIENTS, STATIONS, RECIPES, RECIPE_LIST, LEVELS }
  from './config.js';
import { level } from './state.js';

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function label(ctx, text, x, y, size, color, align) {
  ctx.fillStyle = color;
  ctx.font = '600 ' + size + 'px system-ui, sans-serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

// ---- ingredient / food icons (flat shapes) --------------------------------
function foodIcon(ctx, id, x, y, s) {
  const ing = INGREDIENTS[id];
  if (!ing) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = ing.color;
  if (ing.shape === 'round') {
    ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.3, s * 0.3, 0, Math.PI * 2); ctx.fill();
    if (id === 'tomato' || id === 'apple') {
      ctx.fillStyle = '#3f8b3a';
      ctx.fillRect(-2, -s - 3, 4, 6);
    }
  } else if (ing.shape === 'noodle') {
    ctx.strokeStyle = ing.color; ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(i * 5, 0, s * 0.8, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }
  } else if (ing.shape === 'egg') {
    ctx.fillStyle = '#faf7ee';
    ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f4b73d';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2); ctx.fill();
  } else if (ing.shape === 'slice') {
    ctx.fillStyle = ing.color;
    rr(ctx, -s, -s * 0.8, s * 2, s * 1.6, 4); ctx.fill();
    ctx.fillStyle = '#f0d9a8';
    rr(ctx, -s * 0.7, -s * 0.5, s * 1.4, s, 3); ctx.fill();
  }
  ctx.restore();
}

// ---- a plated dish --------------------------------------------------------
function plate(ctx, recipeId, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = PAL.shadow;
  ctx.beginPath(); ctx.ellipse(0, s * 0.5, s * 1.25, s * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#eef0f2';
  ctx.beginPath(); ctx.ellipse(0, 0, s * 1.2, s * 0.75, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d7dbe0';
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.8, s * 0.5, 0, 0, Math.PI * 2); ctx.fill();
  const r = RECIPES[recipeId];
  ctx.fillStyle = r.color;
  ctx.beginPath(); ctx.ellipse(0, -2, s * 0.55, s * 0.38, 0, 0, Math.PI * 2); ctx.fill();
  if (recipeId === 'pasta') {
    ctx.fillStyle = '#e0514a';
    for (let i = 0; i < 5; i++)
      ctx.fillRect(-s * 0.4 + i * s * 0.2, -4, 3, 3);
  } else if (recipeId === 'salad') {
    ['#6ac24a', '#8a4fd0', '#e0514a'].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc(-6 + i * 6, -2, 4, 0, Math.PI * 2); ctx.fill();
    });
  }
  ctx.restore();
}

// ---- station drawing ------------------------------------------------------
function station(ctx, st, selected, now) {
  const x = st.x, y = st.y;
  ctx.fillStyle = PAL.shadow;
  rr(ctx, x - 70, y - 44, 140, 96, 10); ctx.fill();
  ctx.fillStyle = selected ? PAL.accent : PAL.counterDark;
  rr(ctx, x - 70, y - 48, 140, 96, 10); ctx.fill();
  ctx.fillStyle = PAL.counter;
  rr(ctx, x - 62, y - 40, 124, 64, 8); ctx.fill();
  if (st.id === 'stove') {
    ctx.fillStyle = PAL.pan;
    ctx.beginPath(); ctx.arc(x, y - 6, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PAL.panLight;
    ctx.beginPath(); ctx.arc(x, y - 6, 20, 0, Math.PI * 2); ctx.fill();
    const f = (Math.sin(now * 8) + 1) * 0.5;
    ctx.fillStyle = PAL.flame;
    ctx.globalAlpha = 0.5 + f * 0.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 10, y + 20);
      ctx.quadraticCurveTo(x + i * 10 + 4, y + 6 - f * 6, x + i * 10, y - 2);
      ctx.quadraticCurveTo(x + i * 10 - 4, y + 6 - f * 6, x + i * 10, y + 20);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (st.id === 'board') {
    ctx.fillStyle = '#caa06a';
    rr(ctx, x - 34, y - 20, 68, 34, 6); ctx.fill();
    ctx.strokeStyle = '#a9855f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x + 18, y - 24); ctx.lineTo(x + 30, y - 14); ctx.stroke();
  } else if (st.id === 'assemble') {
    ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 2;
    ctx.strokeRect(x - 40, y - 24, 80, 44);
  } else if (st.id === 'serve') {
    ctx.fillStyle = PAL.good;
    rr(ctx, x - 30, y - 22, 60, 30, 6); ctx.fill();
    label(ctx, 'PASS', x, y, 14, PAL.white, 'center');
  }
  label(ctx, st.key + ' ' + st.name, x, y + 42, 15, PAL.ink, 'center');
}

// ---- order ticket ---------------------------------------------------------
function ticket(ctx, order, x, y, now) {
  const r = RECIPES[order.recipe];
  const w = 150, h = 118;
  ctx.fillStyle = PAL.shadow; rr(ctx, x + 4, y + 4, w, h, 8); ctx.fill();
  ctx.fillStyle = PAL.paper; rr(ctx, x, y, w, h, 8); ctx.fill();
  ctx.fillStyle = r.color; rr(ctx, x, y, w, 24, 8); ctx.fill();
  ctx.fillStyle = PAL.white;
  label(ctx, r.name, x + 8, y + 17, 14, PAL.white, 'left');
  // steps
  ctx.textAlign = 'left';
  r.steps.forEach((st, i) => {
    const done = i < order.stepIndex;
    ctx.fillStyle = done ? PAL.good : PAL.ink;
    label(ctx, (done ? '✓ ' : (i + 1) + '. ') + st.label, x + 8, y + 42 + i * 18, 12,
      done ? PAL.good : PAL.ink, 'left');
  });
  // timer bar
  const frac = Math.max(0, order.remaining / order.limit);
  ctx.fillStyle = PAL.paperLine; rr(ctx, x + 8, y + h - 16, w - 16, 8, 4); ctx.fill();
  ctx.fillStyle = frac > 0.4 ? PAL.good : frac > 0.2 ? PAL.accent : PAL.bad;
  rr(ctx, x + 8, y + h - 16, (w - 16) * frac, 8, 4); ctx.fill();
  if (order.state === 'done') {
    ctx.fillStyle = 'rgba(90,195,106,0.3)'; rr(ctx, x, y, w, h, 8); ctx.fill();
  } else if (order.state === 'failed') {
    ctx.fillStyle = 'rgba(224,81,74,0.3)'; rr(ctx, x, y, w, h, 8); ctx.fill();
  }
}

// ---- customer (simple flat figure) ----------------------------------------
function customer(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y - 14, 12, 0, Math.PI * 2); ctx.fill(); // head
  rr(ctx, x - 14, y, 28, 30, 8); ctx.fill(); // body
}

// ---- kitchen background ----------------------------------------------------
function kitchen(ctx, now) {
  ctx.fillStyle = PAL.wall; ctx.fillRect(0, 0, W, 300);
  ctx.fillStyle = PAL.floor; ctx.fillRect(0, 300, W, H - 300);
  // tiles
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 300); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 300; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  // window
  ctx.fillStyle = '#7fb0d6'; rr(ctx, 40, 40, 150, 90, 8); ctx.fill();
  ctx.strokeStyle = PAL.wall; ctx.lineWidth = 6; ctx.strokeRect(40, 40, 150, 90);
  ctx.beginPath(); ctx.moveTo(115, 40); ctx.lineTo(115, 130); ctx.moveTo(40, 85); ctx.lineTo(190, 85); ctx.stroke();
  // hanging sign (kept clear of the top toolbar buttons at y 20..60)
  ctx.fillStyle = PAL.accentDark; rr(ctx, W - 250, 64, 210, 54, 10); ctx.fill();
  label(ctx, "PIXEL BISTRO", W - 145, 98, 26, PAL.white, 'center');
}

// ---- HUD -------------------------------------------------------------------
function hud(ctx, s) {
  const lv = level(s);
  // HUD sits in the free band y 100..146 (window ends x 190, sign starts x 710),
  // clear of the order board (y 150..300) and the top toolbar (y 20..60).
  ctx.fillStyle = PAL.ink; rr(ctx, 210, 100, 300, 46, 10); ctx.fill();
  label(ctx, 'SCORE ' + s.score + ' / ' + lv.target, 224, 130, 20, PAL.white, 'left');
  // level
  ctx.fillStyle = PAL.accent; rr(ctx, 520, 100, 120, 46, 10); ctx.fill();
  label(ctx, 'LEVEL ' + lv.level, 580, 130, 18, PAL.ink, 'center');
  // mistakes as hearts
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < 3 - s.mistakes ? PAL.bad : 'rgba(255,255,255,0.25)';
    const hx = W - 40 - i * 34, hy = 122;
    ctx.beginPath();
    ctx.moveTo(hx, hy + 6);
    ctx.bezierCurveTo(hx, hy, hx - 12, hy, hx - 12, hy + 7);
    ctx.bezierCurveTo(hx - 12, hy + 14, hx, hy + 18, hx, hy + 22);
    ctx.bezierCurveTo(hx, hy + 18, hx + 12, hy + 14, hx + 12, hy + 7);
    ctx.bezierCurveTo(hx + 12, hy, hx, hy, hx, hy + 6);
    ctx.fill();
  }
}

function buttons(ctx, s) {
  const defs = topButtons(s);
  defs.forEach((b) => {
    ctx.fillStyle = b.on ? PAL.good : PAL.counterDark;
    rr(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
    label(ctx, b.text, b.x + b.w / 2, b.y + b.h / 2 + 5, 14, PAL.white, 'center');
  });
}

// Button hit-boxes (shared by input.js via getButtons).
export function topButtons(s) {
  const y = 20, h = 40;
  return [
    { id: 'pause', x: W - 360, y, w: 90, h, text: s.screen === 'paused' ? 'Resume' : 'Pause' },
    { id: 'restart', x: W - 262, y, w: 90, h, text: 'Restart' },
    { id: 'mute', x: W - 164, y, w: 70, h, text: s.muted ? 'Unmute' : 'Mute', on: !s.muted },
    { id: 'help', x: W - 86, y, w: 66, h, text: 'Help' },
  ];
}

export function menuButtons() {
  return [
    { id: 'play', x: W / 2 - 110, y: 330, w: 220, h: 60, text: 'Play' },
    { id: 'how', x: W / 2 - 110, y: 410, w: 220, h: 52, text: 'How to play' },
    { id: 'recipes', x: W / 2 - 110, y: 478, w: 220, h: 52, text: 'Recipe book' },
  ];
}

// ---------------------------------------------------------------------------
export function draw(ctx, s) {
  ctx.clearRect(0, 0, W, H);
  if (s.screen === 'menu') return drawMenu(ctx, s);
  if (s.screen === 'recipes') return drawRecipes(ctx, s);
  kitchen(ctx, s.now);
  // order board
  ctx.fillStyle = '#6b4f33'; rr(ctx, 210, 150, W - 470, 150, 10); ctx.fill();
  label(ctx, 'ORDERS', 660, 140, 16, PAL.white, 'left');
  const active = s.orders.filter((o) => o.state !== 'active' ? true : true);
  active.slice(0, 4).forEach((o, i) => ticket(ctx, o, 224 + i * 164, 158, s.now));
  // customers waiting
  s.orders.filter((o) => o.state === 'active').slice(0, 4).forEach((o, i) => {
    customer(ctx, 250 + i * 110, 350, RECIPES[o.recipe].color);
  });
  // stations
  STATIONS.forEach((st) => station(ctx, st, st.id === s.selectedStation, s.now));
  // dish in progress on the assemble table
  if (s.current) {
    const r = RECIPES[s.current.recipe];
    const step = r.steps[s.current.stepIndex];
    label(ctx, 'Making: ' + r.name + ' — next: ' + (step ? step.label : 'serve'),
      570, 360, 14, PAL.white, 'center');
    // show chopped/cooked ingredients gathered so far
    for (let i = 0; i < s.current.stepIndex; i++) {
      const ing = r.steps[i].ingredient;
      if (ing) foodIcon(ctx, ing, 540 + i * 34, 408, 12);
    }
  }
  // a plated dish ready to serve (serve animation)
  if (s.serveAnim > 0) {
    const t = 1 - s.serveAnim / 0.6;
    plate(ctx, s.current ? s.current.recipe : 'pasta', 780 - t * 0, 400 - t * 30, 22);
  } else {
    plate(ctx, 'pasta', 780, 400, 18);
  }
  hud(ctx, s);
  buttons(ctx, s);
  topButtons; // referenced for input
  // selected-station hint
  label(ctx, 'Keys 1-4 pick station · click station to act · Space serves · P pause',
    W / 2, H - 14, 14, PAL.white, 'center');
  // mistake flash
  if (s.flash > 0) {
    ctx.fillStyle = 'rgba(224,81,74,' + (s.flash) + ')';
    ctx.fillRect(0, 0, W, H);
  }
  if (!s.tutorialSeen) drawTutorial(ctx);
  if (s.screen === 'paused') overlay(ctx, 'Paused', 'Press P or Resume to continue');
  if (s.screen === 'win') overlay(ctx, 'Service complete!', 'You hit the daily target. Press Restart.');
  if (s.screen === 'fail') overlay(ctx, 'Kitchen closed', (s.lastEvent && s.lastEvent.text) + '. Press Restart.');
}

function drawMenu(ctx, s) {
  kitchen(ctx, s.now);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
  label(ctx, 'LINE COOK RUSH', W / 2, 150, 64, PAL.accent, 'center');
  label(ctx, 'A one-screen kitchen rush game', W / 2, 200, 22, PAL.white, 'center');
  // little kitchen preview
  STATIONS.forEach((st) => station(ctx, { ...st, y: st.y + 30 }, false, s.now));
  plate(ctx, 'salad', W / 2, 300, 22);
  menuButtons().forEach((b) => {
    ctx.fillStyle = b.id === 'play' ? PAL.accent : PAL.counterDark;
    rr(ctx, b.x, b.y, b.w, b.h, 10); ctx.fill();
    label(ctx, b.text, b.x + b.w / 2, b.y + b.h / 2 + 7, 22,
      b.id === 'play' ? PAL.ink : PAL.white, 'center');
  });
  label(ctx, 'Serve dishes before the timer runs out. 3 mistakes and you are done.',
    W / 2, 560, 16, PAL.white, 'center');
}

function drawRecipes(ctx, s) {
  ctx.fillStyle = PAL.bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAL.paper; rr(ctx, 60, 60, W - 120, H - 120, 16); ctx.fill();
  label(ctx, 'RECIPE BOOK', W / 2, 120, 40, PAL.ink, 'center');
  RECIPE_LIST.forEach((r, i) => {
    const x = 110, y = 170 + i * 128;
    ctx.fillStyle = r.color; rr(ctx, x, y, 44, 44, 8); ctx.fill();
    plate(ctx, r.id, x + 22, y + 22, 16);
    label(ctx, r.name, x + 70, y + 20, 26, PAL.ink, 'left');
    label(ctx, 'Timer ~' + r.time + 's · ' + r.reward + ' pts', x + 70, y + 44, 15, PAL.accentDark, 'left');
    r.steps.forEach((st, j) => {
      label(ctx, (j + 1) + '. ' + st.label, x + 360 + j * 170, y + 30, 16, PAL.ink, 'left');
    });
  });
  label(ctx, 'Click anywhere or press Esc to go back', W / 2, H - 90, 16, PAL.ink, 'center');
}

function drawTutorial(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.72)'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = PAL.paper; rr(ctx, W / 2 - 300, 150, 600, 300, 16); ctx.fill();
  label(ctx, 'How to play', W / 2, 200, 30, PAL.ink, 'center');
  const lines = [
    'Customers leave order tickets on the board, each with a timer.',
    'Do the steps in order: pick a station (keys 1-4 or click) and act.',
    'Finish all steps to plate the dish; it is served automatically.',
    'Wrong station, no matching order, or a timeout = 1 mistake.',
    'Reach the score target before closing. 3 mistakes = game over.',
    '',
    'Click or press Space to start cooking!',
  ];
  lines.forEach((t, i) => label(ctx, t, W / 2, 240 + i * 28, 16, PAL.ink, 'center'));
}

function overlay(ctx, title, sub) {
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
  label(ctx, title, W / 2, H / 2 - 10, 48, PAL.accent, 'center');
  label(ctx, sub, W / 2, H / 2 + 40, 20, PAL.white, 'center');
}
