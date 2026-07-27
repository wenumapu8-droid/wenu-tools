# wenu-tools

Small, dependency-light utilities extracted from the Wenu Mapu stack — for static sites and AI agents.

## Tools

- **[clean-images](./clean-images)** — Strip EXIF and re-encode images to WebP. Idempotent CLI over a directory.
- **[gen-avif](./gen-avif)** — Generate AVIF companions for every WebP by mtime. Idempotent CLI.
- **[security-log](./security-log)** — Redact API keys, tokens, JWTs, and `KEY=value` secrets from text and objects before logging. Zero deps, TypeScript.
- **[perceptual-hash](./perceptual-hash)** — dHash 64-bit perceptual hash + Hamming distance + MD5 for images (HEIC/JPG/PNG/WebP).

## Install

Each tool is published (or publishable) as its own npm package under the `@wenu-tools/*` scope:

```bash
npm install -g @wenu-tools/clean-images
npm install -g @wenu-tools/gen-avif
npm install @wenu-tools/security-log
npm install @wenu-tools/perceptual-hash
```

Or clone the repo and use directly:

```bash
git clone https://github.com/wenumapu8-droid/wenu-tools.git
cd wenu-tools
npm install
node clean-images/cli.mjs ./path/to/images
```

Node 18+ required. Tools that touch images depend on [`sharp`](https://sharp.pixelplumbing.com/); `security-log` has zero dependencies.

## Why

These are the internal utilities we use every week to keep [wenumapuonline.com](https://wenumapuonline.com) fast and to keep secrets out of agent logs. Extracted here in case they're useful to someone else. Small, focused, no framework.

## License

MIT. See [LICENSE](./LICENSE).

Made by [Nicolás Ortega García (Ocin)](https://wenumapuonline.com) — [wenumapuonline.com](https://wenumapuonline.com)
