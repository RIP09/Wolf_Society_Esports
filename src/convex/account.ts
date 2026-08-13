import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./guards";
import { enforceRateLimit } from "./rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public account hub: identity + alert subscription + notification status. */
export const getMyAccount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    let subscriber = null;
    if (user.email) {
      subscriber = await ctx.db
        .query("subscribers")
        .withIndex("by_email", (q) => q.eq("email", user.email!.toLowerCase()))
        .first();
    }
    if (!subscriber && user._id) {
      const byUser = await ctx.db
        .query("subscribers")
        .filter((q) => q.eq(q.field("userId"), user._id))
        .first();
      if (byUser) subscriber = byUser;
    }
    return {
      email: user.email ?? null,
      name: user.name ?? null,
      isAnonymous: !!user.isAnonymous,
      emailVerified: !!user.emailVerificationTime,
      subscriber: subscriber
        ? {
            email: subscriber.email,
            phone: subscriber.phone ?? null,
            active: subscriber.active,
          }
        : null,
    };
  },
});

/** The signed-in user's recent notification history (email/SMS/push deliveries). */
export const getMyNotifications = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (!user.email) return [];
    const email = user.email.toLowerCase();
    const rows = await ctx.db.query("notifications").order("desc").take(200);
    return rows
      .filter((n) => n.recipient?.toLowerCase() === email)
      .slice(0, 20)
      .map((n) => ({
        _id: n._id,
        channel: n.channel,
        subject: n.subject ?? "",
        status: n.status,
        error: n.error ?? undefined,
        createdAt: n.createdAt,
      }));
  },
});

/** Signed-in users can manage their email/SMS alert subscription here. */
export const upsertAlertSubscription = mutation({
  args: {
    email: v.string(),
    phone: v.optional(v.string()),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const email = args.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      throw new ConvexError({ message: "Please enter a valid email address." });
    }
    const phone = args.phone?.trim() || undefined;
    if (phone && phone.length < 7) {
      throw new ConvexError({ message: "Please enter a valid contact number." });
    }
    await enforceRateLimit(ctx, `alert:${email}`, 5, 60 * 60 * 1000);

    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        active: args.active === undefined ? true : args.active,
        phone: phone ?? existing.phone,
        userId: existing.userId ?? user._id,
      });
      return { ok: true, id: existing._id };
    }
    const id = await ctx.db.insert("subscribers", {
      name: user.name ?? undefined,
      email,
      phone,
      active: args.active === undefined ? true : args.active,
      userId: user._id,
      createdAt: Date.now(),
    });
    return { ok: true, id };
  },
});

/** Unsubscribe from all email/SMS alerts. */
export const unsubscribeAlerts = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const row = await ctx.db
      .query("subscribers")
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    if (row) await ctx.db.patch(row._id, { active: false });
    return { ok: true };
  },
});

/** Device-level web-push subscription (anonymous visitor id, no account needed). */
export const savePushSubscription = mutation({
  args: {
    endpoint: v.string(),
    keysJson: v.string(),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, { endpoint, keysJson, visitorId }) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        keysJson,
        visitorId: visitorId ?? existing.visitorId,
      });
      return { ok: true, id: existing._id };
    }
    const id = await ctx.db.insert("pushSubscriptions", {
      endpoint,
      keysJson,
      visitorId,
      createdAt: Date.now(),
    });
    return { ok: true, id };
  },
});

/** Remove this device's push subscription (user toggled it off). */
export const removePushSubscription = mutation({
  args: { endpoint: v.string() },
  handler: async (ctx, { endpoint }) => {
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
      .first();
    if (existing) await ctx.db.delete(existing._id);
    return { ok: true };
  },
});

/** Internal: all device subscriptions (used by the push broadcast action). */
export const listPushSubscriptions = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("pushSubscriptions").collect();
  },
});

/** Internal: prune dead devices after a broadcast. */
export const deletePushSubscriptions = internalMutation({
  args: { ids: v.array(v.id("pushSubscriptions")) },
  handler: async (ctx, { ids }) => {
    for (const id of ids) await ctx.db.delete(id);
    return { ok: true };
  },
});

/** Public feedback / suggestion box — lands in The Den, rate limited. */
export const submitFeedback = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    rating: v.optional(v.number()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const message = args.message.trim();
    if (message.length < 5) {
      throw new ConvexError({ message: "Please write a little more (at least 5 characters)." });
    }
    if (message.length > 2000) {
      throw new ConvexError({ message: "Feedback is too long (max 2000 characters)." });
    }
    const email = args.email?.trim().toLowerCase();
    if (email && !EMAIL_RE.test(email)) {
      throw new ConvexError({ message: "Please enter a valid email address." });
    }
    await enforceRateLimit(ctx, `feedback:${email ?? "anon"}`, 10, 60 * 60 * 1000);
    const id = await ctx.db.insert("feedback", {
      name: args.name?.trim() || undefined,
      email,
      rating: args.rating,
      message,
      status: "new",
      createdAt: Date.now(),
    });
    return { ok: true, id };
  },
});

/** Admin: latest feedback, newest first. */
export const listFeedback = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("feedback").order("desc").take(50);
  },
});

/** Admin: mark a feedback item as read. */
export const markFeedbackRead = mutation({
  args: { feedbackId: v.id("feedback") },
  handler: async (ctx, { feedbackId }) => {
    await requireAdmin(ctx);
    await ctx.db.patch(feedbackId, { status: "read" });
    return { ok: true };
  },
});
