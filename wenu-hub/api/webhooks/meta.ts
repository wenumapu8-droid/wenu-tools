import { createHmac, timingSafeEqual } from "node:crypto";

export const config = { api: { bodyParser: false } };

async function readRawBody(req: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function validSignature(raw: Buffer, signature: string | undefined, secret: string): boolean {
  if (!signature?.startsWith("sha256=")) return false;
  const expected = Buffer.from(
    "sha256=" + createHmac("sha256", secret).update(raw).digest("hex"),
    "utf8"
  );
  const received = Buffer.from(signature, "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export default async function handler(req: any, res: any): Promise<void> {
  if (req.method === "GET") {
    const mode = req.query?.["hub.mode"];
    const token = req.query?.["hub.verify_token"];
    const challenge = req.query?.["hub.challenge"];
    if (
      mode === "subscribe" &&
      token &&
      token === process.env.META_WEBHOOK_VERIFY_TOKEN
    ) {
      res.statusCode = 200;
      res.end(String(challenge ?? ""));
      return;
    }
    res.statusCode = 403;
    res.end("forbidden");
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("method_not_allowed");
    return;
  }

  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    res.statusCode = 503;
    res.end("meta_app_secret_not_configured");
    return;
  }

  const raw = await readRawBody(req);
  const signature = req.headers?.["x-hub-signature-256"];

  if (!validSignature(raw, signature, secret)) {
    res.statusCode = 401;
    res.end("invalid_signature");
    return;
  }

  // Phase 1: verify and acknowledge WhatsApp / Instagram webhook deliveries.
  // Phase 2: normalize events, dedupe them, and route approved events to Claude.
  res.statusCode = 200;
  res.end("EVENT_RECEIVED");
}
