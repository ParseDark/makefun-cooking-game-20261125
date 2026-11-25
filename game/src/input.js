// input.js — translate mouse/keyboard into game actions. No drawing.

import { W, H, STATIONS } from './config.js';
import { topButtons, menuButtons } from './render.js';
import { doAction, startDish, level } from './state.js';

// Map a DOM click (already converted to canvas coords) to an action.
export function handleClick(s, mx, my, actions) {
  // Top toolbar buttons exist on play/pause/win/fail screens.
  if (['playing', 'paused', 'win', 'fail'].includes(s.screen)) {
    for (const b of topButtons(s)) {
      if (hit(mx, my, b)) return actions[b.id] && actions[b.id]();
    }
  }
  if (s.screen === 'menu') {
    for (const b of menuButtons()) {
      if (hit(mx, my, b)) return actions[b.id] && actions[b.id]();
    }
    return;
  }
  if (s.screen === 'recipes') return actions.back();
  if (s.screen === 'paused' || s.screen === 'win' || s.screen === 'fail') return;
  // Tutorial overlay: any click starts.
  if (!s.tutorialSeen) { s.tutorialSeen = true; return; }
  // Click a station to select + act on it.
  for (const st of STATIONS) {
    if (mx > st.x - 70 && mx < st.x + 70 && my > st.y - 48 && my < st.y + 60) {
      s.selectedStation = st.id;
      return actions.act(st.id);
    }
  }
}

function hit(mx, my, b) {
  return mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h;
}

export function handleKey(s, key, actions) {
  const k = key.toLowerCase();
  if (s.screen === 'menu') {
    if (k === 'enter' || k === ' ') return actions.play();
    if (k === 'r') return actions.recipes();
    return;
  }
  if (s.screen === 'recipes') { if (k === 'escape') actions.back(); return; }
  if (k === 'p') return actions.pause();
  if (k === 'm') return actions.mute();
  if (k === 'h') { s.tutorialSeen = !s.tutorialSeen; return; }
  if (s.screen !== 'playing') {
    if (k === 'r') return actions.restart();
    return;
  }
  if (!s.tutorialSeen && (k === ' ' || k === 'enter')) { s.tutorialSeen = true; return; }
  // 1..4 select a station
  const st = STATIONS.find((x) => x.key === key);
  if (st) { s.selectedStation = st.id; return actions.act(st.id); }
  if (k === ' ') return actions.act('serve');
  if (k === 'escape') return actions.pause();
}
