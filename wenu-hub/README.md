# Wënü Hub

Wënü Hub is the omnichannel control plane for Wënü Mapü. It exposes one remote MCP endpoint to Claude Code and keeps each external platform behind a small, auditable adapter.

## Phase 1 — operator mode

Claude can:

- inspect channel configuration with `hub_status`
- send a WhatsApp customer-service message after explicit approval
- send an approved WhatsApp template
- send a Telegram message
- publish one image to an Instagram Professional account
- create an organic Pinterest image Pin
- report the Reddit integration boundary

All external writes require `confirm=true`.

Inbound Meta and Telegram webhook endpoints are present and authenticated, but Phase 1 only acknowledges events. They do not yet invoke Claude automatically.

## Architecture

```text
Claude Code
    |
    | MCP over HTTPS + Bearer token
    v
Wënü Hub
    |-- WhatsApp Cloud API
    |-- Instagram API
    |-- Telegram Bot API
    |-- Pinterest API v5
    |-- Reddit Developer Platform (Phase 2)
    |
    |-- /api/webhooks/meta
    |-- /api/webhooks/telegram
```

GitHub stores source code. Production credentials belong in the deployment platform's encrypted environment variables, never in this repository.

## Deploy

The folder is designed to be deployed as its own Vercel project with the project Root Directory set to:

```text
wenu-hub
```

Before deployment:

1. Generate a long random `WENU_HUB_TOKEN`.
2. Copy the variables from `.env.example` into the hosting environment.
3. Do not commit the real values.
4. Deploy and verify `GET /api/health`.
5. Point Claude Code at `https://YOUR_DOMAIN/api/mcp`.

## Connect Claude Code

Claude Code supports an authenticated HTTP MCP server.

Example:

```bash
export WENU_HUB_URL="https://YOUR_DOMAIN"
export WENU_HUB_TOKEN="YOUR_LOCAL_SECRET"

claude mcp add --transport http wenu-hub "$WENU_HUB_URL/api/mcp" \
  --header "Authorization: Bearer $WENU_HUB_TOKEN"
```

Alternatively, copy `.mcp.json.example` to `.mcp.json` and keep `WENU_HUB_TOKEN` in your local environment.

## WhatsApp

Required environment variables:

- `META_GRAPH_VERSION`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_ACCESS_TOKEN`
- `META_APP_SECRET`
- `META_WEBHOOK_VERIFY_TOKEN`

Meta webhook callback:

```text
https://YOUR_DOMAIN/api/webhooks/meta
```

Subscribe the Meta app to the WABA and the message-related webhook fields you actually need.

Use free-form WhatsApp text only when Meta allows it for the active customer conversation. Outbound notifications/marketing should use approved templates and the appropriate consent rules.

## Instagram

Use an Instagram Professional account.

Required environment variables:

- `META_GRAPH_VERSION`
- `META_INSTAGRAM_USER_ID`
- `META_INSTAGRAM_ACCESS_TOKEN`

Phase 1 supports image publishing. Add Reels, carousels, comments, mentions, insights, and DMs as separate tools rather than one oversized "Instagram" tool.

## Telegram

Create a bot with BotFather, store `TELEGRAM_BOT_TOKEN`, and generate a random `TELEGRAM_WEBHOOK_SECRET`.

Webhook endpoint:

```text
https://YOUR_DOMAIN/api/webhooks/telegram
```

Configure Telegram `setWebhook` with the same secret token so Wënü Hub can verify the `X-Telegram-Bot-Api-Secret-Token` header.

## Pinterest

A Pinterest Business account and approved developer app are required for production API access.

Required environment variable:

- `PINTEREST_ACCESS_TOKEN`

The current tool creates organic image Pins. A later content pipeline should generate Pinterest-specific titles, descriptions, alt/context copy, destination links, boards, and UTM parameters rather than blindly mirroring Instagram.

## Reddit

Phase 1 does not auto-post to Reddit.

Reddit's current Developer Platform supports app actions and user actions, but posting/commenting as the logged-in user must be an explicit user action. Build a Devvit app and approval flow before enabling those writes.

Use Reddit first for:

- research and language mining
- identifying recurring body-jewelry questions
- finding high-intent conversations
- drafting useful replies for manual approval
- documenting community rules by subreddit

Do not use it for mass promotion or automated engagement.

## Phase 2 — autonomous sales/support agent

Add the inbound event pipeline only after Phase 1 is stable:

```text
Webhook
 -> signature verification
 -> event normalization
 -> deduplication
 -> customer/channel context
 -> policy + brand rules
 -> Claude API / Agent SDK
 -> confidence / risk gate
 -> draft or approved reply
 -> channel adapter
 -> audit log
```

Recommended reply policy:

- order status / FAQ / sizing / material questions: auto-reply when grounded in trusted data
- product recommendation: auto-reply only from live catalog/inventory
- refunds, disputes, medical piercing complications, custom pricing, angry customers: human approval
- outbound marketing: never inferred; must originate from an approved campaign

## Phase 3 — content operating system

Add a content object with lifecycle:

```text
IDEA -> DRAFT -> REVIEW -> APPROVED -> SCHEDULED -> PUBLISHED -> MEASURED -> ARCHIVED
```

One campaign can fan out into channel-native derivatives:

- Instagram: visual desire + Reel/carousel
- Pinterest: evergreen discovery + SEO destination
- Telegram: tribe/drop alert
- WhatsApp: high-intent support or opted-in notification
- Reddit: community-native education, never ad copy pasted into threads

This keeps the system coherent without turning Wënü Mapü into a content spam machine.
