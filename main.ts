// Leonida Platinum — a GTA VI trophy guide & tracker for make.fun's
// gta6-trophy-guide-01 (Node 22, standard library only).
//
// What this program hands in: the static guide in app/ (index.html, its
// script, styles and data/trophies.json — the 55 official trophies with a
// cited guide each) and the screenshots/ renders of it. It copies both into
// the output directory and writes dossier.json there with the vendored
// make.fun library, which is the scorer's own copy and must stay unchanged.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally while you work on it with `node serve.ts`.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree(join(repoRoot, 'app'), join(outDir, 'app'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'));
}

// The scorer's own caps: 4 screenshots at most, each at most 256 KiB;
// app/ at most 993 files and directories and 48 MiB; the dossier's text at
// most 163,840 bytes. buildDossier refuses anything past those limits, so
// a dossier it writes is one the scorer accepts.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
console.log(`Leonida Platinum handed in to ${outDir}`);
