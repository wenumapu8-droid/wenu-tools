#!/usr/bin/env node
// Strip EXIF/metadata from all images and re-encode to optimal weight.
// Convention: lowercase kebab-case names; webp for photos >800KB.
//
// Run: clean-images <root>
//   root — required, e.g. clean-images ./public/img
//
// Idempotent: safe to re-run. Replaces files in place.

import sharp from 'sharp';
import { readdir, rename, stat, unlink } from 'node:fs/promises';
import path from 'node:path';

const rootArg = process.argv[2] || './';
const ROOT = path.resolve(rootArg);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (/\.(png|jpe?g|webp)$/i.test(entry.name)) yield p;
  }
}

const HERO_MAX_W = 1800;
const TILE_MAX_W = 1200;

function targetWidth(file) {
  if (file.includes('/hero/')) return HERO_MAX_W;
  return TILE_MAX_W;
}

let savedBytes = 0;
let processed = 0;

for await (const file of walk(ROOT)) {
  const before = (await stat(file)).size;
  const ext = path.extname(file).toLowerCase();
  const w = targetWidth(file);

  // Heavy PNG/JPG → convert to webp; webp/small files → re-encode in place stripping metadata.
  const goWebp = (ext === '.png' || ext === '.jpg' || ext === '.jpeg') && before > 800 * 1024;

  let outPath = file;
  let outExt = ext;
  if (goWebp) {
    outExt = '.webp';
    outPath = file.replace(/\.(png|jpe?g)$/i, '.webp');
  }

  const tmp = outPath + '.tmp';

  let pipeline = sharp(file).rotate(); // honor orientation, then drop the tag
  const meta = await sharp(file).metadata();
  if (meta.width && meta.width > w) {
    pipeline = pipeline.resize({ width: w, withoutEnlargement: true });
  }

  // Re-encode without metadata (sharp drops EXIF/ICC/XMP by default unless withMetadata is called).
  if (outExt === '.webp') {
    await pipeline.webp({ quality: 82, effort: 5 }).toFile(tmp);
  } else if (outExt === '.png') {
    await pipeline.png({ compressionLevel: 9, palette: true }).toFile(tmp);
  } else {
    await pipeline.jpeg({ quality: 84, mozjpeg: true }).toFile(tmp);
  }

  if (outPath !== file) {
    await unlink(file).catch(() => {});
  }
  await rename(tmp, outPath);

  const after = (await stat(outPath)).size;
  savedBytes += (before - after);
  processed += 1;
  const fromKB = (before / 1024).toFixed(0);
  const toKB = (after / 1024).toFixed(0);
  const renamed = outPath !== file ? ` → ${path.basename(outPath)}` : '';
  console.log(`  ${path.relative(ROOT, file)}: ${fromKB}KB → ${toKB}KB${renamed}`);
}

console.log(`\ndone. ${processed} files, saved ${(savedBytes / 1024 / 1024).toFixed(2)} MB`);
