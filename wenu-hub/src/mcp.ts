import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function requireConfirm(confirm: boolean): void {
  if (!confirm) throw new Error("Write action blocked: set confirm=true only after the user explicitly approves the action.");
}

async function parseResponse(response: Response): Promise<any> {
  const text = await response.text();
  let body: any = text;
  try { body = text ? JSON.parse(text) : {}; } catch {}
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  return body;
}

async function postJson(url: string, token: string | undefined, body: unknown): Promise<any> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  return parseResponse(response);
}

async function postForm(url: string, fields: Record<string, string>): Promise<any> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields)
  });
  return parseResponse(response);
}

function graphUrl(path: string): string {
  const version = required("META_GRAPH_VERSION");
  return `https://graph.facebook.com/${version}/${path}`;
}

function buildServer(): McpServer {
  const server = new McpServer(
    { name: "wenu-hub", version: "0.1.0" },
    {
      instructions:
        "Wënü Hub controls brand communication channels. Read/status actions may run directly. Every external write tool requires confirm=true after explicit user approval. Never expose tokens or secrets. Reddit publishing is intentionally not automated in Phase 1."
    }
  );

  server.registerTool(
    "hub_status",
    {
      description: "Report which Wënü Hub channel credentials are configured without revealing secret values.",
      inputSchema: z.object({})
    },
    async () => {
      const configured = {
        whatsapp:
          Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID) &&
          Boolean(process.env.WHATSAPP_ACCESS_TOKEN) &&
          Boolean(process.env.META_GRAPH_VERSION),
        instagram:
          Boolean(process.env.META_INSTAGRAM_USER_ID) &&
          Boolean(process.env.META_INSTAGRAM_ACCESS_TOKEN) &&
          Boolean(process.env.META_GRAPH_VERSION),
        telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        pinterest: Boolean(process.env.PINTEREST_ACCESS_TOKEN),
        reddit: false,
        autonomousClaude:
          process.env.AUTO_REPLY_ENABLED === "true" &&
          Boolean(process.env.ANTHROPIC_API_KEY) &&
          Boolean(process.env.CLAUDE_MODEL)
      };
      return {
        content: [{ type: "text", text: JSON.stringify(configured, null, 2) }],
        structuredContent: configured
      };
    }
  );

  server.registerTool(
    "whatsapp_send_text_in_open_conversation",
    {
      description:
        "Send a free-form WhatsApp text only when the conversation is eligible for a customer-service reply. Do not use this tool for unsolicited outbound marketing; use an approved template instead.",
      inputSchema: z.object({
        to: z.string().min(8).describe("Recipient number in international digits, for example 14155552671"),
        text: z.string().min(1).max(4096),
        confirm: z.boolean()
      })
    },
    async ({ to, text, confirm }) => {
      requireConfirm(confirm);
      const phoneId = required("WHATSAPP_PHONE_NUMBER_ID");
      const token = required("WHATSAPP_ACCESS_TOKEN");
      const result = await postJson(graphUrl(`${phoneId}/messages`), token, {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: { body: text }
      });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.registerTool(
    "whatsapp_send_template",
    {
      description:
        "Send an approved WhatsApp message template. Suitable for policy-compliant outbound notifications or marketing when the template and consent requirements are satisfied.",
      inputSchema: z.object({
        to: z.string().min(8),
        templateName: z.string().min(1),
        languageCode: z.string().default("en_US"),
        bodyVariables: z.array(z.string()).default([]),
        confirm: z.boolean()
      })
    },
    async ({ to, templateName, languageCode, bodyVariables, confirm }) => {
      requireConfirm(confirm);
      const phoneId = required("WHATSAPP_PHONE_NUMBER_ID");
      const token = required("WHATSAPP_ACCESS_TOKEN");
      const components =
        bodyVariables.length > 0
          ? [{
              type: "body",
              parameters: bodyVariables.map(text => ({ type: "text", text }))
            }]
          : undefined;
      const result = await postJson(graphUrl(`${phoneId}/messages`), token, {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          ...(components ? { components } : {})
        }
      });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.registerTool(
    "telegram_send_message",
    {
      description: "Send a Telegram message through the configured Wënü bot.",
      inputSchema: z.object({
        chatId: z.union([z.string(), z.number()]),
        text: z.string().min(1).max(4096),
        confirm: z.boolean()
      })
    },
    async ({ chatId, text, confirm }) => {
      requireConfirm(confirm);
      const botToken = required("TELEGRAM_BOT_TOKEN");
      const result = await postJson(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        undefined,
        { chat_id: chatId, text }
      );
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.registerTool(
    "instagram_publish_image",
    {
      description:
        "Publish one image to the configured Instagram Professional account. The image URL must be publicly reachable by Meta.",
      inputSchema: z.object({
        imageUrl: z.url(),
        caption: z.string().max(2200).default(""),
        confirm: z.boolean()
      })
    },
    async ({ imageUrl, caption, confirm }) => {
      requireConfirm(confirm);
      const igUserId = required("META_INSTAGRAM_USER_ID");
      const accessToken = required("META_INSTAGRAM_ACCESS_TOKEN");
      const container = await postForm(graphUrl(`${igUserId}/media`), {
        image_url: imageUrl,
        caption,
        access_token: accessToken
      });
      if (!container?.id) throw new Error("Instagram did not return a media container id.");
      const published = await postForm(graphUrl(`${igUserId}/media_publish`), {
        creation_id: String(container.id),
        access_token: accessToken
      });
      return { content: [{ type: "text", text: JSON.stringify(published) }] };
    }
  );

  server.registerTool(
    "pinterest_create_pin",
    {
      description: "Create an organic image Pin in a Pinterest board using the official Pinterest API.",
      inputSchema: z.object({
        boardId: z.string().min(1),
        imageUrl: z.url(),
        title: z.string().min(1).max(100),
        description: z.string().max(800).default(""),
        link: z.url().optional(),
        confirm: z.boolean()
      })
    },
    async ({ boardId, imageUrl, title, description, link, confirm }) => {
      requireConfirm(confirm);
      const token = required("PINTEREST_ACCESS_TOKEN");
      const result = await postJson("https://api.pinterest.com/v5/pins", token, {
        board_id: boardId,
        title,
        description,
        ...(link ? { link } : {}),
        media_source: {
          source_type: "image_url",
          url: imageUrl
        }
      });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.registerTool(
    "reddit_integration_status",
    {
      description:
        "Explain the safe Reddit integration status. Wënü Hub Phase 1 does not auto-post as the user because Reddit requires explicit user action for user-account posting.",
      inputSchema: z.object({})
    },
    async () => ({
      content: [{
        type: "text",
        text:
          "Reddit is draft/research-only in Phase 1. Build a Reddit Developer Platform (Devvit) app and explicit user action flow before enabling posting or commenting as the user."
      }]
    })
  );

  return server;
}

export const mcpHandler = createMcpHandler(buildServer);
