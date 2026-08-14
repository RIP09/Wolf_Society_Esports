# Huginn AI Automation — Complete Setup Guide

The platform now automates with **[Huginn](https://huginn.sh)** (the open-source,
self-hosted "agents that monitor and act on your behalf" platform) instead of n8n.
Everything is real and realtime: when an event happens on the website, a webhook
fires into your Huginn instance, and every delivery is recorded live in
**The Den → Automations**.

No part of this requires a paid tool. Huginn is free, open source, and runs on
your own machine/VPS (or a small cloud server).

---

## What changed from n8n

| Thing | Old (n8n) | New (Huginn) |
|---|---|---|
| Env var — main webhook | `N8N_WEBHOOK_URL` | `HUGINN_WEBHOOK_URL` |
| Env var — AI chat webhook | `N8N_CHAT_WEBHOOK_URL` | `HUGINN_CHAT_WEBHOOK_URL` |
| Env var — shared secret | `N8N_WEBHOOK_SECRET` | `HUGINN_WEBHOOK_SECRET` |
| Auth header | `x-n8n-secret` | `X-Huginn-Secret` (optional) |
| Importable file | `n8n/wolf-society-workflow.json` | `huginn/wolf-society-scenario.json` |
| Guide | `N8N_SETUP.md` | this file |

**If you already have `N8N_*` keys set:** remove them and add the `HUGINN_*`
keys below (the old names are no longer read).

---

## Step 1 — Get a Huginn instance (free, two options)

### Option A: One VPS / always-on machine (recommended, fully yours)
Huginn is a single Docker container. On any Linux VPS (a $4–6/month box, or a
free-tier cloud VM) with Docker installed:

```bash
mkdir -p huginn && cd huginn
# Download the official docker-compose (Huginn + PostgreSQL)
curl -O https://raw.githubusercontent.com/huginn/huginn/master/docker-compose.yml
docker compose up -d
```

Then set your public address in `docker-compose.yml` → environment → `DOMAIN`
(e.g. `https://huginn.yourdomain.com`) and restart:

```bash
docker compose up -d --force-recreate
```

Open `https://huginn.yourdomain.com`, log in with the seeded admin account and
**change the password immediately** (Huginn's README documents the default
credentials — treat them as the very first thing to rotate).

### Option B: Local machine / laptop for testing
```bash
docker run -d --name huginn -p 3000:3000 \
  -e DOMAIN=http://localhost:3000 \
  -e SECRET_KEY_BASE=$(openssl rand -hex 64) \
  -e INVITATION_CODE=wolf-society \
  ghcr.io/huginn/huginn
```
Open `http://localhost:3000`, create the first user with the invite code
`wolf-society`. (A local instance can only receive webhooks if it's reachable
from the internet — use Option A for the live site.)

---

## Step 2 — Import the included scenario

The repo ships a ready-made scenario at **`huginn/wolf-society-scenario.json`**:

1. In Huginn, go to **Scenarios → Add a Scenario → Import**.
2. Upload `huginn/wolf-society-scenario.json` (or paste its contents).
3. It creates three agents:
   - **Wolf Society Events Webhook** — receives every platform event.
   - **Ask Wolf Chat Webhook** — receives AI-assistant questions.
   - **AI Reply → Convex (/huginn-reply)** — disabled placeholder that posts AI
     replies back to the website (enable it in Step 4).
4. Open each Webhook Agent and change the `secret` option to your own random
   strings (Settings → the agent → Options → `secret`). Save.

> Every agent's URL is shown in its details page and looks like:
> `https://your-huginn/users/1/web_requests/<agent-id>/<secret>`

---

## Step 3 — Connect the platform (paste 3 keys, no CLI)

Add these in the **Keys tab** (and as Vercel env vars, same names):

| Key | Value |
|---|---|
| `HUGINN_WEBHOOK_URL` | the **Events Webhook Agent** URL from Step 2 |
| `HUGINN_CHAT_WEBHOOK_URL` | the **Chat Webhook Agent** URL (optional, powers Ask Wolf) |
| `HUGINN_WEBHOOK_SECRET` | optional shared secret — sent as `X-Huginn-Secret` and required by `/huginn-reply` if set |

Then in **The Den → Automations** hit **Send test event**. Within seconds:
- a new event appears in Huginn (Agents → Wolf Society Events Webhook → Events), and
- the outbox on the Automations page shows **sent**.

---

## Step 4 — The "Ask Wolf" AI assistant (real AI replies)

The assistant sends the visitor's question to the Chat Webhook Agent, then
waits for the finished reply to come back. Build this chain once in Huginn:

```
Ask Wolf Chat Webhook  →  OpenAI LLM Agent  →  AI Reply → Convex
```

1. **OpenAI LLM Agent** (Huginn ≥ recent release): add a new agent of type
   **OpenAI LLM Agent**.
   - Works with any OpenAI-compatible API — OpenAI, **Groq** (generous free
     tier), or a local **Ollama** server. Set `base_url` accordingly.
   - `model`: e.g. `gpt-4o-mini` / `llama-3.3-70b-versatile` (Groq) / your Ollama model.
   - `api_key`: your key (Groq and Ollama are free).
   - `user_message`: `{{ message }}` — takes the question from the webhook event.
   - `system_message`: e.g. "You are Wolf, the AI assistant for Wolf Society Esports…"
   - Keep `expected_receive_period_in_days` at 1.
   - Link it **from** the Chat Webhook (source) so it receives each chat event.
2. **Enable "AI Reply → Convex (/huginn-reply)"** (the Post Agent from the import):
   - Set `post_url` to `https://YOUR-PROJECT.convex.site/huginn-reply`
     (your project's Convex site URL — find it in the Convex dashboard).
   - Set the `X-Huginn-Secret` header to the same value as `HUGINN_WEBHOOK_SECRET`
     (or delete the header if you didn't set that key).
   - Link it **from** the OpenAI LLM Agent.
3. Save everything. Open the site's **Ask Wolf** widget, type a question — you'll
   see *"Huginn is writing the reply…"* and the real AI answer appears the
   moment the Post Agent delivers it.

If Huginn isn't connected yet, the widget still works with a helpful canned
reply — it never shows an error page.

---

## Step 5 — Starter automations (pick what you want)

- **Discord ping on tryout/registration** — after the Events Webhook, add a
  **Post Agent** that POSTs the event JSON to your `DISCORD_WEBHOOK_URL`.
- **New-player CRM row** — a **Google Sheets** or **Post Agent → Airtable**
  agent fed from the `player.registered` event.
- **Donation thank-you email** — Huginn **Email Agent** (SMTP) on
  `donation.paid`.
- **Announcement digest** — a **Scheduler Agent** + **Post Agent** combo that
  reposts announcements to your community.

Every event payload includes `event` (name), `payload` (the data), `sentAt` and
`source`, so any downstream agent can route on it.

---

## Events the platform fires

| Event | When |
|---|---|
| `contact` | Public contact form submitted |
| `subscribe` | Visitor signs up for SMS/email alerts |
| `player.registered` | A new player registers in The Pack |
| `tryout.registered` | A tryout signup lands |
| `donation.paid` | A Stripe donation is confirmed |
| `announcement.published` | The Den publishes an announcement |
| `security.alert` | A blocked unauthorized-access attempt |
| `test` | "Send test event" from The Den → Automations |

---

## Troubleshooting

- **Automations page shows "setup pending"** → `HUGINN_WEBHOOK_URL` is missing
  or not saved in the Keys tab / Vercel env.
- **Fires show "failed · HTTP 401"** → the webhook secret in the URL doesn't
  match the agent's `secret` option.
- **Ask Wolf stays on "writing the reply…"** → the OpenAI LLM Agent or the Post
  Agent isn't enabled/linked, the API key is wrong, or the `post_url` isn't
  your `*.convex.site` URL. Check each agent's **Logs** tab in Huginn.
- **Events are skipped (recorded, not failed)** → no webhook is configured yet;
  everything else on the site (email, SMS, Discord, Stripe) keeps working
  natively.
