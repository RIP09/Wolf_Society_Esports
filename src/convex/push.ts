"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import webpush from "web-push";
import { ADMIN_ROLES } from "./guards";

/**
 * Free + unlimited push notifications (Web Push / VAPID). Browsers deliver the
 * push through their own infrastructure (FCM/APNs) at no cost — the only setup
 * is a one-time VAPID key pair:
 *
 *   npx web-push generate-vapid-keys
 *
 * then paste into the Keys tab / Vercel env:
 *   VAPID_PUBLIC_KEY    (also exposed to the browser as VITE_VAPID_PUBLIC_KEY)
 *   VAPID_PRIVATE_KEY
 *   VAPID_SUBJECT       (optional mailto: address, e.g. mailto:admin@wolfsociety.com)
 *
 * The browser subscribes through the service worker (public/sw.js) and stores
 * the subscription via account.savePushSubscription; the broadcast actions send
 * to all of them and prune dead devices.
 */

type PushResult = { ok: boolean; configured: boolean; sent: number };

/** Sends a push payload to every opted-in device and prunes dead subscriptions. */
async function sendPushToAll(
  ctx: { runQuery: any; runMutation: any },
  title: string,
  body: string,
  url?: string,
): Promise<PushResult> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return { ok: false, configured: false, sent: 0 };
  }
  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:admin@wolfsocietyesports.com",
      publicKey,
      privateKey,
    );
  } catch {
    return { ok: true, configured: true, sent: 0 };
  }

  const subs = await ctx.runQuery(internal.account.listPushSubscriptions, {});
  const site = process.env.SITE_URL ?? "https://wolfsocietygg.vercel.app";
  const payload = JSON.stringify({
    title: title.slice(0, 100),
    body: body.slice(0, 300),
    url: url ?? `${site}/news`,
  });

  let sent = 0;
  const dead: Id<"pushSubscriptions">[] = [];
  for (const sub of subs) {
    let keys: Record<string, string> = {};
    try {
      keys = JSON.parse(sub.keysJson);
    } catch {
      dead.push(sub._id);
      continue;
    }
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys },
        payload,
      );
      sent++;
    } catch (error) {
      const status = (error as { statusCode?: number })?.statusCode;
      if (status === 404 || status === 410) dead.push(sub._id); // device gone
    }
  }

  if (dead.length > 0) {
    await ctx.runMutation(internal.account.deletePushSubscriptions, { ids: dead });
  }
  return { ok: true, configured: true, sent };
}

/**
 * Push-only broadcast used by internal automation (e.g. when an announcement is
 * published). Public by design — the actual admin panel uses `adminBroadcast`,
 * which also reaches email + SMS subscribers and records history.
 */
export const sendBroadcast = action({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, { title, body, url }) => {
    const result = await sendPushToAll(ctx, title, body, url);
    try {
      await ctx.runMutation(internal.notify.recordNotification, {
        channel: "webhook",
        subject: "push.broadcast",
        status: result.sent > 0 ? "sent" : "failed",
        error: result.sent === 0 ? "no push subscribers delivered" : undefined,
      });
    } catch {
      // the outbox must never break the broadcast
    }
    return result;
  },
});

/**
 * Admin-only push self-test — sends a test notification to every opted-in
 * device so The Den → Automations can prove the (free) VAPID pipeline works.
 */
export const testPush = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { ok: false, configured: false, message: "Sign in to The Den first.", sent: 0 };
    }
    const role = await ctx.runQuery(internal.admin.getRoleForUser, {
      userId: identity.subject as Id<"users">,
    });
    if (!ADMIN_ROLES.has(role ?? "")) {
      return { ok: false, configured: false, message: "Only management can run integration tests.", sent: 0 };
    }
    const res = await sendPushToAll(
      ctx,
      "Wolf Society Esports — test",
      "Your web push connection is live! This is a test from the Automation Center.",
      `${process.env.SITE_URL ?? "https://wolfsocietygg.vercel.app"}/news`,
    );
    if (!res.configured) {
      return { ok: false, configured: false, message: "Add the VAPID keys in the Keys tab first.", sent: 0 };
    }
    return {
      ok: true,
      configured: true,
      sent: res.sent,
      message: res.sent > 0 ? `Test push delivered to ${res.sent} device(s).` : "No devices subscribed yet — open the site and allow notifications.",
    };
  },
});

/**
 * The Den → Broadcast Center. Admin-only, multi-channel:
 *   push — instant browser notification to every opted-in device (free/unlimited)
 *   email — the same message emailed to every active alert subscriber
 *   sms   — the same message texted to every subscriber with a phone on file
 * Every send is recorded in the `broadcasts` history table.
 */
export const adminBroadcast = action({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    channels: v.optional(
      v.array(v.union(v.literal("push"), v.literal("email"), v.literal("sms"))),
    ),
  },
  handler: async (ctx, { title, body, url, channels }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { ok: false, error: "You must be signed in to broadcast." };
    }
    const role = await ctx.runQuery(internal.admin.getRoleForUser, {
      userId: identity.subject as Id<"users">,
    });
    if (!ADMIN_ROLES.has(role ?? "")) {
      return { ok: false, error: "Only management can broadcast to the community." };
    }

    const chosen = channels && channels.length > 0 ? channels : ["push"];
    let pushSent = 0;
    let emailSent = 0;
    let smsSent = 0;

    if (chosen.includes("push")) {
      const res = await sendPushToAll(ctx, title, body, url);
      pushSent = res.sent;
      try {
        await ctx.runMutation(internal.notify.recordNotification, {
          channel: "webhook",
          subject: `push.broadcast: ${title.slice(0, 60)}`,
          status: pushSent > 0 ? "sent" : "failed",
          error: pushSent === 0 ? "no push subscribers delivered" : undefined,
        });
      } catch {
        // the outbox must never break the broadcast
      }
    }

    if (chosen.includes("email") || chosen.includes("sms")) {
      const subs = await ctx.runQuery(internal.account.listActiveSubscribers, {});
      if (subs.length > 0) {
        const res = await ctx.runAction(api.notify.broadcast, {
          title,
          body,
          subscribers: subs.map((s) => ({
            name: s.name,
            email: s.email,
            phone: s.phone,
          })),
        });
        emailSent = res.emailSent;
        smsSent = res.smsSent;
      }
    }

    await ctx.runMutation(internal.broadcast.logBroadcast, {
      title: title.slice(0, 140),
      body: body.slice(0, 500),
      url,
      channels: chosen,
      pushSent,
      emailSent,
      smsSent,
      createdBy: identity.subject as Id<"users">,
    });

    return { ok: true, pushSent, emailSent, smsSent, channels: chosen };
  },
});
