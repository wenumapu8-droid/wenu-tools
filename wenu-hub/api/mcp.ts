import { toNodeHandler } from "@modelcontextprotocol/node";
import { mcpHandler } from "../src/mcp.js";

const nodeHandler = toNodeHandler(mcpHandler);

export default async function handler(req: any, res: any): Promise<void> {
  const expected = process.env.WENU_HUB_TOKEN;
  const auth = req.headers?.authorization;

  if (!expected || auth !== `Bearer ${expected}`) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "unauthorized" }));
    return;
  }

  await nodeHandler(req, res, req.body);
}
