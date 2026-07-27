# @wenu-tools/gen-avif

Generate `.avif` companions next to every `.webp` in a directory tree. Idempotent — skips files whose AVIF is already newer than the WebP source.

## Install

```bash
npm install -g @wenu-tools/gen-avif
```

## Usage

```bash
gen-avif ./public/img
```

- Walks recursively.
- For each `foo.webp`, writes `foo.avif` at quality 60, effort 6.
- If `foo.avif.mtime >= foo.webp.mtime`, the file is skipped.

Pair with a `<picture>` element that lists AVIF first, WebP as fallback.

Requires Node 18+ and [`sharp`](https://sharp.pixelplumbing.com/).

## License

MIT © 2026 Nicolás Ortega García / Wenu Mapu
