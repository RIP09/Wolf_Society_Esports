# Wolf Society Esports — Live Integrations & Configuration Guide (A to Z)

This document is the complete setup manual for the realtime, full-stack Wolf Society
Esports platform. It covers the architecture, every integration, exact configuration
steps, and how to verify each piece is live.

---

## 1. Architecture — how live data flows

```
┌────────────────────┐   ┌────────────────────┐   ┌────────────────────┐
│  PUBLIC PORTAL     │   │  PLAYER PORTAL     │   │  MANAGEMENT PORTAL │
│  (wolfsociety.gg)  │   │  (The Pack)        │   │  (The Den)         │
└─────────┬──────────┘   └─────────┬──────────┘   └─────────┬──────────┘
          │  reads/writes         │  reads/writes          │  reads/writes
          ▼                       ▼                        ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    CONVEX — database + backend (free tier)            │
│  Realtime subscriptions: every query re-renders the moment any        │
│  portal writes. One database, three portals, zero refresh.            │
└───────────┬───────────────────────────────┬───────────────────────────┘
            │                               │
   ┌────────▼────────┐             ┌────────▼────────┐
   │  Server actions │             │  HTTP endpoints │
   │  (notify.ts,    │             │  (http.ts —     │
   │  payments.ts)   │             │   Stripe webhook)│
   └────────┬────────┘             └──────────────────┘
            ▼
   ┌──────────────────────────────────────────────┐
   │ External services (free tiers)               │
   │ Resend (email) · Vonage (SMS) · Stripe       │
   │ (payments) · Discord (notifications)         │
   └──────────────────────────────────────────────┘
```

**The core rule:** the database is the single source of truth. Every page in every
portal subscribes to Convex queries, so an edit in The Den (a roster change, a match
score, a published article) appears on the public and player portals **instantly** —
and every live count on the Den's overview updates in real time.

---

## 2. What's already wired in the code (no extra coding needed)

| Area | Backend module | Live behavior |
|---|---|---|
| Players / roster | `players.ts`, `teams.ts` | Registration → pending → approve/suspend, visible everywhere |
| Tournaments & matches | `tournaments.ts`, `matches.ts` | Live statuses, scores, bracket (`/bracket`) |
| Performance entries | `performance.ts`, `stats.ts` | Player logs → Den charts + K/D leaderboard update live |
| Announcements | `announcements.ts` | Den posts → player + public + email/SMS/Discord alert |
| Content CMS | `content.ts` | Den publishes → public news/articles update instantly |
| Sponsors | `sponsors.ts` | Den manages → public sponsors page updates |
| Contact / inquiries | `inquiries.ts` | Public form → Den inbox + email alert to org |
| Donations & tryouts | `payments.ts`, `http.ts` | Stripe Checkout + webhook confirms in real time |
| Public alerts / subscribers | `public.ts`, `notify.ts` | Subscribe → SMS + email broadcast |
| Site analytics | `analytics.ts` | Pageviews stream live to the Den analytics page |
| Security | `security.ts`, `securityLogs.ts` | Blocked attempts logged + emailed, shown on overview |
| Access requests | `access.ts` | Request → email with grant button → credentials by email/SMS |
| Notification outbox | `notify.ts` | Every send recorded with status (sent/failed/skipped) |
| Realtime overview | `stats.ts` | 16 live data-source tiles + unified activity feed |

---

## 3. Environment variables — the exact names the code reads

Paste these into the Convex dashboard (Settings → Environment Variables) **or** the
Keys/API keys tab of your hosting platform, using these exact names:

| Variable | Powers | Required? |
|---|---|---|
| `RESEND_API_KEY` | All automated emails (thank-yous, credentials, alerts) | Recommended |
| `VONAGE_API_KEY` + `VONAGE_API_SECRET` | SMS delivery of credentials + public alerts | Recommended |
| `STRIPE_SECRET_KEY` | Donations + paid tryout fees (Checkout) | For payments |
| `STRIPE_WEBHOOK_SECRET` | Confirms Stripe payments in real time | For payments |
| `DISCORD_WEBHOOK_URL` | Every alert posts to your Discord server | Optional |
| `SITE_URL` | Buttons in emails/SMS + Stripe redirects (e.g. `https://wolfsocietygg.vercel.app`) | Recommended |
| `NOTIFY_FROM_EMAIL` *(optional)* | Custom "from" address after you verify your domain | Optional |
| `SMS_FROM` *(optional)* | Sender name shown on incoming SMS | Optional |

> Until `RESEND_API_KEY` is set, emails are recorded in the notification outbox as
> `skipped` — the pipeline works, delivery is just waiting for the key.

---

## 4. A-to-Z configuration steps

### Step 1 — Convex (your own database, free)
1. Create a free account at [dashboard.convex.dev](https://dashboard.convex.dev).
2. Create a project named `wolf-society-esports`.
3. Copy the **Deployment URL** (`https://YOUR-PROJECT.convex.cloud`) and **Site URL**
   (`https://YOUR-PROJECT.convex.site`).
4. In the dashboard: **Settings → Environment Variables → Add New Variable** and add
   every key from section 3.
5. Deploy the backend (once): `npx convex deploy` — pushes the schema + all functions.
   Or, on Vercel, install the **Convex integration** from the Vercel marketplace — it
   injects `CONVEX_DEPLOY_KEY` and deploys the backend automatically on every build.
6. Frontend build needs `VITE_CONVEX_URL=https://YOUR-PROJECT.convex.cloud` — set it in
   your hosting platform's environment variables.

### Step 2 — Resend (email automation, 3,000 free emails/month)
1. Sign up at [resend.com](https://resend.com).
2. **API Keys → Create API Key** → copy the `re_…` key → set as `RESEND_API_KEY`.
3. (Recommended) **Domains → Add Domain** (e.g. `wolfsociety.gg`) and add the 3 DNS
   records at your registrar (SPF, DKIM, DMARC) — free, ~10 minutes. Until then Resend
   only allows sending to your own sign-up address from `onboarding@resend.dev`.
4. Test: submit the contact form or register — the org mailboxes
   (`wolfsocietygg@yahoo.com`, `deepanshumurmu0@gmail.com`) receive the alert, and the
   outbox in The Den shows `sent`.

### Step 3 — Vonage (SMS, free trial credit)
1. Sign up at [dashboard.vonage.com](https://dashboard.vonage.com) → SMS API.
2. Copy **API key** and **API secret** → set as `VONAGE_API_KEY`, `VONAGE_API_SECRET`.
3. Add a small credit balance (their pay-as-you-go trial credit) so trial SMS can send.
4. Set `SMS_FROM` (e.g. `WOLFSOCIETY`) and optionally your country code default.
5. Test: grant an access request — the applicant receives credentials by SMS, and the
   outbox records it.

### Step 4 — Stripe (donations + tryout fees, no monthly fee)
1. Sign up at [stripe.com](https://stripe.com) → Developers → API keys.
2. Copy the **Secret key** (`sk_live_…`) → set as `STRIPE_SECRET_KEY`.
3. **Webhooks → Add endpoint** → URL: `https://YOUR-PROJECT.convex.site/stripe-webhook`
   (your Convex **Site URL** + `/stripe-webhook`) → select the
   `checkout.session.completed` event → copy the **Webhook signing secret**
   (`whsec_…`) → set as `STRIPE_WEBHOOK_SECRET`.
4. Test: donate on `/donate` — pay with Stripe's test card `4242 4242 4242 4242`, and
   the donation flips to `paid` in The Den instantly (webhook confirmed).

### Step 5 — Discord (realtime notifications, free)
1. In your Discord server: channel → **Settings → Integrations → Webhooks → New
   Webhook** → copy the URL.
2. Set it as `DISCORD_WEBHOOK_URL`.
3. Test: post an announcement — it appears in the Discord channel immediately.

### Step 6 — Site URL
1. Set `SITE_URL` to your real domain (e.g. `https://wolfsocietygg.vercel.app`).
2. Every email button, SMS link and Stripe success redirect uses this address.

---

## 5. Verifying everything is live

1. **The Den → Overview** shows the **Live sync** badge, a **Live data hub** with all
   16 data sources, and a **Live activity feed** that streams registrations, matches,
   donations, tryouts, inquiries, broadcasts, security events and deliveries.
2. **Connected services** panel shows every integration as `Connected` once its key is
   set.
3. **Notification delivery** panel shows each email/SMS/Discord send with a live status.
4. Open the public site in a second tab, make an edit in The Den, and watch the public
   page update with no refresh — that is the realtime loop working.

---

## 6. Data flows per feature (for reference)

| Action | Database write | Live effect | Notifications |
|---|---|---|---|
| Player registers | `players` (pending) | Den pending count + feed | Email alert to org mailboxes |
| Admin approves player | `players` (active) | Public roster + player dashboard | — |
| Player logs performance | `performanceEntries` | Den charts + K/D leaderboard | — |
| Admin records match | `matches` (score/status) | Public schedule + bracket | — |
| Admin posts announcement | `announcements` | Player + public feeds | Email + SMS + Discord broadcast |
| Admin publishes article | `content` | Public news updates | — |
| Visitor sends inquiry | `contactMessages` | Den inquiries (unread count) | Email alert to org |
| Visitor donates | `donations` → Stripe → webhook | Den donations (paid) | Email receipt + Discord |
| Visitor applies tryout | `tryouts` (+ Stripe if paid) | Den tryouts (pending) | Email alert + Discord |
| Manager grants access | `accessRequests` | New manager login (ID + password) | Credentials by email + SMS |
| Blocked access attempt | `securityLogs` | Den security audit trail | Email alert to org |
| Public page visit | `pageviews` | Den analytics (today/total) | — |

---

## 7. Legacy: VLY integration (Freebuff-only)

The `@vly-ai/integrations` package and `VLY_INTEGRATION_KEY` / `VLY_INTEGRATION_BASE_URL`
environment variables are Freebuff's built-in gateway for AI, email and payments. They
are only relevant while hosting on Freebuff; after moving to GitHub + Vercel with your
own Convex project, prefer the direct integrations above.
