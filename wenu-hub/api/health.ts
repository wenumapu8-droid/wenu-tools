export default function handler(_req: any, res: any): void {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    ok: true,
    service: "wenu-hub",
    version: "0.1.0",
    time: new Date().toISOString()
  }));
}
