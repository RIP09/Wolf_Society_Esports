"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import webpush from "web-push";

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
 * the subscription via account.savePushSubscription; this action sends to all
 * of them and prunes dead devices.
 */
export const sendBroadcast = action({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
  },
  handler: async (ctx, { title, body, url }) => {
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
      return { ok: false, configured: true, sent: 0 };
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
    try {
      await ctx.runMutation(internal.notify.recordNotification, {
        channel: "webhook",
        subject: "push.broadcast",
        status: sent > 0 ? "sent" : "failed",
        error: sent === 0 ? "no push subscribers delivered" : undefined,
      });
    } catch {
      // the outbox must never break the broadcast
    }
    return { ok: true, configured: true, sent };
  },
});
