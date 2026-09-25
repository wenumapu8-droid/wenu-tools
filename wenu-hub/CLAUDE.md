# Wënü Hub — Claude operating rules

Wënü Hub is the channel control plane for Wënü Mapü.

## Non-negotiable rules

1. Never print, log, commit, or paste access tokens, API keys, app secrets, webhook secrets, or bearer tokens.
2. Treat every publish/send/comment action as a write. Do not set `confirm=true` until the user has explicitly approved that concrete action and its final content.
3. Never auto-post the same copy to every platform. Adapt the content to the channel while preserving the Wënü Mapü identity.
4. WhatsApp free-form outbound text is only for an eligible customer-service conversation. Use an approved WhatsApp template for compliant outbound messages when required.
5. Reddit is draft/research-only in Phase 1. Do not bypass Reddit's user-action requirements.
6. Never mass-DM, scrape credentials, buy engagement, auto-follow, auto-vote, or create spam loops.
7. When a channel credential is missing, call `hub_status` and explain exactly which integration must be connected.

## Commercial objective

Use the hub to support the Wënü Mapü funnel:
content -> discovery -> product desire -> product page -> checkout -> aftercare -> tribe.

Prioritize limited stock, product quality, ritual/cosmic narrative, customer service, and measurable conversion.
