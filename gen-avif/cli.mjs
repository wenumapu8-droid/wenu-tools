#!/usr/bin/env node
// Generate .avif companions for every .webp in target directory.
// Run: gen-avif <root>
//   root — required, e.g. gen-avif ./public/img
//
// Idempotent: skips files where the .avif is newer than the .webp source.

import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const rootArg = process.argv[2] || './';
const ROOT = path.resolve(rootArg);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.webp$/i.test(entry.name)) yield p;
  }
}

let made = 0, skipped = 0, savedBytes = 0;

for await (const src of walk(ROOT)) {
  const out = src.replace(/\.webp$/i, '.avif');
  let needsBuild = true;
  try {
    const [a, b] = await Promise.all([stat(out), stat(src)]);
    if (a.mtimeMs >= b.mtimeMs) needsBuild = false;
  } catch {
    needsBuild = true;
  }
  if (!needsBuild) {
    skipped += 1;
    continue;
  }
  await sharp(src).avif({ quality: 60, effort: 6 }).toFile(out);
  const [srcSt, outSt] = await Promise.all([stat(src), stat(out)]);
  savedBytes += (srcSt.size - outSt.size);
  made += 1;
  console.log(`  ${path.relative(ROOT, out)}: ${(srcSt.size/1024).toFixed(0)}KB webp → ${(outSt.size/1024).toFixed(0)}KB avif`);
}

console.log(`\n${made} avif made, ${skipped} skipped (already up to date). Net savings vs webp: ${(savedBytes/1024).toFixed(0)} KB.`);
