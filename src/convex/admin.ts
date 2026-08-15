import { ConvexError, v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./guards";
import { ROLES } from "./schema";

/** Internal: role of a single user. Lets actions (which can't touch db directly) gate admin access. */
export const getRoleForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user?.role ?? null;
  },
});

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

/** Admin-only: realtime status of every connected integration (email, SMS, Discord, payments, AI).
 * Only returns CONNECTED / NOT CONNECTED booleans — never the secrets themselves. */
export const getIntegrationStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return {
      email: {
        label: "Email delivery (Resend)",
        purpose: "Sends OTP codes, contact replies, registration & attendance alerts.",
        configured: !!process.env.RESEND_API_KEY,
        keys: ["RESEND_API_KEY"],
      },
      sms: {
        label: "SMS alerts (Vonage)",
        purpose: "Fires an SMS to the org phone the moment a contact form is submitted.",
        configured: !!(process.env.VONAGE_API_KEY && process.env.VONAGE_API_SECRET),
        keys: ["VONAGE_API_KEY", "VONAGE_API_SECRET", "SMS_FROM"],
      },
      push: {
        label: "Web push notifications (VAPID)",
        purpose: "Free push alerts to every visitor who allows notifications.",
        configured: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT),
        keys: ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"],
      },
      discord: {
        label: "Discord alerts",
        purpose: "Posts registrations, inquiries, reports and absences into your server.",
        configured: !!process.env.DISCORD_WEBHOOK_URL,
        keys: ["DISCORD_WEBHOOK_URL"],
      },
      payments: {
        label: "Payments (Stripe)",
        purpose: "Processes donations and paid tryout fees.",
        configured: !!process.env.STRIPE_SECRET_KEY,
        keys: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
      },
      automation: {
        label: "AI automation (Huginn)",
        purpose: "Powers the AI assistant chat and coaching replies.",
        configured: !!(process.env.HUGINN_WEBHOOK_URL && process.env.HUGINN_CHAT_WEBHOOK_URL),
        keys: ["HUGINN_WEBHOOK_URL", "HUGINN_CHAT_WEBHOOK_URL", "HUGINN_WEBHOOK_SECRET"],
      },
      admin: {
        label: "Admin allowlist",
        purpose: "Comma-separated emails allowed to claim admin on first sign-in.",
        configured: !!process.env.ADMIN_EMAILS,
        keys: ["ADMIN_EMAILS"],
      },
      siteUrl: {
        label: "Site URL",
        purpose: "Public URL used inside email buttons.",
        configured: !!process.env.SITE_URL,
        keys: ["SITE_URL"],
      },
    };
  },
});

/** Public: Android app download links configured by management. Used by the homepage install flow. */
export const getAppLinks = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("settings").collect();
    const get = (k: string) => rows.find((r) => r.key === k)?.value?.trim() ?? "";
    return {
      pack: get("apkPack"),
      den: get("apkDen"),
      coach: get("apkCoach"),
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
