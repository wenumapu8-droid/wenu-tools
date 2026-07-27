# @wenu-tools/clean-images

Strip EXIF/metadata from images and re-encode to WebP when it saves weight. Idempotent — safe to re-run.

## Install

```bash
npm install -g @wenu-tools/clean-images
```

## Usage

```bash
clean-images ./public/img
```

- Walks the given directory recursively.
- PNG/JPG/JPEG larger than 800 KB → converted to WebP (quality 82).
- Everything else → re-encoded in place, stripping EXIF/ICC/XMP.
- Images under `/hero/` are capped at 1800px wide; everything else at 1200px.

Requires Node 18+ and [`sharp`](https://sharp.pixelplumbing.com/).

## License

MIT © 2026 Nicolás Ortega García / Wenu Mapu
