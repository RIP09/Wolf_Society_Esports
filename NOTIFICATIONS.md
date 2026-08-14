# Notifications — What to Set Up (Free Tools)

When the organization publishes an announcement/news update, **every opted-in
user gets notified automatically** through every channel they allowed. Nothing
here is simulated — each channel is a real integration.

## How it reaches your users (all free / freemium)

| Channel | Setup keys | Cost | Reaches users even when the site is closed? |
|---|---|---|---|
| **Web push (VAPID)** | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `VITE_VAPID_PUBLIC_KEY` | **Free forever, unlimited** | ✅ Yes |
| **Browser notifications** | none (built-in) | Free | ❌ Only while the tab is open |
| **Email alerts** | `RESEND_API_KEY` | Resend free tier: 100/day, 3,000/month | ✅ Yes |
| **SMS alerts** | `VONAGE_API_KEY`, `VONAGE_API_SECRET` | Pay-per-message (no true free tier) | ✅ Yes |
| **Discord** | `DISCORD_WEBHOOK_URL` | Free | ✅ Yes |

> **Honest note:** web push is the only channel that is truly *unlimited* at
> $0 — the browser vendors (Google/Apple/Mozilla) run the delivery network.
> Email and SMS are limited by their free tiers (email: 100/day on Resend's
> free plan; SMS always costs a tiny amount per message on Vonage). Every
> message the org actually sends is tracked live in **The Den → Automations**.

## Step 1 — Enable web push (free, unlimited, recommended)

Run this **once** on your computer to generate a VAPID key pair:

```
npx web-push generate-vapid-keys
```

It prints a `Public Key` and a `Private Key`. Then paste into the **Keys tab**
(and as Vercel env vars, same names):

| Key | Value |
|---|---|
| `VAPID_PUBLIC_KEY` | the Public Key |
| `VAPID_PRIVATE_KEY` | the Private Key |
| `VAPID_SUBJECT` | `mailto:you@example.com` (any address) |
| `VITE_VAPID_PUBLIC_KEY` | the Public Key again (this one is read by the browser) |

That's it. The site ships with `public/sw.js` (service worker) already wired —
visitors who click **Allow** on the Alerts panel (or the Account page) subscribe
automatically, and every new announcement is pushed to them instantly.

## Step 2 — The other channels (already integrated)

- **Email** — paste `RESEND_API_KEY` (Keys tab). Resend's free plan is plenty
  for alerts; upgrade only if you exceed 100/day.
- **SMS** — paste `VONAGE_API_KEY` + `VONAGE_API_SECRET`. Works with the
  worldwide country-code phone picker on the registration form.
- **Discord** — paste `DISCORD_WEBHOOK_URL` to mirror announcements into your
  server's #announcements channel.
- **Huginn automations** — see `HUGINN_SETUP.md` for the free workflow hub.

## Where users opt in

1. **Alerts panel** (floating, bottom-right of every public page) — browser
   notifications + always-on web push + camera/mic/location.
2. **Subscribe form** (footer) — email + phone for SMS/email alerts.
3. **My Account** (`/account`) — signed-in users can manage email/phone alerts,
   toggle push per device, leave feedback, and see their delivery history.

## What fires, and when

The moment The Den publishes an announcement:

1. **Web push** → every subscribed device (free, unlimited)
2. **Email** → every alert subscriber
3. **SMS** → every alert subscriber with a phone number
4. **Discord** → the org's server
5. **Browser notification** → anyone currently on the site with the tab open
6. **Huginn webhook** → your automation workflows (`announcement.published`)

All deliveries are recorded in the **notification outbox** and visible in
**The Den → Automations** in real time.
