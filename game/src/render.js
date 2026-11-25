// Line Cook Rush — all drawing lives here. The canvas is 1280x720 and every
// picture (stations, dishes, tickets, overlays) is drawn with plain canvas
// paths: no images, no web fonts, nothing fetched.

import {
  LEVELS,
  MAX_STRIKES,
  PALETTE,
  RECIPES,
  STATIONS,
  VIEW_H,
  VIEW_W,
  WORK_SECONDS,
  mulberry32,
  recipeById,
  stationById,
} from './data.js';

const BOARD = { x: 16, y: 72, w: 1248, h: 120 };
const STATION_Y = 208;
const STATION_H = 288;
const STATION_W = 300;
const STATION_GAP = 16;
const BENCH = { x: 16, y: 512, w: 1248, h: 132 };

const FONT = '"Trebuchet MS", Verdana, sans-serif';

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function text(ctx, str, x, y, { size = 16, color = PALETTE.ink, bold = false, align = 'left' } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function mmss(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ---------------------------------------------------------------- ingredients

function drawIngredient(ctx, kind, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'tomato') {
    ctx.fillStyle = '#d9382b';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5d8a3c';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.4);
    ctx.lineTo(-r * 0.45, -r * 0.95);
    ctx.lineTo(0, -r * 0.65);
    ctx.lineTo(r * 0.45, -r * 0.95);
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'egg') {
    ctx.fillStyle = '#fff6e0';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.15, r * 0.85, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2a81d';
    ctx.beginPath();
    ctx.arc(r * 0.15, 0, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'apple') {
    ctx.fillStyle = '#c92f2f';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a4a21';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.lineTo(r * 0.2, -r * 1.3);
    ctx.stroke();
    ctx.fillStyle = '#5d8a3c';
    ctx.beginPath();
    ctx.ellipse(r * 0.45, -r * 0.9, r * 0.45, r * 0.22, -0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'berry') {
    ctx.fillStyle = '#7a4dbb';
    for (const [dx, dy, dr] of [[-0.45, 0.2, 0.55], [0.4, 0.25, 0.6], [0, -0.45, 0.6]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, dr * r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#a87fe0';
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.6, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'bread') {
    ctx.fillStyle = '#e0aa5e';
    rr(ctx, -r, -r * 0.7, r * 2, r * 1.4, r * 0.3);
    ctx.fill();
    ctx.fillStyle = '#c98d3f';
    rr(ctx, -r * 0.8, -r * 0.5, r * 1.6, r, r * 0.2);
    ctx.fill();
  } else if (kind === 'pasta') {
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r + i * 2, i * r * 0.45);
      ctx.bezierCurveTo(-r * 0.4, i * r * 0.45 - r * 0.4, r * 0.4, i * r * 0.45 + r * 0.4, r, i * r * 0.45);
      ctx.stroke();
    }
  } else if (kind === 'leaf') {
    ctx.fillStyle = '#5d8a3c';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.5, -0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// A plate with a dish that appears step by step: `done` of its 3 steps are on
// the plate, so the player can see a dish mid-assembly.
function drawDish(ctx, id, cx, cy, r, done = 3) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cfc4ae';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f3ead6';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.72, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  if (id === 'pasta') {
    if (done >= 1) {
      ctx.fillStyle = '#d9382b';
      for (const [dx, dy] of [[-0.35, -0.05], [0.3, 0.08], [0.05, -0.12]]) {
        ctx.beginPath();
        ctx.arc(dx * r, dy * r, r * 0.16, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (done >= 2) {
      ctx.strokeStyle = '#f2c94c';
      ctx.lineWidth = 3;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, i * r * 0.12);
        ctx.bezierCurveTo(-r * 0.2, i * r * 0.12 - r * 0.16, r * 0.2, i * r * 0.12 + r * 0.16, r * 0.6, i * r * 0.12);
        ctx.stroke();
      }
    }
    if (done >= 3) {
      ctx.fillStyle = '#5d8a3c';
      for (const [dx, dy] of [[-0.5, 0.1], [0.45, -0.08], [0.1, 0.14]]) {
        ctx.beginPath();
        ctx.arc(dx * r, dy * r, r * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (id === 'sandwich') {
    if (done >= 2) {
      ctx.fillStyle = '#e0aa5e';
      rr(ctx, -r * 0.62, -r * 0.1, r * 1.24, r * 0.24, r * 0.08);
      ctx.fill();
    }
    if (done >= 1) {
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.08, r * 0.5, r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f2a81d';
      ctx.beginPath();
      ctx.arc(r * 0.08, -r * 0.08, r * 0.11, 0, Math.PI * 2);
      ctx.fill();
    }
    if (done >= 3) {
      ctx.fillStyle = '#e8b96f';
      rr(ctx, -r * 0.58, -r * 0.3, r * 1.16, r * 0.2, r * 0.08);
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      for (const dx of [-0.35, 0, 0.35]) {
        ctx.beginPath();
        ctx.arc(dx * r, -r * 0.2, r * 0.04, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (id === 'salad') {
    if (done >= 1) {
      ctx.fillStyle = '#e8e8e8';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, 0, r * 0.3, r * 0.14, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#c92f2f';
      ctx.beginPath();
      ctx.ellipse(r * 0.25, -r * 0.02, r * 0.28, r * 0.13, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (done >= 2) {
      ctx.fillStyle = '#7a4dbb';
      for (const [dx, dy] of [[-0.45, 0.08], [0.1, 0.12], [0.5, -0.05]]) {
        ctx.beginPath();
        ctx.arc(dx * r, dy * r, r * 0.11, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (done >= 3) {
      drawIngredient(ctx, 'leaf', -r * 0.55, -r * 0.12, r * 0.2);
      drawIngredient(ctx, 'leaf', r * 0.55, r * 0.1, r * 0.18);
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ top bar

function drawTopBar(ctx, run) {
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(0, 0, VIEW_W, 60);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = `bold 26px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('LINE COOK RUSH', 20, 40);
  const lv = LEVELS[run.level];
  text(ctx, `SCORE  ${run.score}`, 560, 39, { size: 20, color: '#ffffff', bold: true });
  text(ctx, `LEVEL ${run.level + 1}/3 · ${lv.name} · target ${lv.target}`, 680, 39, { size: 15, color: '#e8d5b0' });
  const urgent = run.dayLeft <= 15 && run.screen === 'playing';
  text(ctx, `CLOSING ${mmss(run.dayLeft)}`, 1020, 39, { size: 18, color: urgent ? '#ff7a66' : '#ffffff', bold: true });
  text(ctx, 'STRIKES', 1170, 26, { size: 11, color: '#cbb694', align: 'left' });
  for (let i = 0; i < MAX_STRIKES; i++) {
    const cx = 1182 + i * 26;
    ctx.beginPath();
    ctx.arc(cx, 44, 8, 0, Math.PI * 2);
    if (i < run.strikes) {
      ctx.fillStyle = '#c94f3d';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - 4, 40);
      ctx.lineTo(cx + 4, 48);
      ctx.moveTo(cx + 4, 40);
      ctx.lineTo(cx - 4, 48);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#8a7a5e';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

// ---------------------------------------------------------------- order board

function drawBoard(ctx, run, ui) {
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'ORDER BOARD', BOARD.x + 14, BOARD.y + 22, { size: 13, color: PALETTE.softInk, bold: true });
  ui.tickets = [];
  if (run.orders.length === 0) {
    text(ctx, 'No orders yet — tickets walk in here. Get ready.', BOARD.x + 220, BOARD.y + 78, { size: 18, color: PALETTE.softInk });
    return;
  }
  // Tickets share the board evenly, however many are up (max 4): the width
  // is computed from the count, so the fourth ticket never overflows the edge.
  const n = run.orders.length;
  const gap = 12;
  const innerX = BOARD.x + 14;
  const innerW = BOARD.w - 28;
  const w = (innerW - gap * (n + 1)) / n;
  const h = 84;
  const y = BOARD.y + 28;
  run.orders.forEach((order, i) => {
    const recipe = recipeById(order.recipeId);
    const x = innerX + gap + i * (w + gap);
    const selected = i === run.selected;
    ui.tickets.push({ index: i, x, y, w, h });
    ctx.fillStyle = '#ffffff';
    rr(ctx, x, selected ? y - 3 : y, w, h, 8);
    ctx.fill();
    ctx.lineWidth = selected ? 3 : 1.5;
    ctx.strokeStyle = selected ? PALETTE.gold : PALETTE.line;
    ctx.stroke();
    ctx.fillStyle = recipe.id === 'pasta' ? '#c94f3d' : recipe.id === 'sandwich' ? '#d96a3b' : '#5d8a3c';
    rr(ctx, x, selected ? y - 3 : y, w, 26, 8);
    ctx.fill();
    ctx.fillRect(x, selected ? y + 15 : y + 15, w, 11);
    text(ctx, `${recipe.name}  ·  ${order.customer}`, x + 10, (selected ? y - 3 : y) + 18, { size: 14, color: '#ffffff', bold: true });
    text(ctx, `${recipe.points} pts`, x + w - 10, (selected ? y - 3 : y) + 18, { size: 12, color: '#ffe9c9', align: 'right' });
    // Step dots: filled for the dish already on the plate, when this is it.
    const done = run.bench && run.bench.recipeId === order.recipeId && selected ? run.bench.done : 0;
    for (let s = 0; s < 3; s++) {
      ctx.beginPath();
      ctx.arc(x + 16 + s * 22, y + 42, 6, 0, Math.PI * 2);
      ctx.fillStyle = s < done ? '#5d8a3c' : '#ddd2ba';
      ctx.fill();
      ctx.strokeStyle = '#b8a888';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    text(ctx, recipe.steps.map((s) => s.label).join('  →  '), x + 86, y + 47, { size: 12, color: PALETTE.softInk });
    // Timer bar.
    const frac = Math.max(0, order.timeLeft / order.timeTotal);
    ctx.fillStyle = '#e8ddc4';
    rr(ctx, x + 10, y + 62, w - 20, 9, 4);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#5d8a3c' : frac > 0.25 ? '#e0a52e' : '#c94f3d';
    if (frac > 0) {
      rr(ctx, x + 10, y + 62, (w - 20) * frac, 9, 4);
      ctx.fill();
    }
    text(ctx, `${Math.ceil(order.timeLeft)}s`, x + w - 10, y + 62, { size: 12, color: frac > 0.25 ? PALETTE.softInk : '#c94f3d', bold: true, align: 'right' });
  });
}

// ------------------------------------------------------------------ stations

function stationRect(i) {
  return {
    x: 16 + i * (STATION_W + STATION_GAP),
    y: STATION_Y,
    w: STATION_W,
    h: STATION_H,
  };
}

function drawStationArt(ctx, stationId, box, run, t) {
  const cx = box.x + box.w / 2;
  const top = box.y + 56;
  const w = box.w - 32;
  const h = 150;
  if (stationId === 'board') {
    ctx.fillStyle = '#c89a67';
    rr(ctx, box.x + 16, top + 40, w, 74, 8);
    ctx.fill();
    ctx.strokeStyle = '#a87c4a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredient(ctx, 'tomato', cx - 52, top + 78, 20);
    drawIngredient(ctx, 'apple', cx + 8, top + 82, 18);
    drawIngredient(ctx, 'berry', cx + 62, top + 76, 18);
    ctx.save();
    ctx.translate(cx + 78, top + 18);
    ctx.rotate(0.5);
    ctx.fillStyle = '#d8d8d8';
    ctx.fillRect(-4, -34, 8, 52);
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(-5, 18, 10, 26);
    ctx.restore();
  } else if (stationId === 'stove') {
    ctx.fillStyle = '#4a4a52';
    rr(ctx, box.x + 16, top + 30, w, 84, 8);
    ctx.fill();
    ctx.fillStyle = '#2e2e34';
    for (const bx of [cx - 62, cx + 62]) {
      ctx.beginPath();
      ctx.arc(bx, top + 72, 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#666670';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    const flick = Math.sin(t * 9) * 4;
    ctx.fillStyle = '#e8712a';
    ctx.beginPath();
    ctx.moveTo(cx - 26, top + 40);
    ctx.quadraticCurveTo(cx - 30, top + 8 + flick, cx, top + 16 + flick);
    ctx.quadraticCurveTo(cx + 30, top + 8 + flick, cx + 26, top + 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a3a42';
    rr(ctx, cx - 52, top - 6, 104, 44, 6);
    ctx.fill();
    ctx.fillStyle = '#565660';
    rr(ctx, cx - 52, top - 6, 104, 10, 5);
    ctx.fill();
    ctx.strokeStyle = '#cfd4da';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + 30, top - 2);
    ctx.quadraticCurveTo(cx + 52, top - 18, cx + 44, top - 34 + Math.sin(t * 3) * 3);
    ctx.stroke();
  } else if (stationId === 'table') {
    ctx.fillStyle = '#8a6a45';
    rr(ctx, box.x + 16, top + 96, w, 18, 6);
    ctx.fill();
    drawDish(ctx, run.bench ? run.bench.recipeId : 'pasta', cx, top + 74, 74, run.bench ? run.bench.done : 3);
    ctx.strokeStyle = '#9a9a9a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(box.x + 26, top + 30);
    ctx.lineTo(box.x + 26, top + 100);
    ctx.moveTo(box.x + 22, top + 30);
    ctx.lineTo(box.x + 30, top + 30);
    ctx.stroke();
    drawIngredient(ctx, 'leaf', cx + 88, top + 60, 12);
    drawIngredient(ctx, 'tomato', cx - 96, top + 64, 12);
  } else if (stationId === 'window') {
    ctx.fillStyle = '#7a5a3a';
    rr(ctx, box.x + 16, top + 96, w, 18, 6);
    ctx.fill();
    if (run.tray) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 4);
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.25 * pulse;
      ctx.fillStyle = PALETTE.gold;
      ctx.beginPath();
      ctx.ellipse(cx, top + 62, 96, 44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      drawDish(ctx, run.tray.recipeId, cx, top + 62, 66, 3);
      ctx.fillStyle = '#c94f3d';
      rr(ctx, cx - 52, top + 8, 104, 22, 6);
      ctx.fill();
      text(ctx, 'READY TO SERVE', cx, top + 24, { size: 12, color: '#ffffff', bold: true, align: 'center' });
    } else {
      ctx.fillStyle = '#e0a52e';
      ctx.beginPath();
      ctx.arc(cx, top + 62, 26, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(cx - 30, top + 62, 60, 8);
      ctx.fillStyle = '#8a6a1a';
      ctx.beginPath();
      ctx.arc(cx, top + 30, 5, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'window is clear', cx, top + 104, { size: 13, color: PALETTE.softInk, align: 'center' });
    }
  }
}

function drawStations(ctx, run, ui) {
  ui.stations = [];
  STATIONS.forEach((station, i) => {
    const box = stationRect(i);
    ui.stations.push({ id: station.id, ...box });
    ctx.fillStyle = PALETTE.panel;
    rr(ctx, box.x, box.y, box.w, box.h, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = station.color;
    rr(ctx, box.x, box.y, box.w, 44, 10);
    ctx.fill();
    ctx.fillRect(box.x, box.y + 34, box.w, 10);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(box.x + 26, box.y + 22, 13, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, station.key, box.x + 26, box.y + 27, { size: 15, color: station.color, bold: true, align: 'center' });
    text(ctx, station.name, box.x + 46, box.y + 28, { size: 17, color: '#ffffff', bold: true });
    drawStationArt(ctx, station.id, box, run, ui.t);
    text(ctx, `${station.verb} — ${station.hint}`, box.x + 16, box.y + box.h - 34, { size: 13, color: PALETTE.softInk });
    if (run.work && run.work.station === station.id) {
      const frac = 1 - run.work.t / WORK_SECONDS;
      ctx.fillStyle = '#e8ddc4';
      rr(ctx, box.x + 16, box.y + box.h - 22, box.w - 32, 8, 4);
      ctx.fill();
      ctx.fillStyle = station.color;
      rr(ctx, box.x + 16, box.y + box.h - 22, (box.w - 32) * frac, 8, 4);
      ctx.fill();
    }
  });
}

// -------------------------------------------------------------------- bench

function drawBench(ctx, run) {
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, BENCH.x, BENCH.y, BENCH.w, BENCH.h, 10);
  ctx.fill();
  ctx.strokeStyle = PALETTE.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, 'YOUR PLATE', BENCH.x + 16, BENCH.y + 26, { size: 13, color: PALETTE.softInk, bold: true });
  if (run.bench) {
    const recipe = recipeById(run.bench.recipeId);
    drawDish(ctx, recipe.id, BENCH.x + 96, BENCH.y + 82, 56, run.bench.done);
    text(ctx, recipe.name, BENCH.x + 176, BENCH.y + 40, { size: 19, color: PALETTE.ink, bold: true });
    recipe.steps.forEach((step, i) => {
      const y = BENCH.y + 66 + i * 22;
      const mark = i < run.bench.done ? '✓' : i === run.bench.done ? '→' : '·';
      const color = i < run.bench.done ? '#5d8a3c' : i === run.bench.done ? '#b07a1e' : '#a08e6e';
      text(ctx, mark, BENCH.x + 176, y, { size: 15, color, bold: true });
      const station = stationById(step.station);
      text(ctx, `${step.label}  (${station.name} · key ${station.key})`, BENCH.x + 198, y, {
        size: 14,
        color: i === run.bench.done ? PALETTE.ink : PALETTE.softInk,
        bold: i === run.bench.done,
      });
    });
  } else {
    drawDish(ctx, 'pasta', BENCH.x + 96, BENCH.y + 82, 56, 0);
    text(ctx, 'No dish on the plate yet.', BENCH.x + 176, BENCH.y + 40, { size: 19, color: PALETTE.ink, bold: true });
    text(ctx, 'Pick an order (Tab, or click a ticket), then work the stations in order.', BENCH.x + 176, BENCH.y + 68, { size: 14, color: PALETTE.softInk });
    text(ctx, 'Each recipe has 3 steps — the plate fills up as you finish them.', BENCH.x + 176, BENCH.y + 92, { size: 14, color: PALETTE.softInk });
  }
  // Right column: what to do next, and the latest message.
  const rx = BENCH.x + 660;
  text(ctx, 'NEXT UP', rx, BENCH.y + 26, { size: 13, color: PALETTE.softInk, bold: true });
  let next = '';
  if (run.bench) {
    const recipe = recipeById(run.bench.recipeId);
    const step = recipe.steps[run.bench.done];
    if (step) {
      const station = stationById(step.station);
      next = `${step.label} — press ${station.key} (${station.name})`;
    }
  } else if (run.tray) {
    next = `${recipeById(run.tray.recipeId).name} is on the window — press 4 / Space to serve.`;
  } else {
    next = 'Wait for a ticket, then start cooking.';
  }
  text(ctx, next, rx, BENCH.y + 52, { size: 16, color: PALETTE.ink, bold: true });
  if (run.msg && run.msgT > 0) {
    text(ctx, run.msg, rx, BENCH.y + 82, { size: 14, color: '#8a5a1a' });
  }
  if (run.tray) {
    text(ctx, `On the window: ${recipeById(run.tray.recipeId).name} — serve it before its ticket times out.`, rx, BENCH.y + 108, { size: 14, color: '#74489a', bold: true });
  }
  // Score popups float up from the serving window.
  for (const p of run.popups) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.t));
    text(ctx, p.text, p.x, p.y, { size: 26, color: '#5d8a3c', bold: true, align: 'center' });
    ctx.globalAlpha = 1;
  }
}

function drawBottomBar(ctx) {
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(0, 656, VIEW_W, 64);
  text(ctx, '1 Board   ·   2 Stove   ·   3 Plate   ·   4 / Space Serve   ·   Tab next order   ·   P pause   ·   M sound   ·   H help', VIEW_W / 2, 681, { size: 15, color: '#e8d5b0', align: 'center' });
  text(ctx, 'Three strikes and the service is over — serve fast, serve the right dish.', VIEW_W / 2, 706, { size: 13, color: '#a08e6e', align: 'center' });
}

// ------------------------------------------------------------------ buttons

function drawButton(ctx, ui, id, x, y, w, h, label, primary = false) {
  const hover = ui.hover.x >= x && ui.hover.x <= x + w && ui.hover.y >= y && ui.hover.y <= y + h;
  ctx.fillStyle = primary ? PALETTE.gold : '#ffffff';
  rr(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = primary ? '#b07a1e' : PALETTE.line;
  ctx.lineWidth = 2;
  ctx.stroke();
  if (hover) {
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    rr(ctx, x, y, w, h, 8);
    ctx.fill();
  }
  text(ctx, label, x + w / 2, y + h / 2 + 6, { size: 17, color: primary ? '#2e2118' : PALETTE.ink, bold: true, align: 'center' });
  ui.buttons.push({ id, x, y, w, h });
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(30, 20, 10, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.panel;
  rr(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.line;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Menu decorations: a fixed set of floating ingredients, placed once.
const decoRng = mulberry32(20261125);
const DECO = Array.from({ length: 12 }, () => ({
  kind: ['tomato', 'egg', 'apple', 'berry', 'bread', 'pasta'][Math.floor(decoRng() * 6)],
  x: 60 + decoRng() * 1160,
  y: 110 + decoRng() * 500,
  r: 12 + decoRng() * 14,
  phase: decoRng() * 6.28,
}));

// ------------------------------------------------------------------ screens

function drawMenu(ctx, run, ui) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  for (const d of DECO) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    drawIngredient(ctx, d.kind, d.x, d.y + Math.sin(ui.t * 0.7 + d.phase) * 8, d.r);
    ctx.restore();
  }
  drawDish(ctx, 'pasta', 150, 150, 90, 3);
  drawDish(ctx, 'sandwich', 1130, 150, 90, 3);
  drawDish(ctx, 'salad', 1130, 580, 80, 3);
  text(ctx, 'LINE COOK RUSH', VIEW_W / 2, 150, { size: 64, color: '#2e2118', bold: true, align: 'center' });
  text(ctx, 'One kitchen. Four stations. Three recipes. Don\'t keep the customers waiting.', VIEW_W / 2, 192, { size: 19, color: PALETTE.softInk, align: 'center' });
  const lines = [
    '1 · Tickets arrive on the board — each has its own timer.',
    '2 · Work the stations in the recipe\'s order: chop, cook, plate.',
    '3 · Serve the finished dish at the window before its ticket runs out.',
  ];
  lines.forEach((line, i) => text(ctx, line, VIEW_W / 2, 268 + i * 34, { size: 18, color: PALETTE.ink, align: 'center' }));
  text(ctx, 'Wrong station, wrong dish, or a timed-out ticket: one strike. Three strikes ends the day.', VIEW_W / 2, 392, { size: 16, color: '#c94f3d', align: 'center' });
  drawButton(ctx, ui, 'start', VIEW_W / 2 - 220, 440, 200, 56, 'START SHIFT', true);
  drawButton(ctx, ui, 'recipes', VIEW_W / 2 + 20, 440, 200, 56, 'RECIPES');
  text(ctx, 'Levels: Opening Shift (300 pts)  ·  Lunch Rush (650)  ·  Dinner Blitz (1100)', VIEW_W / 2, 540, { size: 16, color: PALETTE.softInk, align: 'center' });
  if (run.best > 0) text(ctx, `Best score this session: ${run.best}`, VIEW_W / 2, 574, { size: 15, color: PALETTE.softInk, align: 'center' });
  text(ctx, 'Enter to start  ·  R for recipes  ·  H anytime for help', VIEW_W / 2, 620, { size: 14, color: '#a08e6e', align: 'center' });
}

function drawRecipes(ctx, run, ui) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'RECIPES', VIEW_W / 2, 92, { size: 44, color: '#2e2118', bold: true, align: 'center' });
  text(ctx, 'Every dish takes 3 steps, in order. Serve fast for a speed bonus of up to +50.', VIEW_W / 2, 128, { size: 17, color: PALETTE.softInk, align: 'center' });
  RECIPES.forEach((recipe, i) => {
    const x = 40 + i * 413;
    const y = 160;
    const w = 393;
    const h = 400;
    ctx.fillStyle = PALETTE.panel;
    rr(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = PALETTE.line;
    ctx.lineWidth = 2;
    ctx.stroke();
    drawDish(ctx, recipe.id, x + w / 2, y + 92, 84, 3);
    text(ctx, recipe.name, x + w / 2, y + 190, { size: 22, color: PALETTE.ink, bold: true, align: 'center' });
    text(ctx, `${recipe.points} pts  ·  ${recipe.seconds}s per ticket`, x + w / 2, y + 218, { size: 15, color: PALETTE.softInk, align: 'center' });
    text(ctx, recipe.blurb, x + w / 2, y + 246, { size: 14, color: PALETTE.softInk, align: 'center' });
    recipe.steps.forEach((step, s) => {
      const station = stationById(step.station);
      const sy = y + 286 + s * 34;
      ctx.fillStyle = station.color;
      ctx.beginPath();
      ctx.arc(x + 34, sy - 5, 9, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, `${s + 1}. ${step.label}`, x + 52, sy, { size: 16, color: PALETTE.ink });
      text(ctx, `${station.name} (key ${station.key})`, x + w - 20, sy, { size: 13, color: PALETTE.softInk, align: 'right' });
    });
  });
  drawButton(ctx, ui, 'back', VIEW_W / 2 - 100, 600, 200, 52, 'BACK TO MENU', true);
}

function drawHelp(ctx, run) {
  dim(ctx);
  panel(ctx, 290, 130, 700, 460);
  text(ctx, 'HOW TO PLAY', 640, 180, { size: 28, color: PALETTE.ink, bold: true, align: 'center' });
  const rows = [
    ['Tab / click', 'Choose which ticket to cook for'],
    ['1 · 2 · 3', 'Work the Chopping Board, Stove, Plating Table'],
    ['4 / Space', 'Serve the plated dish at the window'],
    ['P', 'Pause the shift'],
    ['M', 'Mute / unmute the kitchen sounds'],
    ['H', 'Close this help'],
  ];
  rows.forEach(([key, what], i) => {
    const y = 226 + i * 40;
    text(ctx, key, 340, y, { size: 17, color: '#74489a', bold: true });
    text(ctx, what, 520, y, { size: 17, color: PALETTE.ink });
  });
  text(ctx, 'Recipes', 640, 500, { size: 18, color: PALETTE.ink, bold: true, align: 'center' });
  RECIPES.forEach((recipe, i) => {
    text(ctx, `${recipe.name}: ${recipe.steps.map((s) => s.label).join(' → ')}`, 640, 528 + i * 26, { size: 15, color: PALETTE.softInk, align: 'center' });
  });
}

function drawPause(ctx) {
  dim(ctx);
  panel(ctx, 440, 260, 400, 180);
  text(ctx, 'PAUSED', 640, 322, { size: 34, color: PALETTE.ink, bold: true, align: 'center' });
  text(ctx, 'Press P to get back to the pass.', 640, 362, { size: 16, color: PALETTE.softInk, align: 'center' });
  text(ctx, 'The tickets wait for no one — except now.', 640, 392, { size: 14, color: '#a08e6e', align: 'center' });
}

function drawLevelDone(ctx, run, ui) {
  dim(ctx);
  panel(ctx, 390, 220, 500, 260);
  const lv = LEVELS[run.level];
  text(ctx, `${lv.name.toUpperCase()} — CLEAR!`, 640, 286, { size: 30, color: '#5d8a3c', bold: true, align: 'center' });
  text(ctx, `Score ${run.score}  ·  target was ${lv.target}`, 640, 330, { size: 18, color: PALETTE.ink, align: 'center' });
  const next = LEVELS[run.level + 1];
  text(ctx, `Next up: ${next.name} — target ${next.target}, tickets get faster.`, 640, 366, { size: 16, color: PALETTE.softInk, align: 'center' });
  drawButton(ctx, ui, 'next', 640 - 110, 400, 220, 52, 'NEXT LEVEL', true);
}

function drawDayOver(ctx, run, ui) {
  dim(ctx);
  panel(ctx, 360, 200, 560, 300);
  const lv = LEVELS[run.level];
  text(ctx, 'SERVICE OVER', 640, 262, { size: 32, color: '#c94f3d', bold: true, align: 'center' });
  const reason = run.overReason === 'strikes'
    ? 'Three strikes — too many wrong stations, wrong dishes, or timed-out tickets.'
    : `Closing time — ${run.score} pts against a target of ${lv.target}.`;
  text(ctx, reason, 640, 306, { size: 16, color: PALETTE.ink, align: 'center' });
  text(ctx, `Score ${run.score}  ·  dishes served ${run.served}  ·  best ${run.best}`, 640, 340, { size: 16, color: PALETTE.softInk, align: 'center' });
  drawButton(ctx, ui, 'retry', 640 - 220, 400, 200, 52, 'TRY AGAIN', true);
  drawButton(ctx, ui, 'menu', 640 + 20, 400, 200, 52, 'MENU');
}

function drawWin(ctx, run, ui) {
  dim(ctx);
  panel(ctx, 360, 200, 560, 300);
  text(ctx, 'ALL THREE SHIFTS CLEAR!', 640, 262, { size: 30, color: '#5d8a3c', bold: true, align: 'center' });
  text(ctx, `Final score ${run.score} — the kitchen survived Dinner Blitz.`, 640, 306, { size: 17, color: PALETTE.ink, align: 'center' });
  text(ctx, `Dishes served: ${run.served}`, 640, 340, { size: 16, color: PALETTE.softInk, align: 'center' });
  drawButton(ctx, ui, 'again', 640 - 220, 400, 200, 52, 'PLAY AGAIN', true);
  drawButton(ctx, ui, 'menu', 640 + 20, 400, 200, 52, 'MENU');
}

// --------------------------------------------------------------------- main

export function draw(ctx, run, ui) {
  ui.buttons = [];
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  if (run.screen === 'menu') {
    drawMenu(ctx, run, ui);
    return;
  }
  if (run.screen === 'recipes') {
    drawRecipes(ctx, run, ui);
    return;
  }
  drawTopBar(ctx, run);
  drawBoard(ctx, run, ui);
  drawStations(ctx, run, ui);
  drawBench(ctx, run);
  drawBottomBar(ctx);
  if (run.screen === 'paused') drawPause(ctx);
  else if (run.screen === 'leveldone') drawLevelDone(ctx, run, ui);
  else if (run.screen === 'dayover') drawDayOver(ctx, run, ui);
  else if (run.screen === 'win') drawWin(ctx, run, ui);
  else if (run.help) drawHelp(ctx, run);
}
