export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("method_not_allowed");
    return;
  }

  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const received = req.headers?.["x-telegram-bot-api-secret-token"];

  if (!expected || received !== expected) {
    res.statusCode = 401;
    res.end("unauthorized");
    return;
  }

  // Phase 1: accept authenticated updates only.
  // Phase 2 will normalize the update, pass it through the Wënü policy layer,
  // call Claude, then send an approved response through the Telegram adapter.
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
}
