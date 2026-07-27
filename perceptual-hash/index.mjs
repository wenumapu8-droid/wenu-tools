// perceptual-hash
// dHash perceptual hashing for images. 64-bit hash (16 hex chars).
// Uses sharp for resize/grayscale (supports HEIC, JPG, PNG, WebP).
//
// Usage:
//   import { dHash, hammingDistance, md5File } from '@wenu-tools/perceptual-hash';
//   const h = await dHash('/path/to/image.jpg');
//   hammingDistance(h1, h2); // 0 = identical, <8 = near-duplicate

import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';

// dHash algorithm (Neal Krawetz):
//   1. Resize to 9x8 grayscale.
//   2. For each row, compare adjacent pixels: bit=1 if left > right else 0.
//   3. 8 rows × 8 bits = 64-bit hash → 16 hex chars.
export async function dHash(imagePath) {
  const buf = await sharp(imagePath, { failOn: 'none' })
    .rotate() // honor EXIF orientation
    .resize(9, 8, { fit: 'fill', kernel: 'lanczos3' })
    .grayscale()
    .raw()
    .toBuffer();
  // buf is 9*8 = 72 bytes
  let bits = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const i = row * 9 + col;
      bits += buf[i] > buf[i + 1] ? '1' : '0';
    }
  }
  // bits is 64-char binary; convert to 16-char hex
  let hex = '';
  for (let i = 0; i < 64; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

// Hamming distance between two hex hashes of same length.
export function hammingDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    let xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    while (xor) { dist += xor & 1; xor >>= 1; }
  }
  return dist;
}

export async function md5File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    stream.on('data', d => hash.update(d));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export async function imageMetadata(imagePath) {
  try {
    const meta = await sharp(imagePath, { failOn: 'none' }).metadata();
    return {
      width: meta.width || null,
      height: meta.height || null,
      format: meta.format || null,
      bytes: meta.size || null,
    };
  } catch (e) {
    return { width: null, height: null, format: null, bytes: null, error: e.message };
  }
}

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
};

export function mimeTypeFromPath(p) {
  const m = p.match(/\.[a-z0-9]+$/i);
  if (!m) return null;
  return MIME_BY_EXT[m[0].toLowerCase()] || null;
}
