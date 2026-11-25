// Line Cook Rush v3 — draw: every pixel the player sees, on one 1280x720 canvas.
// Flat colours, dark outlines, warm kitchen. No images, no fonts loaded: the
// game draws its own food, people and gauges with canvas paths.

import { VIEW_W, VIEW_H, PALETTE, STATIONS, LEVELS, HEAT, dishById, formatClock } from './data.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function text(ctx, str, x, y, size, color, bold = false, align = 'left') {
  ctx.fillStyle = color;
  ctx.font = (bold ? 'bold ' : '') + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function outlineText(ctx, str, x, y, size, color, bold = true, align = 'left') {
  ctx.font = (bold ? 'bold ' : '') + size + 'px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = 4;
  ctx.strokeStyle = PALETTE.outline;
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

// ---------- food: each dish is 2-3 drawn layers, never a single colour block ----------

export function drawPasta(ctx, x, y, s) {
  // plate
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2;
  circle(ctx, x, y, 30 * s); ctx.fill(); ctx.stroke();
  // noodle curves
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 5 * s;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(x + (i - 1.5) * 7 * s, y + (i % 2 ? 2 : -2) * s, (12 - i * 1.5) * s, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
  // tomato sauce
  ctx.fillStyle = '#d84a3a';
  circle(ctx, x - 8 * s, y - 4 * s, 6 * s); ctx.fill();
  circle(ctx, x + 9 * s, y + 5 * s, 5 * s); ctx.fill();
  circle(ctx, x + 2 * s, y - 9 * s, 4 * s); ctx.fill();
  // basil leaf
  ctx.fillStyle = '#3f9e57';
  ctx.beginPath();
  ctx.ellipse(x + 6 * s, y - 8 * s, 7 * s, 4 * s, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

export function drawSandwich(ctx, x, y, s) {
  // bottom bread
  ctx.fillStyle = '#e8b96a';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2;
  rr(ctx, x - 26 * s, y + 6 * s, 52 * s, 12 * s, 5 * s); ctx.fill(); ctx.stroke();
  // egg white, wobbly
  ctx.fillStyle = '#fffdf4';
  ctx.beginPath();
  ctx.ellipse(x, y + 2 * s, 26 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  // yolk
  ctx.fillStyle = '#f2a81d';
  circle(ctx, x + 4 * s, y + 1 * s, 8 * s); ctx.fill(); ctx.stroke();
  // lettuce line
  ctx.fillStyle = '#6fbf5a';
  rr(ctx, x - 24 * s, y - 4 * s, 48 * s, 5 * s, 2 * s); ctx.fill();
  // top bread, slightly offset
  ctx.fillStyle = '#eec27e';
  rr(ctx, x - 24 * s, y - 18 * s, 48 * s, 14 * s, 6 * s); ctx.fill(); ctx.stroke();
}

export function drawSalad(ctx, x, y, s) {
  // bowl
  ctx.fillStyle = '#4a90d9';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y - 4 * s, 26 * s, 0, Math.PI);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // three fruit colours
  ctx.fillStyle = '#e05a4e';
  rr(ctx, x - 18 * s, y - 16 * s, 12 * s, 12 * s, 3 * s); ctx.fill();
  ctx.fillStyle = '#8e6cc8';
  circle(ctx, x + 2 * s, y - 14 * s, 7 * s); ctx.fill();
  ctx.fillStyle = '#f2a81d';
  ctx.beginPath();
  ctx.moveTo(x + 10 * s, y - 18 * s);
  ctx.lineTo(x + 22 * s, y - 18 * s);
  ctx.lineTo(x + 16 * s, y - 6 * s);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6fbf5a';
  circle(ctx, x - 6 * s, y - 20 * s, 5 * s); ctx.fill();
  // highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.arc(x, y - 2 * s, 18 * s, Math.PI * 1.15, Math.PI * 1.45);
  ctx.stroke();
}

export function drawDish(ctx, dishId, x, y, s) {
  if (dishId === 'pasta') drawPasta(ctx, x, y, s);
  else if (dishId === 'sandwich') drawSandwich(ctx, x, y, s);
  else drawSalad(ctx, x, y, s);
}

// Tiny dish icon for speech bubbles and tickets.
export function drawDishIcon(ctx, dishId, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  if (dishId === 'pasta') {
    ctx.fillStyle = '#f2c14e';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d84a3a';
    ctx.beginPath(); ctx.arc(0, 0, 9, 0.3, Math.PI * 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 2, 6, 0.2, Math.PI * 0.8); ctx.stroke();
    ctx.fillStyle = '#3f9e57';
    ctx.beginPath(); ctx.ellipse(4, -4, 4, 2.5, -0.5, 0, Math.PI * 2); ctx.fill();
  } else if (dishId === 'sandwich') {
    ctx.fillStyle = '#eec27e';
    rr(ctx, -10, -7, 20, 6, 3); ctx.fill();
    ctx.fillStyle = '#fffdf4';
    rr(ctx, -11, -1, 22, 5, 2); ctx.fill();
    ctx.fillStyle = '#f2a81d';
    circle(ctx, 3, 1, 3.5); ctx.fill();
    ctx.fillStyle = '#e8b96a';
    rr(ctx, -10, 4, 20, 5, 2); ctx.fill();
  } else {
    ctx.fillStyle = '#4a90d9';
    ctx.beginPath(); ctx.arc(0, -2, 10, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e05a4e'; circle(ctx, -5, -6, 3.5); ctx.fill();
    ctx.fillStyle = '#8e6cc8'; circle(ctx, 2, -7, 3); ctx.fill();
    ctx.fillStyle = '#f2a81d'; circle(ctx, 7, -4, 3); ctx.fill();
  }
  ctx.restore();
}

// ---------- ingredients that live beside the stations, always visible ----------

function drawTomato(ctx, x, y, s) {
  ctx.fillStyle = '#e05a4e';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2;
  circle(ctx, x, y, 15 * s); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3f9e57';
  ctx.beginPath();
  ctx.moveTo(x, y - 12 * s); ctx.lineTo(x - 5 * s, y - 18 * s); ctx.lineTo(x + 5 * s, y - 18 * s);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath(); ctx.arc(x - 4 * s, y - 4 * s, 6 * s, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
}

function drawApple(ctx, x, y, s) {
  ctx.fillStyle = '#d84a3a';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2;
  circle(ctx, x, y, 13 * s); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#7a4a21';
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath(); ctx.moveTo(x, y - 12 * s); ctx.lineTo(x + 2 * s, y - 18 * s); ctx.stroke();
  ctx.fillStyle = '#3f9e57';
  ctx.beginPath(); ctx.ellipse(x + 6 * s, y - 14 * s, 6 * s, 3 * s, -0.6, 0, Math.PI * 2); ctx.fill();
}

function drawEgg(ctx, x, y, s) {
  ctx.fillStyle = '#fffdf4';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y, 11 * s, 14 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}

function drawNoodles(ctx, x, y, s) {
  ctx.strokeStyle = '#f2c14e';
  ctx.lineWidth = 4 * s;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x - 12 * s, y - 8 * s + i * 8 * s);
    ctx.quadraticCurveTo(x, y - 12 * s + i * 8 * s, x + 12 * s, y - 8 * s + i * 8 * s);
    ctx.stroke();
  }
  ctx.strokeStyle = '#d8a83a';
  ctx.lineWidth = 2 * s;
  ctx.beginPath(); ctx.moveTo(x - 14 * s, y + 12 * s); ctx.lineTo(x + 14 * s, y + 12 * s); ctx.stroke();
}

function drawHerb(ctx, x, y, s) {
  ctx.strokeStyle = '#3f9e57';
  ctx.lineWidth = 3 * s;
  ctx.beginPath(); ctx.moveTo(x, y + 10 * s); ctx.lineTo(x, y - 12 * s); ctx.stroke();
  ctx.fillStyle = '#3f9e57';
  for (const [dx, dy, rot] of [[-6, -4, -0.7], [6, -8, 0.7], [-5, -12, -0.5]]) {
    ctx.beginPath();
    ctx.ellipse(x + dx * s, y + dy * s, 6 * s, 3 * s, rot, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlateStack(ctx, x, y, s) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(x, y - i * 6 * s, 16 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
}

function drawBell(ctx, x, y, s) {
  ctx.fillStyle = '#f2c14e';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 12 * s, Math.PI, 0);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  circle(ctx, x, y - 13 * s, 3 * s); ctx.fill(); ctx.stroke();
  ctx.fillStyle = PALETTE.outline;
  rr(ctx, x - 14 * s, y, 28 * s, 3 * s, 1 * s); ctx.fill();
}

// ---------- the room ----------

export function drawRoom(ctx, k, now) {
  // Walls and floor.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.wallShadow;
  ctx.fillRect(0, 52, VIEW_W, 8);
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 560, VIEW_W, VIEW_H - 560);
  ctx.fillStyle = 'rgba(58,42,26,0.08)';
  for (let x = 0; x < VIEW_W; x += 90) ctx.fillRect(x, 560, 3, VIEW_H - 560);

  // Back shelf with jars (decoration).
  ctx.fillStyle = '#b98a55';
  ctx.fillRect(330, 96, 620, 10);
  const jarColors = ['#e05a4e', '#6fbf5a', '#f2c14e', '#4a90d9', '#8e6cc8'];
  for (let i = 0; i < 5; i++) {
    const jx = 360 + i * 120;
    ctx.fillStyle = jarColors[i];
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 2;
    rr(ctx, jx, 62, 34, 34, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff8e8';
    rr(ctx, jx + 4, 74, 26, 10, 3); ctx.fill();
  }

  drawStations(ctx, k, now);
  drawCustomers(ctx, k);
  drawTray(ctx, k, now);
}

function drawStations(ctx, k, now) {
  for (const st of STATIONS) {
    const cx = st.x;
    const top = st.y;
    const w = 176;
    const x0 = cx - w / 2;

    // Counter block.
    ctx.fillStyle = PALETTE.counterSide;
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 3;
    rr(ctx, x0, top, w, 110, 10); ctx.fill(); ctx.stroke();
    ctx.fillStyle = PALETTE.counterTop;
    rr(ctx, x0 - 6, top - 10, w + 12, 22, 8); ctx.fill(); ctx.stroke();

    // Station colour stripe, with the name and key written on it in white:
    // it can never be covered by the order board when it holds four tickets.
    ctx.fillStyle = st.color;
    rr(ctx, x0 + 10, top + 82, w - 20, 14, 6); ctx.fill();
    text(ctx, st.key + ' · ' + st.name.toUpperCase(), cx, top + 93, 11, '#ffffff', true, 'center');

    // What is cooking here right now.
    const cookingOrder = k.orders.find((o) => o.cooking && o.cooking.station === st.id);
    if (st.id === 'board') {
      drawTomato(ctx, x0 + 26, top - 30, 1.0);
      drawApple(ctx, x0 + 62, top - 28, 0.95);
      if (cookingOrder) {
        // knife chopping: blade + tomato half, bobbing
        const bob = Math.sin(now * 9) * 3;
        ctx.save();
        ctx.translate(cx, top - 34 + bob);
        ctx.rotate(-0.5);
        ctx.fillStyle = '#cfd6dd';
        ctx.strokeStyle = PALETTE.outline;
        ctx.lineWidth = 2;
        rr(ctx, -4, -16, 8, 26, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#7a4a21';
        rr(ctx, -4, 10, 8, 12, 3); ctx.fill(); ctx.stroke();
        ctx.restore();
        drawTomato(ctx, cx + 34, top - 26, 0.8);
      }
    }
    if (st.id === 'stove') {
      drawEgg(ctx, x0 + w - 30, top - 30, 1.0);
      drawNoodles(ctx, x0 + w - 66, top - 30, 0.9);
      drawHeatGauge(ctx, k, now);
      // pot on the burner when something boils/fries
      if (cookingOrder) {
        const dish = dishById(cookingOrder.dishId);
        ctx.fillStyle = '#5a5f6b';
        ctx.strokeStyle = PALETTE.outline;
        ctx.lineWidth = 2;
        rr(ctx, cx - 34, top - 44, 68, 30, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = dish.color;
        ctx.beginPath(); ctx.ellipse(cx, top - 44, 30, 6, 0, 0, Math.PI * 2); ctx.fill();
        // bubbles
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        const b = (now * 2 + 1) % 1;
        circle(ctx, cx - 12, top - 48 - b * 10, 3); ctx.fill();
        circle(ctx, cx + 10, top - 46 - ((now * 2 + 0.5) % 1) * 10, 2.5); ctx.fill();
      } else {
        // idle burner rings
        ctx.strokeStyle = '#8a5a28';
        ctx.lineWidth = 3;
        circle(ctx, cx, top - 22, 22); ctx.stroke();
        circle(ctx, cx, top - 22, 12); ctx.stroke();
      }
    }
    if (st.id === 'plating') {
      drawPlateStack(ctx, x0 + 24, top - 26, 0.9);
      drawHerb(ctx, x0 + w - 26, top - 30, 0.9);
      if (cookingOrder) drawPlatingInProgress(ctx, cookingOrder, cx, top - 30, now);
    }
    if (st.id === 'serving') {
      // serving window arch above the counter, in the station's own colour
      // so the white PICK UP text reads at a glance
      ctx.strokeStyle = PALETTE.outline;
      ctx.lineWidth = 3;
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.moveTo(cx - 52, top - 8);
      ctx.lineTo(cx - 52, top - 74);
      ctx.quadraticCurveTo(cx, top - 104, cx + 52, top - 74);
      ctx.lineTo(cx + 52, top - 8);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      text(ctx, 'PICK UP', cx, top - 66, 13, '#ffffff', true, 'center');
      text(ctx, 'HERE', cx, top - 50, 13, '#ffffff', true, 'center');
      drawBell(ctx, cx - 20, top - 34, 1.0);
    }
  }
}

// The plating table shows a half-finished dish with a progress ring and step mark.
function drawPlatingInProgress(ctx, order, cx, y, now) {
  const dish = dishById(order.dishId);
  // plate with noodles only: the sauce is still missing
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2;
  circle(ctx, cx, y, 26); ctx.fill(); ctx.stroke();
  if (order.dishId === 'pasta') {
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + (i - 1) * 8, y, 10 - i, Math.PI * 0.2, Math.PI * 0.8);
      ctx.stroke();
    }
  } else {
    drawDish(ctx, order.dishId, cx, y, 0.55);
  }
  // circular progress ring + "2/3" step mark
  const p = order.cooking && order.cooking.kind === 'plain' ? order.cooking.progress : order.stepIndex / 3;
  ctx.strokeStyle = 'rgba(58,42,26,0.25)';
  ctx.lineWidth = 5;
  circle(ctx, cx + 34, y - 26, 13); ctx.stroke();
  ctx.strokeStyle = dish.color;
  ctx.beginPath();
  ctx.arc(cx + 34, y - 26, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p);
  ctx.stroke();
  text(ctx, order.stepIndex + '/3', cx + 34, y - 21, 10, PALETTE.ink, true, 'center');
}

// Stove heat gauge: semicircle above the stove, raw / perfect / burnt zones.
function drawHeatGauge(ctx, k, now) {
  const cx = 528;
  const cy = 216;
  const r = 58;
  const cooking = k.orders.find((o) => o.cooking && o.cooking.kind === 'heat');
  const heat = cooking ? cooking.cooking.heat : 0;

  // dial face
  ctx.fillStyle = '#fff8e8';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 0);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // zones: raw 0-55 pale, perfect 55-80 green, burnt 80-100 red
  const zone = (a0, a1, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 8, Math.PI + (a0 / 100) * Math.PI, Math.PI + (a1 / 100) * Math.PI);
    ctx.stroke();
  };
  zone(0, HEAT.perfectLow, '#f2e3a0');
  zone(HEAT.perfectLow, HEAT.perfectHigh, '#3f9e57');
  zone(HEAT.perfectHigh, 100, '#d84a3a');

  // needle, parked at the green edge when a dish is on the stove
  const angle = Math.PI + (Math.min(100, heat) / 100) * Math.PI;
  const nx = cx + Math.cos(angle) * (r - 18);
  const ny = cy + Math.sin(angle) * (r - 18);
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny); ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  circle(ctx, cx, cy, 6); ctx.fill();

  text(ctx, 'HEAT', cx, cy - r - 8, 11, PALETTE.ink, true, 'center');
  text(ctx, 'RAW', cx - r + 4, cy + 16, 9, '#a8743a', true, 'center');
  text(ctx, 'PERFECT', cx, cy + 16, 9, '#3f9e57', true, 'center');
  text(ctx, 'BURNT', cx + r - 6, cy + 16, 9, '#d84a3a', true, 'center');

  if (cooking) {
    const inGreen = heat >= HEAT.perfectLow && heat <= HEAT.perfectHigh;
    text(ctx, inGreen ? 'PULL NOW!' : 'WATCH THE NEEDLE', cx, cy + 32, 11, inGreen ? '#3f9e57' : '#a8743a', true, 'center');
  }
}

// ---------- customers: flat little people by the serving window ----------

function drawPerson(ctx, x, y, s, color, hair, skin = '#f2c9a0') {
  // body
  ctx.fillStyle = color;
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2;
  rr(ctx, x - 16 * s, y, 32 * s, 34 * s, 10 * s); ctx.fill(); ctx.stroke();
  // apron stripe
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  rr(ctx, x - 10 * s, y + 12 * s, 20 * s, 18 * s, 5 * s); ctx.fill();
  // head
  ctx.fillStyle = skin;
  circle(ctx, x, y - 14 * s, 14 * s); ctx.fill(); ctx.stroke();
  // hair
  ctx.fillStyle = PALETTE.ink;
  if (hair === 'bun') {
    ctx.beginPath(); ctx.arc(x, y - 20 * s, 13 * s, Math.PI, 0); ctx.fill();
    circle(ctx, x, y - 30 * s, 5 * s); ctx.fill();
  } else if (hair === 'cap') {
    ctx.beginPath(); ctx.arc(x, y - 18 * s, 13 * s, Math.PI, 0); ctx.fill();
    ctx.fillStyle = color;
    rr(ctx, x - 13 * s, y - 26 * s, 26 * s, 6 * s, 3 * s); ctx.fill();
  } else if (hair === 'long') {
    ctx.beginPath(); ctx.arc(x, y - 16 * s, 14 * s, Math.PI * 0.9, Math.PI * 2.1); ctx.fill();
    rr(ctx, x - 15 * s, y - 18 * s, 6 * s, 22 * s, 3 * s); ctx.fill();
    rr(ctx, x + 9 * s, y - 18 * s, 6 * s, 22 * s, 3 * s); ctx.fill();
  } else if (hair === 'spiky') {
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 6 * s, y - 20 * s);
      ctx.lineTo(x + i * 6 * s + 3 * s, y - 30 * s);
      ctx.lineTo(x + i * 6 * s + 6 * s, y - 20 * s);
      ctx.closePath(); ctx.fill();
    }
  } else if (hair === 'bob') {
    ctx.beginPath(); ctx.arc(x, y - 16 * s, 14 * s, Math.PI, 0); ctx.fill();
    rr(ctx, x - 14 * s, y - 18 * s, 5 * s, 14 * s, 2 * s); ctx.fill();
    rr(ctx, x + 9 * s, y - 18 * s, 5 * s, 14 * s, 2 * s); ctx.fill();
  } else if (hair === 'pony') {
    ctx.beginPath(); ctx.arc(x, y - 18 * s, 13 * s, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = PALETTE.ink;
    ctx.lineWidth = 4 * s;
    ctx.beginPath(); ctx.moveTo(x + 10 * s, y - 26 * s); ctx.quadraticCurveTo(x + 22 * s, y - 10 * s, x + 16 * s, y + 4 * s); ctx.stroke();
  } else if (hair === 'curly') {
    for (let i = 0; i < 5; i++) {
      circle(ctx, x - 10 * s + i * 5 * s, y - 24 * s + (i % 2) * 3 * s, 5 * s); ctx.fill();
    }
  } else {
    ctx.beginPath(); ctx.arc(x, y - 18 * s, 13 * s, Math.PI, 0); ctx.fill();
  }
  // eyes
  ctx.fillStyle = PALETTE.ink;
  circle(ctx, x - 5 * s, y - 14 * s, 1.8 * s); ctx.fill();
  circle(ctx, x + 5 * s, y - 14 * s, 1.8 * s); ctx.fill();
  // smile
  ctx.strokeStyle = PALETTE.ink;
  ctx.lineWidth = 1.6 * s;
  ctx.beginPath(); ctx.arc(x, y - 10 * s, 5 * s, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
}

function drawCustomers(ctx, k) {
  const shown = k.orders.slice(0, 3);
  const baseX = [1036, 1130, 1224];
  shown.forEach((order, i) => {
    const cx = baseX[i];
    const cust = { name: order.customer, idx: order.customerIdx };
    const info = { color: '#e56b8c', hair: 'bun' };
    // look up the customer's look from the order's stored index via a tiny table
    const looks = [
      ['#e56b8c', 'bun'], ['#4a90d9', 'cap'], ['#8e6cc8', 'long'], ['#3f9e57', 'spiky'],
      ['#e8862e', 'bob'], ['#c94f4f', 'flat'], ['#2fa8a0', 'pony'], ['#a8743a', 'curly'],
      ['#7a5fd0', 'bun'], ['#4f7ec9', 'spiky'], ['#d9739b', 'long'], ['#5a9e3f', 'cap'],
    ];
    const [color, hair] = looks[cust.idx % looks.length] || [info.color, info.hair];
    const patience = Math.max(0, order.timeLeft / order.timeMax);

    // speech bubble with the ordered dish's little icon
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 2;
    rr(ctx, cx - 26, 66, 52, 40, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 8, 106); ctx.lineTo(cx + 2, 118); ctx.lineTo(cx + 10, 106);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    drawDishIcon(ctx, order.dishId, cx, 86, 1.0);

    drawPerson(ctx, cx, 168, 1.0, color, hair);

    // patience bar underfoot
    ctx.fillStyle = 'rgba(58,42,26,0.25)';
    rr(ctx, cx - 24, 214, 48, 7, 3); ctx.fill();
    ctx.fillStyle = patience > 0.3 ? '#3f9e57' : '#d84a3a';
    rr(ctx, cx - 24, 214, 48 * patience, 7, 3); ctx.fill();
    text(ctx, order.customer, cx, 234, 12, PALETTE.ink, true, 'center');
  });
}

// ---------- the tray: finished dishes wait here, READY, steaming, glowing ----------

function drawTray(ctx, k, now) {
  const tx = 852;
  const ty = 452;
  const tw = 220;
  const th = 84;
  ctx.fillStyle = '#d8c49a';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 3;
  rr(ctx, tx, ty, tw, th, 12); ctx.fill(); ctx.stroke();
  text(ctx, 'TRAY', tx + 12, ty + 22, 12, '#7a5a30', true, 'left');

  k.tray.forEach((item, i) => {
    const cx = tx + 78 + i * 68;
    const cy = ty + 44;
    // outer glow
    const pulse = 0.5 + 0.5 * Math.sin(now * 3 + i);
    ctx.fillStyle = 'rgba(255, 214, 90, ' + (0.25 + 0.2 * pulse) + ')';
    circle(ctx, cx, cy, 40); ctx.fill();
    drawDish(ctx, item.dishId, cx, cy, 0.85);
    // steam: 2-3 white curves rising
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    for (let sIdx = 0; sIdx < 3; sIdx++) {
      const sx = cx - 14 + sIdx * 14;
      const sway = Math.sin(now * 2 + sIdx * 1.7) * 4;
      ctx.beginPath();
      ctx.moveTo(sx, cy - 30);
      ctx.quadraticCurveTo(sx + sway, cy - 44, sx - sway * 0.5, cy - 56);
      ctx.stroke();
    }
  });

  if (k.tray.length > 0) {
    // READY sign above the tray's right end, clear of the SERVING label.
    ctx.fillStyle = '#3f9e57';
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 2;
    rr(ctx, tx + tw - 92, ty - 30, 84, 26, 8); ctx.fill(); ctx.stroke();
    text(ctx, 'READY', tx + tw - 50, ty - 12, 14, '#ffffff', true, 'center');
  }
}

// ---------- HUD, order board, bottom bar ----------

function drawHud(ctx, k) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, VIEW_W, 58);
  ctx.fillStyle = PALETTE.outline;
  ctx.fillRect(0, 58, VIEW_W, 3);

  outlineText(ctx, 'LINE COOK RUSH', 20, 38, 26, '#e8862e');
  text(ctx, k.level.name, 268, 36, 15, PALETTE.ink, true, 'left');

  // score + target
  text(ctx, 'SCORE', 560, 24, 12, '#7a5a30', true, 'left');
  outlineText(ctx, String(k.score), 560, 48, 24, '#2e2118');
  text(ctx, '/ ' + k.level.target, 620, 48, 16, '#7a5a30', true, 'left');

  // strikes: three pans, crossed out as they are used
  text(ctx, 'STRIKES', 730, 24, 12, '#7a5a30', true, 'left');
  for (let i = 0; i < 3; i++) {
    const px = 748 + i * 34;
    const used = i < k.strikes;
    ctx.fillStyle = used ? '#d84a3a' : '#e8dcc2';
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 2;
    circle(ctx, px, 40, 12); ctx.fill(); ctx.stroke();
    if (used) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px - 6, 34); ctx.lineTo(px + 6, 46); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(px + 6, 34); ctx.lineTo(px - 6, 46); ctx.stroke();
    }
  }

  // big level timer capsule, top-right: a clock face you can read at a glance
  const tx = 1064;
  const ty = 10;
  const tw = 196;
  const th = 38;
  const low = k.dayLeft <= 30;
  ctx.fillStyle = low ? '#d84a3a' : '#fff8e8';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 2.5;
  rr(ctx, tx, ty, tw, th, 19); ctx.fill(); ctx.stroke();
  // clock face
  ctx.fillStyle = '#ffffff';
  circle(ctx, tx + 22, ty + 19, 13); ctx.fill(); ctx.stroke();
  const frac = k.dayLeft / k.level.daySeconds;
  ctx.strokeStyle = low ? '#ffffff' : '#3f9e57';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(tx + 22, ty + 19);
  const ang = -Math.PI / 2 + frac * Math.PI * 2;
  ctx.lineTo(tx + 22 + Math.cos(ang) * 9, ty + 19 + Math.sin(ang) * 9);
  ctx.stroke();
  text(ctx, formatClock(k.dayLeft), tx + 44, ty + 27, 20, low ? '#ffffff' : PALETTE.ink, true, 'left');
}

function drawOrderBoard(ctx, k, now) {
  const bx = 16;
  // In rush hour the banner takes the top strip, so the board starts lower.
  const by = k.level.rush ? 96 : 74;
  const bw = 280;
  ctx.fillStyle = 'rgba(58,42,26,0.12)';
  rr(ctx, bx, by, bw, 536, 12); ctx.fill();
  text(ctx, 'ORDERS', bx + 14, by + 26, 16, '#fff8e8', true, 'left');
  text(ctx, k.orders.length + ' / 4', bx + bw - 14, by + 26, 14, '#fff8e8', true, 'right');

  k.orders.forEach((order, i) => {
    const dish = dishById(order.dishId);
    const ty = by + 38 + i * 122;
    const th = 114;
    const selected = order.id === k.selectedId;
    const frac = Math.max(0, order.timeLeft / order.timeMax);
    const urgent = frac < 0.3;

    // ticket card
    ctx.fillStyle = selected ? '#fffdf4' : PALETTE.paper;
    ctx.strokeStyle = selected ? dish.color : PALETTE.outline;
    ctx.lineWidth = selected ? 4 : 2.5;
    rr(ctx, bx + 8, ty, bw - 16, th, 10); ctx.fill(); ctx.stroke();
    // colour band on top: the dish's main colour, readable when shrunk
    ctx.fillStyle = dish.color;
    ctx.beginPath();
    ctx.moveTo(bx + 8, ty + 10);
    ctx.lineTo(bx + 8, ty + 10);
    ctx.arcTo(bx + 8, ty, bx + 18, ty, 10);
    ctx.lineTo(bx + bw - 18, ty);
    ctx.arcTo(bx + bw - 8, ty, bx + bw - 8, ty + 10, 10);
    ctx.lineTo(bx + bw - 8, ty + 12);
    ctx.lineTo(bx + 8, ty + 12);
    ctx.closePath();
    ctx.fill();

    // dish name, large and bold
    text(ctx, dish.name, bx + 20, ty + 34, 19, PALETTE.ink, true, 'left');
    drawDishIcon(ctx, dish.id, bx + bw - 34, ty + 28, 1.0);
    text(ctx, 'for ' + order.customer + ' · ' + dish.points + ' pts', bx + 20, ty + 52, 13, '#7a5a30', false, 'left');

    // the three steps, with checkmarks and the current one highlighted
    dish.steps.forEach((step, si) => {
      const sy = ty + 68 + si * 13;
      if (si < order.stepIndex) {
        ctx.fillStyle = '#3f9e57';
        text(ctx, '✓ ' + step.label, bx + 20, sy, 12, '#3f9e57', true, 'left');
      } else if (si === order.stepIndex) {
        ctx.fillStyle = dish.color;
        text(ctx, '▶ ' + step.label + '  →  ' + step.station.toUpperCase(), bx + 20, sy, 12, '#2e2118', true, 'left');
      } else {
        text(ctx, '· ' + step.label, bx + 20, sy, 12, '#a89880', false, 'left');
      }
    });

    // order timer bar: red under 30%
    ctx.fillStyle = 'rgba(58,42,26,0.2)';
    rr(ctx, bx + 20, ty + th - 12, bw - 56, 7, 3); ctx.fill();
    ctx.fillStyle = urgent ? '#d84a3a' : frac < 0.6 ? '#e8a13a' : '#3f9e57';
    if (frac > 0) rr(ctx, bx + 20, ty + th - 12, (bw - 56) * frac, 7, 3); ctx.fill();
    if (urgent && Math.floor(now * 2) % 2 === 0) {
      text(ctx, 'HURRY!', bx + bw - 22, ty + th - 16, 11, '#d84a3a', true, 'right');
    }
    if (selected) {
      ctx.fillStyle = dish.color;
      rr(ctx, bx + bw - 72, ty + 38, 60, 18, 9); ctx.fill();
      text(ctx, 'PICKED', bx + bw - 42, ty + 51, 10, '#ffffff', true, 'center');
    }
  });

  if (k.orders.length === 0) {
    text(ctx, 'No orders yet —', bx + bw / 2, by + 120, 15, '#fff8e8', true, 'center');
    text(ctx, 'the next customer', bx + bw / 2, by + 144, 15, '#fff8e8', true, 'center');
    text(ctx, 'is on the way!', bx + bw / 2, by + 168, 15, '#fff8e8', true, 'center');
  }
}

function drawBottomBar(ctx, k) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 648, VIEW_W, 72);
  ctx.fillStyle = PALETTE.outline;
  ctx.fillRect(0, 648, VIEW_W, 3);

  const order = k.selectedOrder();
  if (order) {
    const dish = dishById(order.dishId);
    const step = dish.steps[Math.min(order.stepIndex, 2)];
    text(
      ctx,
      order.customer + "'s " + dish.name + ' — next: ' + step.label + ' at ' + step.station.toUpperCase() + '  [key ' + (step.station === 'board' ? '1' : step.station === 'stove' ? '2' : step.station === 'plating' ? '3' : '4') + ']',
      20, 678, 15, PALETTE.ink, true, 'left',
    );
  } else if (k.tray.length > 0) {
    text(ctx, 'A dish is READY — press 4 or click SERVE to hand it over!', 20, 678, 15, '#3f9e57', true, 'left');
  } else {
    text(ctx, 'Pick an order with Tab or a click, then work its steps at the stations.', 20, 678, 15, PALETTE.ink, true, 'left');
  }
  text(ctx, '1-4 stations · Tab pick order · P pause · M mute · H help · R restart', 20, 702, 13, '#7a5a30', false, 'left');
  text(ctx, 'Served: ' + k.servedCount + '  ·  +50 on-time bonus', 1260, 702, 13, '#7a5a30', false, 'right');
}

function drawRushBanner(ctx, k) {
  if (!k.level.rush) return;
  ctx.fillStyle = '#d84a3a';
  ctx.fillRect(0, 61, VIEW_W, 30);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px "Trebuchet MS", Verdana, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★  RUSH HOUR — orders come faster, timers run at 0.78×  ★', VIEW_W / 2, 82);
}

// ---------- screens ----------

function drawMenu(ctx, k, now) {
  drawRoom(ctx, k, now);
  ctx.fillStyle = 'rgba(46,33,24,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.fillStyle = '#fff8e8';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 4;
  rr(ctx, 290, 130, 700, 400, 20); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8862e';
  rr(ctx, 290, 130, 700, 84, 20); ctx.fill();
  ctx.fillStyle = '#e8862e';
  ctx.fillRect(290, 180, 700, 34);
  outlineText(ctx, 'LINE COOK RUSH', 640, 186, 46, '#fff8e8', true, 'center');
  text(ctx, 'Three dishes. Three levels. One very busy kitchen.', 640, 258, 19, PALETTE.ink, true, 'center');

  drawDish(ctx, 'pasta', 480, 320, 1.0);
  drawDish(ctx, 'sandwich', 640, 320, 1.0);
  drawDish(ctx, 'salad', 800, 320, 1.0);
  text(ctx, 'Tomato Pasta · 100', 480, 372, 14, PALETTE.ink, true, 'center');
  text(ctx, 'Egg Sandwich · 110', 640, 372, 14, PALETTE.ink, true, 'center');
  text(ctx, 'Fruit Salad · 120', 800, 372, 14, PALETTE.ink, true, 'center');

  // start button
  const pulse = 0.5 + 0.5 * Math.sin(now * 3);
  ctx.fillStyle = '#3f9e57';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 3;
  rr(ctx, 500, 400, 280, 56, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,' + (0.25 + 0.2 * pulse) + ')';
  rr(ctx, 500, 400, 280, 56, 14); ctx.fill();
  text(ctx, '▶  START COOKING', 640, 436, 22, '#ffffff', true, 'center');

  text(ctx, 'Enter start · R recipes · H how to play', 640, 486, 15, '#7a5a30', true, 'center');
  text(ctx, 'Keys 1-4 run the stations · Tab picks an order · watch the stove gauge!', 640, 510, 13, '#7a5a30', false, 'center');
}

function drawRecipes(ctx, k) {
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  outlineText(ctx, 'RECIPE BOOK', 640, 74, 34, '#e8862e', true, 'center');
  text(ctx, 'Every dish takes three steps. Work them in order, beat the clock.', 640, 104, 16, PALETTE.ink, true, 'center');

  const panels = [
    { dish: 'pasta', x: 60 },
    { dish: 'sandwich', x: 450 },
    { dish: 'salad', x: 840 },
  ];
  for (const p of panels) {
    const dish = dishById(p.dish);
    ctx.fillStyle = PALETTE.paper;
    ctx.strokeStyle = PALETTE.outline;
    ctx.lineWidth = 3;
    rr(ctx, p.x, 130, 380, 480, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = dish.color;
    rr(ctx, p.x, 130, 380, 54, 16); ctx.fill();
    ctx.fillStyle = dish.color;
    ctx.fillRect(p.x, 160, 380, 24);
    text(ctx, dish.name.toUpperCase(), p.x + 190, 166, 24, '#ffffff', true, 'center');

    drawDish(ctx, dish.id, p.x + 190, 250, 1.5);
    text(ctx, dish.points + ' points  ·  ' + dish.seconds + 's per order', p.x + 190, 310, 15, PALETTE.ink, true, 'center');

    dish.steps.forEach((step, si) => {
      const sy = 350 + si * 62;
      ctx.fillStyle = dish.color;
      circle(ctx, p.x + 36, sy, 16); ctx.fill();
      ctx.strokeStyle = PALETTE.outline;
      ctx.lineWidth = 2;
      circle(ctx, p.x + 36, sy, 16); ctx.stroke();
      text(ctx, String(si + 1), p.x + 36, sy + 5, 15, '#ffffff', true, 'center');
      text(ctx, step.label, p.x + 62, sy - 2, 18, PALETTE.ink, true, 'left');
      text(ctx, 'at the ' + step.station + (step.heat ? ' — watch the gauge!' : ''), p.x + 62, sy + 20, 14, '#7a5a30', false, 'left');
    });

    text(ctx, 'Mistakes: wrong station,', p.x + 190, 552, 14, '#d84a3a', true, 'center');
    text(ctx, 'timeout, or a burnt dish.', p.x + 190, 574, 14, '#d84a3a', true, 'center');
  }
  text(ctx, 'Press Enter or click anywhere to go back', 640, 652, 15, '#7a5a30', true, 'center');
}

function drawOverlayCard(ctx, title, lines, accent, footer) {
  ctx.fillStyle = 'rgba(46,33,24,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#fff8e8';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 4;
  rr(ctx, 390, 180, 500, 340, 18); ctx.fill(); ctx.stroke();
  ctx.fillStyle = accent;
  rr(ctx, 390, 180, 500, 64, 18); ctx.fill();
  ctx.fillStyle = accent;
  ctx.fillRect(390, 210, 500, 34);
  text(ctx, title, 640, 222, 30, '#ffffff', true, 'center');
  lines.forEach((line, i) => {
    text(ctx, line, 640, 290 + i * 34, 18, PALETTE.ink, i === 0, 'center');
  });
  text(ctx, footer, 640, 486, 15, '#7a5a30', true, 'center');
}

function drawHelp(ctx, k) {
  drawOverlayCard(
    ctx,
    'HOW TO PLAY',
    [
      'Orders arrive on the board — pick one with Tab or a click.',
      'Work its 3 steps at the matching stations: keys 1-4 or click.',
      'Stove steps use the heat gauge: pull in the green, never the red.',
      'Finished dishes land on the tray — press 4 to serve them.',
      'Wrong station, timeout or a burnt dish = a strike. Three strikes end the day.',
      'Beat the score target before the day timer runs out to move on.',
    ],
    '#4a90d9',
    'Press H or Esc to close',
  );
}

function drawTutorial(ctx, k) {
  ctx.fillStyle = 'rgba(255,248,232,0.96)';
  ctx.strokeStyle = PALETTE.outline;
  ctx.lineWidth = 3;
  rr(ctx, 330, 560, 620, 76, 12); ctx.fill(); ctx.stroke();
  text(ctx, 'FIRST SHIFT — quick start', 640, 586, 15, '#e8862e', true, 'center');
  text(ctx, '1. Tab picks an order  ·  2. Keys 1-4 work the stations  ·  3. Serve READY dishes with key 4', 640, 610, 14, PALETTE.ink, true, 'center');
  text(ctx, 'Stove steps: pull when the needle is green, or the dish burns!', 640, 628, 13, '#d84a3a', true, 'center');
}

// ---------- the main render entry ----------

export function render(ctx, game, now) {
  const k = game.kitchen;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  if (game.screen === 'menu') {
    drawMenu(ctx, k, now);
    return;
  }
  if (game.screen === 'recipes') {
    drawRecipes(ctx, k);
    return;
  }

  // gameplay (and overlays on top of it)
  drawRoom(ctx, k, now);
  drawHud(ctx, k);
  drawRushBanner(ctx, k);
  drawOrderBoard(ctx, k, now);
  drawBottomBar(ctx, k);

  // floating score / warning texts
  for (const f of k.floats) {
    ctx.globalAlpha = Math.min(1, f.ttl);
    outlineText(ctx, f.text, f.x, f.y, 26, f.color, true, 'center');
    ctx.globalAlpha = 1;
  }

  // first-day tutorial strip
  if (game.showTutorial && k.levelIndex === 0 && k.phase === 'playing') {
    drawTutorial(ctx, k);
  }

  if (game.screen === 'help') drawHelp(ctx, k);
  if (game.paused && game.screen === 'game') {
    drawOverlayCard(ctx, 'PAUSED', ['Take a breath, chef.', 'The timers are waiting for you.'], '#e8a13a', 'Press P to keep cooking');
  }
  if (game.screen === 'dayEnd') {
    const passed = k.dayResult === 'pass';
    const last = k.levelIndex === LEVELS.length - 1;
    if (passed && last) {
      drawOverlayCard(ctx, 'YOU WIN!', ['Final score: ' + k.score, 'Every day beaten. The kitchen is yours!'], '#3f9e57', 'Press R to cook another day');
    } else if (passed) {
      drawOverlayCard(ctx, 'DAY ' + k.level.day + ' DONE!', ['Score ' + k.score + ' / target ' + k.level.target, 'The crowd loved it. Next day, bigger rush.'], '#3f9e57', 'Press Enter for Day ' + (k.level.day + 1));
    } else {
      drawOverlayCard(ctx, 'DAY OVER', ['Score ' + k.score + ' / target ' + k.level.target, k.strikes >= 3 ? 'Three strikes — the kitchen closed early.' : 'The clock beat you this time.'], '#d84a3a', 'Press R to retry the day');
    }
  }
}
