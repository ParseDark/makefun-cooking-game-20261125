// main.js — wires everything together: loop, screens, shot mode.

import { W, H } from './config.js';
import { createState, update, doAction, startDish, shotState } from './state.js';
import { draw } from './render.js';
import { handleClick, handleKey } from './input.js';
import { Audio } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const audio = new Audio();

// ---- deterministic screenshot mode ----------------------------------------
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = parseInt(params.get('seed') || '1', 10);

let state;

function playEvent(ev) {
  if (!ev) return;
  audio.setMuted(state.muted);
  audio.play(ev);
}

const actions = {
  play() { state.screen = 'playing'; },
  recipes() { state._return = state.screen; state.screen = 'recipes'; },
  back() { state.screen = state._return === 'playing' ? 'playing' : 'menu'; },
  how() { state.screen = 'menu'; state.tutorialSeen = false; state.screen = 'playing'; state.tutorialSeen = false; },
  pause() { state.screen = state.screen === 'paused' ? 'playing' : 'paused'; },
  restart() { const mute = state.muted; state = createState({ seed: Date.now() & 0xffff }); state.muted = mute; state.screen = 'playing'; },
  mute() { state.muted = !state.muted; audio.setMuted(state.muted); },
  help() { state.tutorialSeen = !state.tutorialSeen; },
  act(stId) {
    const ev = doAction(state, stId);
    if (ev === 'step') playEvent(stId === 'stove' ? 'sizzle' : stId === 'board' ? 'chop' : 'step');
    else playEvent(ev);
    if (state.lastEvent && (state.lastEvent.type === 'win' || state.lastEvent.type === 'fail'))
      playEvent(state.lastEvent.type);
  },
};

function toCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (W / r.width),
    y: (e.clientY - r.top) * (H / r.height),
  };
}

canvas.addEventListener('click', (e) => {
  const p = toCanvas(e);
  handleClick(state, p.x, p.y, actions);
});

window.addEventListener('keydown', (e) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
  handleKey(state, e.key, actions);
});

// ---- boot ------------------------------------------------------------------
if (shot) {
  // Fixed state, single frame, no loop → deterministic screenshot.
  state = shotState(shot, seed);
  draw(ctx, state);
  window.__SHOT_READY__ = true; // screenshot script waits for this flag
} else {
  state = createState({ seed: 20261125 });
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const prevEvent = state.lastEvent;
    update(state, dt);
    if (state.lastEvent && state.lastEvent !== prevEvent) {
      const t = state.lastEvent.type;
      if (t === 'error') playEvent('error');
      else if (t === 'win') playEvent('win');
      else if (t === 'fail') playEvent('fail');
    }
    draw(ctx, state);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
