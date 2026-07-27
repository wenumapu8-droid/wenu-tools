// security-log: redact API keys, tokens, JWTs, and KEY=value secrets from
// arbitrary strings and objects before they hit logs or telemetry.
//
// Zero dependencies. Pure TypeScript. Node built-ins only.

import path from "node:path";

const SECRET_PATTERNS: RegExp[] = [
  /\bsk-[A-Za-z0-9_-]{12,}\b/g,
  /\bsk-ant-[A-Za-z0-9_-]{12,}\b/g,
  /\bgh[pousr]_[A-Za-z0-9]{12,}\b/g,
  /\bxox[baprs]-[A-Za-z0-9-]{12,}\b/g,
  /\bBearer\s+[A-Za-z0-9._-]{12,}\b/gi,
  /\b[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g
];

const ASSIGNMENT_SECRET_PATTERN = /\b([A-Z0-9_]*(TOKEN|SECRET|PASSWORD|API_KEY|COOKIE|SESSION)[A-Z0-9_]*)=([^\s]+)/g;

function redactValue(value: string): string {
  if (value.length <= 8) {
    return "[REDACTED]";
  }
  return `${value.slice(0, 3)}...[REDACTED]...${value.slice(-3)}`;
}

export function sanitizeText(input: string): string {
  let output = input;
  for (const pattern of SECRET_PATTERNS) {
    output = output.replace(pattern, (match) => redactValue(match));
  }
  output = output.replace(ASSIGNMENT_SECRET_PATTERN, (_match, key: string) => `${key}=[REDACTED]`);
  return output;
}

export function sanitizeUnknown(input: unknown): unknown {
  if (typeof input === "string") {
    return sanitizeText(input);
  }
  if (Array.isArray(input)) {
    return input.map((item) => sanitizeUnknown(item));
  }
  if (input && typeof input === "object") {
    const objectEntries = Object.entries(input as Record<string, unknown>).map(([key, value]) => {
      if (/(token|secret|password|api[_-]?key|cookie|session|authorization)/i.test(key)) {
        return [key, "[REDACTED]"] as const;
      }
      return [key, sanitizeUnknown(value)] as const;
    });
    return Object.fromEntries(objectEntries);
  }
  return input;
}

export function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ["127.0.0.1", "localhost", "::1"].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function redactPathForDisplay(fullPath: string, rootPath: string): string {
  const relative = path.relative(rootPath, fullPath);
  if (!relative || relative.startsWith("..")) {
    return "[HIDDEN_PATH]";
  }
  return relative;
}
