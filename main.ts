// "The World in One Page" — Tuesday 17 November 2026 (make.fun news-image-20261117).
// The entry image is entry.png beside this file: a hand-drawn newspaper front page
// summing up the day's world news. This program only copies those exact bytes to
// /output/entry.png, so both grader runs write identical output. Node 22, standard
// library only, no network.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const MAX_BYTES = 1048576;
const MAX_SIDE = 1024;

const source = new URL('./entry.png', import.meta.url);
const outDir = process.env.MAKEFUN_OUTPUT_DIR?.trim() || '/output';
const target = join(outDir, 'entry.png');

if (!existsSync(source)) {
  throw new Error('entry.png is missing next to main.ts');
}
const bytes = readFileSync(source);
if (bytes.length > MAX_BYTES) {
  throw new Error(`entry.png is ${bytes.length} bytes, over the 1 MiB gate`);
}
if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4e || bytes[3] !== 0x47) {
  throw new Error('entry.png is not a PNG file');
}
// The first chunk must be IHDR (length at 8..11, type at 12..15), and the file
// must end with a whole IEND chunk, so the gate sees a complete image.
if (bytes.toString('ascii', 12, 16) !== 'IHDR') {
  throw new Error('entry.png has no IHDR chunk first');
}
if (bytes.toString('ascii', bytes.length - 8, bytes.length - 4) !== 'IEND') {
  throw new Error('entry.png has no IEND chunk at the end');
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width > MAX_SIDE || height > MAX_SIDE) {
  throw new Error(`entry.png is ${width}x${height}, over the 1024x1024 gate`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);

const sourceDigest = createHash('sha256').update(bytes).digest('hex');
const written = statSync(target).size;
const digest = createHash('sha256').update(readFileSync(target)).digest('hex');
if (written !== bytes.length || digest !== sourceDigest) {
  throw new Error(`copy mismatch: wrote ${written} bytes (sha256 ${digest}), expected ${bytes.length} (sha256 ${sourceDigest})`);
}
console.log(`entry.png: ${width}x${height}, ${written} bytes, sha256 ${digest}`);
