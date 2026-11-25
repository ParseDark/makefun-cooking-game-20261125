// Line Cook Rush — make.fun entry packager (Node 22, standard library only).
// Copies game/ and screenshots/ from beside this file into $MAKEFUN_OUTPUT_DIR
// (or /output) and writes dossier.json with the vendored make.fun library.
//
// Verify locally:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Run it twice: the dossier must come out byte-identical both times.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps (kit gate.json): only text_max_bytes shapes the
// dossier's bytes; the rest make this program refuse an entry the scorer
// would refuse — more than 4 screenshots, one over 256 KiB, more than 993
// game entries or 48 MiB of game files, or a game path over 1000 bytes.
const dossierPath = join(outDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
console.log(`wrote ${dossierPath}`);
