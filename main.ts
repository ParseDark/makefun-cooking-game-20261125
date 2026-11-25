// main.ts — make.fun entry packager (Node 22, standard library only).
// Copies game/ and screenshots/ into $MAKEFUN_OUTPUT_DIR and writes
// dossier.json via buildDossier from vendor/makefun-game.ts (never modified).
//
// Verify locally:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Must exit 0.

import { cpSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// The scorer's own caps (kit gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse. buildDossier
// takes the entry directory and the caps — see vendor/makefun-game.ts.

function copyDir(name: string): void {
  const from = join(here, name);
  const to = join(outDir, name);
  if (!existsSync(from)) {
    throw new Error(`missing ${name}/ beside main.ts (expected at ${from})`);
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

function main(): number {
  mkdirSync(outDir, { recursive: true });
  copyDir('game');
  copyDir('screenshots');
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  const dossierPath = join(outDir, 'dossier.json');
  writeFileSync(dossierPath, dossier);
  // eslint-disable-next-line no-console
  console.log('wrote', dossierPath);
  return 0;
}

process.exit(main());
