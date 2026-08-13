import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./guards";
import { ROLES } from "./schema";

/** How many users hold a management role. Lets the frontend show the founder-claim flow. */
export const countAdmins = query({
  args: {},
  handler: async (ctx) => {
    const admins = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(q.eq(q.field("role"), ROLES.ADMIN), q.eq(q.field("role"), ROLES.SUPER_ADMIN)),
      )
      .collect();
    return admins.length;
  },
});

/**
 * Grants the caller admin access when allowed:
 *  - the caller is listed in the ADMIN_EMAILS env var, or
 *  - no admin exists in the system yet (founder claim).
 */
export const claimAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (user.role === ROLES.ADMIN) {
      return { claimed: true, alreadyAdmin: true };
    }
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), ROLES.ADMIN))
      .collect();
    const inAllowlist = adminEmails.includes((user.email ?? "").toLowerCase());
    if (inAllowlist || admins.length === 0) {
      await ctx.db.patch(user._id, { role: ROLES.ADMIN });
      return { claimed: true, alreadyAdmin: false };
    }
    throw new ConvexError({
      message:
        "Admin access is already claimed. Ask your organization administrator to promote you.",
    });
  },
});

/** Admin-only: promote a user to admin or demote them back to player. */
export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal(ROLES.ADMIN), v.literal(ROLES.PLAYER)),
  },
  handler: async (ctx, { userId, role }) => {
    const admin = await requireAdmin(ctx);
    if (admin._id === userId) {
      throw new ConvexError({ message: "You cannot change your own role." });
    }
    await ctx.db.patch(userId, { role });
  },
});

/** Admin-only: list every auth user with a management role, for role management. */
export const listAdmins = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("users")
      .filter((q) =>
        q.or(q.eq(q.field("role"), ROLES.ADMIN), q.eq(q.field("role"), ROLES.SUPER_ADMIN)),
      )
      .collect();
  },
});

/** Admin-only: realtime status of every connected integration (email, SMS, Discord, payments). */
export const getIntegrationStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return {
      email: {
        configured: !!process.env.RESEND_API_KEY,
        keys: ["RESEND_API_KEY"],
      },
      sms: {
        configured: !!(process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET),
        keys: ["VONAGE_API_KEY", "VONAGE_API_SECRET"],
      },
      discord: {
        configured: !!process.env.DISCORD_WEBHOOK_URL,
        keys: ["DISCORD_WEBHOOK_URL"],
      },
      payments: {
        configured: !!process.env.STRIPE_SECRET_KEY,
        keys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
      },
      siteUrl: {
        configured: !!process.env.SITE_URL,
        keys: ["SITE_URL"],
      },
      automation: {
        configured: !!process.env.HUGINN_WEBHOOK_URL,
        keys: ["HUGINN_WEBHOOK_URL", "HUGINN_CHAT_WEBHOOK_URL", "HUGINN_WEBHOOK_SECRET"],
      },
    };
  },
});

/** Admin-only: read the organization settings table. */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("settings").collect();
    const out: Record<string, string> = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  },
});

/** Admin-only: upsert organization settings (stream channels, tryout fee, socials…). */
export const updateSettings = mutation({
  args: { settings: v.record(v.string(), v.string()) },
  handler: async (ctx, { settings }) => {
    await requireAdmin(ctx);
    for (const [key, value] of Object.entries(settings)) {
      const clean = value.trim();
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, { value: clean });
      } else {
        await ctx.db.insert("settings", { key, value: clean });
      }
    }
    return { ok: true };
  },
});
