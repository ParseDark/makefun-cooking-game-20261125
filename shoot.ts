// shoot.ts — produce the 3 required screenshots as REAL browser renders.

// You run this locally; it drives your installed Chrome. It is NOT part of
// the submitted entry (keep it outside game/ and screenshots/).
//   npm i -D puppeteer           # or: npm i -D playwright && npx playwright install chromium
//   node serve.ts 8080 game &    # serve the game locally
//   node shoot.ts                # writes screenshots/1-menu.jpg etc.
// It loads the deterministic shot URLs (?shot=...&seed=1), waits for the
// window.__SHOT_READY__ flag the game sets after drawing a fixed frame,
// captures the 960x600 canvas, and re-encodes to 1280x720 JPEG quality 80,
// shrinking quality until each file is <= 256 KiB. If a browser driver is
// not installed it prints instructions and exits non-zero (it never writes
// a placeholder image).

import { mkdirSync, writeFileSync, statSync } from 'node:fs';

const BASE = process.env.SHOT_BASE || 'http://localhost:8080';

const SHOTS = [
  { file: 'screenshots/1-menu.jpg', url: `${BASE}/index.html?shot=menu&seed=1` },
  { file: 'screenshots/2-gameplay.jpg', url: `${BASE}/index.html?shot=gameplay&seed=1` },
  { file: 'screenshots/3-recipes.jpg', url: `${BASE}/index.html?shot=recipes&seed=1` },
];

const MAX = 262144; // 256 KiB

async function getBrowser(): Promise<any> {
  try {
    const pp = await import('puppeteer');
    return { kind: 'puppeteer', mod: pp.default ?? pp };
  } catch {}
  try {
    const pw = await import('playwright');
    return { kind: 'playwright', mod: pw };
  } catch {}
  throw new Error(
    'No browser driver found. Install one:\n' +
    '  npm i -D puppeteer\n' +
    'or\n' +
    '  npm i -D playwright && npx playwright install chromium'
  );
}

async function shootPuppeteer(mod: any) {
  const browser = await mod.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  for (const s of SHOTS) {
    await page.goto(s.url, { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.__SHOT_READY__ === true', { timeout: 5000 });
    await saveFitted(page, s.file);
  }
  await browser.close();
}

async function shootPlaywright(mod: any) {
  const browser = await mod.chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  for (const s of SHOTS) {
    await page.goto(s.url, { waitUntil: 'networkidle' });
    await page.waitForFunction('window.__SHOT_READY__ === true', { timeout: 5000 });
    await saveFittedPW(page, s.file);
  }
  await browser.close();
}

// Draw the 960x600 canvas centered on a 1280x720 frame, encode JPEG, step
// quality down until <= 256 KiB.
const FIT = `(() => {
  const src = document.getElementById('game');
  const out = document.createElement('canvas');
  out.width = 1280; out.height = 720;
  const c = out.getContext('2d');
  c.fillStyle = '#1b1e26'; c.fillRect(0,0,1280,720);
  const scale = Math.min(1280/src.width, 720/src.height);
  const w = src.width*scale, h = src.height*scale;
  c.drawImage(src, (1280-w)/2, (720-h)/2, w, h);
  const tryQ = (q) => out.toDataURL('image/jpeg', q).split(',')[1];
  let q = 0.8, data = tryQ(q);
  while (atob(data).length > ${MAX} && q > 0.3) { q -= 0.05; data = tryQ(q); }
  return data;
})()`;

async function saveFitted(page: any, file: string) {
  const b64 = await page.evaluate(FIT);
  writeOut(file, b64);
}

async function saveFittedPW(page: any, file: string) {
  const b64 = await page.evaluate(FIT);
  writeOut(file, b64);
}

function writeOut(file: string, b64: string) {
  mkdirSync('screenshots', { recursive: true });
  const buf = Buffer.from(b64, 'base64');
  if (buf.length > MAX) throw new Error(`${file} is ${buf.length} bytes (> 256 KiB) even at min quality`);
  writeFileSync(file, buf);
  // eslint-disable-next-line no-console
  console.log(`wrote ${file} (${buf.length} bytes)`);
}

const b = await getBrowser();
if (b.kind === 'puppeteer') await shootPuppeteer(b.mod);
else await shootPlaywright(b.mod);
for (const s of SHOTS) console.log(s.file, statSync(s.file).size, 'bytes');
