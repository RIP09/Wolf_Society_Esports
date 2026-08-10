import { ConvexError, v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { requireAdmin } from "./guards";

/** Public site URL used in Stripe redirects (set SITE_URL in Keys). */
function siteUrl(): string {
  return process.env.SITE_URL ?? "http://localhost:5173";
}

function stripeKey(): string | undefined {
  return process.env.STRIPE_SECRET_KEY;
}

/** Admin-only: every donation, newest first. */
export const listDonations = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("donations").order("desc").take(200);
  },
});

/** Admin-only: every tryout registration, newest first. */
export const listTryouts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("tryouts").order("desc").take(200);
  },
});

/** Admin-only: set a tryout's review status. */
export const setTryoutStatus = mutation({
  args: {
    tryoutId: v.id("tryouts"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, { tryoutId, status }) => {
    await requireAdmin(ctx);
    const tryout = await ctx.db.get(tryoutId);
    if (!tryout) throw new ConvexError({ message: "Tryout not found." });
    await ctx.db.patch(tryoutId, { status });
    return status;
  },
});

/** Public: sign up for a free tryout (no payment). */
export const submitTryout = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    game: v.string(),
    inGameRole: v.optional(v.string()),
    region: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim();
    if (name.length < 2) throw new ConvexError({ message: "Please enter your name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ConvexError({ message: "Please enter a valid email address." });
    }
    const id = await ctx.db.insert("tryouts", {
      name,
      email,
      phone: args.phone?.trim() || undefined,
      game: args.game.trim(),
      inGameRole: args.inGameRole?.trim() || undefined,
      region: args.region?.trim() || undefined,
      note: args.note?.trim() || undefined,
      feeStatus: "none",
      status: "pending",
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.notify.tryoutReceived, {
      name,
      email,
      game: args.game.trim(),
      role: args.inGameRole?.trim() || undefined,
      region: args.region?.trim() || undefined,
      paid: false,
    });
    return { ok: true, id };
  },
});

/** Creates the pending donation row and returns it (used by the checkout action). */
export const recordPendingDonation = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    amount: v.number(),
    currency: v.string(),
    note: v.optional(v.string()),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("donations", {
      name: args.name.trim(),
      email: args.email.trim(),
      amount: args.amount,
      currency: args.currency,
      note: args.note?.trim() || undefined,
      status: "pending",
      stripeSessionId: args.sessionId,
      createdAt: Date.now(),
    });
  },
});

/** Creates the pending tryout row (paid path) and returns it. */
export const recordPendingTryout = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    game: v.string(),
    inGameRole: v.optional(v.string()),
    region: v.optional(v.string()),
    note: v.optional(v.string()),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tryouts", {
      name: args.name.trim(),
      email: args.email.trim(),
      phone: args.phone?.trim() || undefined,
      game: args.game.trim(),
      inGameRole: args.inGameRole?.trim() || undefined,
      region: args.region?.trim() || undefined,
      note: args.note?.trim() || undefined,
      feeStatus: "pending",
      status: "pending",
      stripeSessionId: args.sessionId,
      createdAt: Date.now(),
    });
  },
});

/** Internal (webhook): find a donation by its Stripe session id. */
export const findDonationBySession = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("donations")
      .withIndex("by_session", (q) => q.eq("stripeSessionId", sessionId))
      .first();
  },
});

/** Internal (webhook): find a tryout by its Stripe session id. */
export const findTryoutBySession = internalQuery({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return await ctx.db
      .query("tryouts")
      .withIndex("by_session", (q) => q.eq("stripeSessionId", sessionId))
      .first();
  },
});

/** Internal (webhook): mark a donation paid and notify the org. */
export const confirmDonation = internalMutation({
  args: {
    donationId: v.id("donations"),
    amount: v.number(),
    currency: v.string(),
  },
  handler: async (ctx, { donationId, amount, currency }) => {
    const donation = await ctx.db.get(donationId);
    if (!donation) return { ok: false };
    await ctx.db.patch(donationId, { status: "paid" });
    await ctx.scheduler.runAfter(0, api.notify.paymentReceived, {
      name: donation.name,
      email: donation.email,
      amount,
      currency,
    });
    return { ok: true };
  },
});

/** Internal (webhook): mark a tryout fee paid and notify the org. */
export const confirmTryout = internalMutation({
  args: { tryoutId: v.id("tryouts") },
  handler: async (ctx, { tryoutId }) => {
    const tryout = await ctx.db.get(tryoutId);
    if (!tryout) return { ok: false };
    await ctx.db.patch(tryoutId, { feeStatus: "paid" });
    await ctx.scheduler.runAfter(0, api.notify.tryoutReceived, {
      name: tryout.name,
      email: tryout.email,
      game: tryout.game,
      role: tryout.inGameRole || undefined,
      region: tryout.region || undefined,
      paid: true,
    });
    return { ok: true };
  },
});

/** Creates a Stripe Checkout Session for a donation. Returns the redirect URL. */
export const createDonationCheckout = action({
  args: {
    name: v.string(),
    email: v.string(),
    amount: v.number(), // in minor units (paise)
    currency: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const key = stripeKey();
    if (!key) {
      return { ok: false, configured: false, url: null, message: "Payments are not configured yet — contact the organization directly." };
    }
    const currency = args.currency ?? "inr";
    const amount = Math.max(100, Math.round(args.amount)); // minimum 1 unit

    // 1) Create the pending donation row first (so the webhook can find it).
    //    We need its id for the checkout session metadata.
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][price_data][currency]": currency,
      "line_items[0][price_data][unit_amount]": String(amount),
      "line_items[0][price_data][product_data][name]": "Donation — Wolf Society Esports",
      "line_items[0][quantity]": "1",
      success_url: `${siteUrl()}/donate/success`,
      cancel_url: `${siteUrl()}/donate`,
    });
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!res.ok || !data.id || !data.url) {
      return { ok: false, configured: true, url: null, message: data.error?.message ?? "Could not start the checkout." };
    }
    await ctx.runMutation(api.payments.recordPendingDonation, {
      name: args.name,
      email: args.email,
      amount,
      currency,
      note: args.note,
      sessionId: data.id,
    });
    return { ok: true, configured: true, url: data.url };
  },
});

/** Creates a Stripe Checkout Session for a paid tryout. Returns the redirect URL. */
export const createTryoutCheckout = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    game: v.string(),
    inGameRole: v.optional(v.string()),
    region: v.optional(v.string()),
    note: v.optional(v.string()),
    fee: v.number(), // in minor units (paise)
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const key = stripeKey();
    if (!key) {
      return { ok: false, configured: false, url: null, message: "Payments are not configured yet — submit a free tryout instead." };
    }
    const currency = args.currency ?? "inr";
    const fee = Math.max(100, Math.round(args.fee));
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][price_data][currency]": currency,
      "line_items[0][price_data][unit_amount]": String(fee),
      "line_items[0][price_data][product_data][name]": "Tryout fee — Wolf Society Esports",
      "line_items[0][quantity]": "1",
      success_url: `${siteUrl()}/tryouts/success`,
      cancel_url: `${siteUrl()}/tryouts`,
    });
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });
    const data = (await res.json()) as { id?: string; url?: string; error?: { message?: string } };
    if (!res.ok || !data.id || !data.url) {
      return { ok: false, configured: true, url: null, message: data.error?.message ?? "Could not start the checkout." };
    }
    await ctx.runMutation(api.payments.recordPendingTryout, {
      name: args.name,
      email: args.email,
      phone: args.phone,
      game: args.game,
      inGameRole: args.inGameRole,
      region: args.region,
      note: args.note,
      sessionId: data.id,
    });
    return { ok: true, configured: true, url: data.url };
  },
});
