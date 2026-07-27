# @wenu-tools/perceptual-hash

dHash (Neal Krawetz) 64-bit perceptual image hash + Hamming distance + MD5, backed by [`sharp`](https://sharp.pixelplumbing.com/) so it handles HEIC, JPG, PNG, and WebP.

## Install

```bash
npm install @wenu-tools/perceptual-hash
```

## Usage

```js
import { dHash, hammingDistance, md5File, imageMetadata } from '@wenu-tools/perceptual-hash';

const a = await dHash('./photo-a.jpg'); // 16 hex chars, e.g. 'f0e1c3878f9f9f8e'
const b = await dHash('./photo-b.heic');

hammingDistance(a, b); // 0 = identical; <8 = near-duplicate; ~32 = unrelated
await md5File('./photo-a.jpg'); // exact byte hash
await imageMetadata('./photo-a.jpg'); // { width, height, format, bytes }
```

Good for deduping bursts, matching a photo against a catalog, or quick "did the file actually change?" checks.

Requires Node 18+.

## License

MIT © 2026 Nicolás Ortega García / Wenu Mapu
