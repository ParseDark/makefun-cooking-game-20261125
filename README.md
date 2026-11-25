# Line Cook Rush

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/ParseDark/makefun-cooking-game-20261125/rank.svg)](https://make.fun/c/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/ParseDark/makefun-cooking-game-20261125/reward.svg)](https://make.fun/c/best-cooking-game-20261125-0137)

A complete, original cooking game that plays offline in a desktop browser from
its own static files. Run a tiny kitchen: take orders, chop, mind the stove's
heat gauge, plate, and serve before the customers walk out. Three dishes, three
days, and a rush hour that does not forgive a burnt pan.

Play it: serve `game/` with any static server (`node serve.ts`, then open
http://localhost:8080) and cook with keys 1-4 or the mouse.

## How it plays

- Orders land on the board (up to 4). Pick one with Tab or a click.
- Each dish takes 3 steps at the matching stations: Chopping Board (1), Stove (2),
  Plating Table (3), Serving Window (4).
- Stove steps use the heat gauge above the stove: pull the dish while the needle
  is in the green zone. Pull too early and it is still raw; let the needle pass
  the red zone and the dish burns.
- Finished dishes wait on the tray — steaming, glowing, marked READY. Press 4 or
  click the tray to serve. Serving on time earns a +50 bonus.
- Wrong station, a timed-out order, or a burnt dish is a strike. Three strikes
  end the day. Beat the day's score target (300 / 650 / 1100) before the clock
  runs out to move on; Day 3 runs at rush speed with a RUSH HOUR banner.

## Feature checklist (against the bounty)

- 3 dishes × 3 steps: Tomato Pasta (100 pts / 24s), Fried Egg Sandwich (110 / 26s),
  Fruit Salad (120 / 28s) — every step named on its order ticket.
- Timed rush: Day 3 orders run at 0.78× time with 4 orders up, red timer bars
  under 30%, and a RUSH HOUR banner.
- Three mistake types: wrong station, order timeout, burnt dish (heat gauge).
- Win / fail: beat the day target to advance; miss it or take 3 strikes and the
  day ends — win the game by clearing all three days.
- Tutorial: a first-shift coach strip on Day 1 plus a How to Play screen (H).
- Sounds: all synthesized with WebAudio — chops, sizzle, dings, serve chime,
  win/lose jingles. M mutes, volume is adjustable in code.
- Animations: steam rising off READY plates, a sweeping gauge needle, bubbling
  pots, bobbing knives, floating score texts, a pulsing start button.
- Screens: menu, gameplay, recipe book, pause, help, day-complete and game-over.
- No network: the game is plain files under `game/`; every sound is synthesized.

## Screenshots (in order — the first is the cover)

1. `1-gameplay.jpg` — the kitchen in play: order board, ingredients on the
   counters, a dish mid-assembly on the plating table, the level clock, and a
   READY plate steaming on the tray.
2. `2-rush.jpg` — Day 3 rush hour: four orders up, one timer bar red, strikes
   1/3, score 980/1100.
3. `3-recipes.jpg` — the recipe book with all three dishes.
4. `4-menu.jpg` — the title screen over a live kitchen preview.

All four are real renders of the game's own code, taken in a seeded
deterministic mode (`?shot=gameplay|rush|recipes|menu&seed=1`).

## Layout

- `main.ts` — the entry program: copies `game/` + `screenshots/` to `/output`
  and writes `dossier.json` with the vendored make.fun library.
- `game/index.html` — the page: one canvas, one module script.
- `game/src/main.js` — boot, screens, game loop, keyboard + mouse input.
- `game/src/data.js` — dishes, levels, customers, palette, seeded random.
- `game/src/engine.js` — orders, steps, heat gauge, scoring, strikes, levels.
- `game/src/draw.js` — every pixel: kitchen, tickets, food, people, gauge.
- `game/src/audio.js` — synthesized WebAudio sounds.
- `vendor/makefun-game.ts` — the kit's library, unchanged.
- `serve.ts` — the kit's tiny static server for local play.

## License

MIT — see [LICENSE](LICENSE).
