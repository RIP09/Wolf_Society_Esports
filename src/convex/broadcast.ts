import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireAdmin } from "./guards";

/** Internal: record one broadcast row for the history feed. */
export const logBroadcast = internalMutation({
  args: {
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    channels: v.array(v.string()),
    pushSent: v.number(),
    emailSent: v.number(),
    smsSent: v.number(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("broadcasts", { ...args, createdAt: Date.now() });
    return { ok: true };
  },
});

/** Admin: live audience size per channel plus whether each pipe is configured. */
export const getBroadcastStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [pushDevices, subscribers] = await Promise.all([
      ctx.db.query("pushSubscriptions").collect(),
      ctx.db
        .query("subscribers")
        .filter((q) => q.eq(q.field("active"), true))
        .collect(),
    ]);
    return {
      pushDevices: pushDevices.length,
      emailSubscribers: subscribers.filter((s) => s.email).length,
      smsSubscribers: subscribers.filter((s) => s.phone).length,
      pushConfigured:
        !!process.env.VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY,
      emailConfigured: !!process.env.RESEND_API_KEY,
      smsConfigured: !!process.env.VONAGE_API_KEY && !!process.env.VONAGE_API_SECRET,
    };
  },
});

/** Admin: broadcast history, newest first. */
export const listBroadcasts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("broadcasts").order("desc").take(50);
  },
});
