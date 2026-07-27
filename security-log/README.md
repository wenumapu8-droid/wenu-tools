# @wenu-tools/security-log

Sanitizer that redacts API keys, tokens, JWTs, and `KEY=value` secrets from arbitrary strings and objects before they hit logs, telemetry, or error reports. Zero dependencies. Pure TypeScript.

## Install

```bash
npm install @wenu-tools/security-log
```

## Usage

```ts
import { sanitizeText, sanitizeUnknown, isLocalhostUrl, redactPathForDisplay } from '@wenu-tools/security-log';

sanitizeText('token=sk-abcdef1234567890');
// → 'token=[REDACTED]'

sanitizeUnknown({ api_key: 'xyz', payload: { note: 'Bearer eyJhbGciOi...xxx' } });
// → { api_key: '[REDACTED]', payload: { note: '[REDACTED]' } }
```

Detects:
- OpenAI (`sk-...`), Anthropic (`sk-ant-...`), GitHub (`ghp_...`/`gho_...`), Slack (`xoxb-...`) tokens.
- `Bearer <token>` headers.
- Three-part JWTs.
- Any assignment where the key contains `TOKEN`, `SECRET`, `PASSWORD`, `API_KEY`, `COOKIE`, or `SESSION`.
- Object keys matching `token|secret|password|api_key|cookie|session|authorization`.

## License

MIT © 2026 Nicolás Ortega García / Wenu Mapu
