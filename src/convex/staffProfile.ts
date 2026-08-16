import { ConvexError, v } from "convex/values";
import {
  modifyAccountCredentials,
  retrieveAccount,
} from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { hasAdminRole, requireAdmin } from "./guards";
import { enforceRateLimit } from "./rateLimit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Internal: the management role state of a user (actions can't read the db).
 */
export const isAdminUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    return user ? hasAdminRole(user.role) : false;
  },
});

/** Internal: the staff member's password login ID (WSE-001, WSE, …). */
export const getPasswordLoginId = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId).eq("provider", "password"),
      )
      .first();
    return account?.providerAccountId ?? null;
  },
});

/** Internal: audit helper — NEVER accepts or stores password values. */
export const logStaffEvent = internalMutation({
  args: {
    userId: v.id("users"),
    email: v.optional(v.string()),
    reason: v.string(),
  },
  handler: async (ctx, { userId, email, reason }) => {
    await ctx.db.insert("securityLogs", {
      userId,
      email,
      reason,
      createdAt: Date.now(),
    });
  },
});

/**
 * The signed-in staff member's own profile:
 * identity (User ID is org-given and shown read-only), role, and the private
 * details they maintain. Only they and the Super Admin can ever see these.
 */
export const myStaffProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAdmin(ctx);
    const profile = await ctx.db
      .query("staffProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", user._id).eq("provider", "password"),
      )
      .first();
    return {
      userId: user._id,
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.role,
      loginId: account?.providerAccountId ?? null,
      profile: profile
        ? {
            phone: profile.phone ?? "",
            title: profile.title ?? "",
            location: profile.location ?? "",
            timezone: profile.timezone ?? "",
            discord: profile.discord ?? "",
            gameFocus: profile.gameFocus ?? "",
            bio: profile.bio ?? "",
            socials: profile.socials ?? "",
            updatedAt: profile.updatedAt,
          }
        : null,
    };
  },
});

/**
 * Staff member updates their own details. The User ID is organisation-given
 * and can never change; the email CAN change (uniqueness enforced). Everything
 * is private — visible only to the owner and the Super Admin.
 */
export const updateMyStaffProfile = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    title: v.optional(v.string()),
    location: v.optional(v.string()),
    timezone: v.optional(v.string()),
    discord: v.optional(v.string()),
    gameFocus: v.optional(v.string()),
    bio: v.optional(v.string()),
    socials: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    await enforceRateLimit(ctx, `staff-profile:${user._id}`, 20, 60 * 60 * 1000);

    const changed: string[] = [];

    const name = args.name?.trim();
    if (name !== undefined) {
      if (name.length < 2) {
        throw new ConvexError({ message: "Name must be at least 2 characters." });
      }
      if (name !== user.name) {
        await ctx.db.patch(user._id, { name });
        changed.push("name");
      }
    }

    const email = args.email?.trim().toLowerCase();
    if (email !== undefined && email !== user.email) {
      if (!EMAIL_RE.test(email)) {
        throw new ConvexError({ message: "Please enter a valid email address." });
      }
      const taken = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", email))
        .first();
      if (taken && taken._id !== user._id) {
        throw new ConvexError({
          message: "That email is already used by another account.",
        });
      }
      await ctx.db.patch(user._id, { email });
      changed.push("email");
    }

    const data = {
      phone: args.phone?.trim() || undefined,
      title: args.title?.trim() || undefined,
      location: args.location?.trim() || undefined,
      timezone: args.timezone?.trim() || undefined,
      discord: args.discord?.trim() || undefined,
      gameFocus: args.gameFocus?.trim() || undefined,
      bio: args.bio?.trim() || undefined,
      socials: args.socials?.trim() || undefined,
    };
    for (const key of Object.keys(data) as (keyof typeof data)[]) {
      const value = data[key];
      if (value && value.length > 500) {
        throw new ConvexError({ message: `Field "${key}" is too long (max 500 characters).` });
      }
    }

    const existing = await ctx.db
      .query("staffProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { ...data, updatedAt: Date.now() });
    } else {
      await ctx.db.insert("staffProfiles", {
        userId: user._id,
        ...data,
        updatedAt: Date.now(),
      });
    }

    // Audit the edit WITHOUT any sensitive values — no passwords ever.
    await ctx.db.insert("securityLogs", {
      userId: user._id,
      email: user.email ?? undefined,
      reason: `Staff member updated their own profile${changed.length ? ` (fields: ${changed.join(", ")})` : " (details)"}`,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/**
 * Staff member changes their own login password.
 *
 * Security guarantees:
 *  - The CURRENT password is verified server-side against the stored hash
 *    (retrieveAccount throws on mismatch) — a stolen open session can't set a
 *    new password without knowing the old one.
 *  - The password itself is stored only by the auth provider (hashed). It is
 *    NEVER written to the security log, outbox, notifications, or any table —
 *    the log only records that a change happened.
 */
export const changeMyPassword = action({
  args: {
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, { currentPassword, newPassword }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "You must be signed in to change your password." });
    }
    const userId = identity.subject as Id<"users">;
    const isAdmin = await ctx.runQuery(internal.staffProfile.isAdminUser, { userId });
    if (!isAdmin) {
      throw new ConvexError({ message: "Only management staff can use this page." });
    }
    const loginId = await ctx.runQuery(internal.staffProfile.getPasswordLoginId, { userId });
    if (!loginId) {
      throw new ConvexError({
        message: "No password login found for this account — you may have signed in with an email code.",
      });
    }

    if (!currentPassword) {
      throw new ConvexError({ message: "Enter your current password." });
    }
    const fresh = newPassword.trim();
    if (fresh.length < 8) {
      throw new ConvexError({ message: "New password must be at least 8 characters." });
    }
    if (fresh.length > 64) {
      throw new ConvexError({ message: "New password is too long (max 64 characters)." });
    }
    if (fresh === currentPassword) {
      throw new ConvexError({ message: "New password must be different from the current one." });
    }

    // Verify the current password against the stored hash (throws on mismatch).
    try {
      await retrieveAccount(ctx, {
        provider: "password",
        account: { id: loginId, secret: currentPassword },
      });
    } catch {
      throw new ConvexError({ message: "Current password is incorrect." });
    }

    // Apply the new password (stored hashed by the auth provider).
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: loginId, secret: fresh },
    });

    // Audit WITHOUT the password value — never log what the password is.
    await ctx.runMutation(internal.staffProfile.logStaffEvent, {
      userId,
      reason: "Staff member changed their own login password (password not recorded)",
    });
    return { ok: true };
  },
});

/** Internal: Super Admin views one staff member's private profile details. */
export const getStaffProfileForAdmin = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("staffProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    return profile
      ? {
          phone: profile.phone ?? "",
          title: profile.title ?? "",
          location: profile.location ?? "",
          timezone: profile.timezone ?? "",
          discord: profile.discord ?? "",
          gameFocus: profile.gameFocus ?? "",
          bio: profile.bio ?? "",
          socials: profile.socials ?? "",
          updatedAt: profile.updatedAt,
        }
      : null;
  },
});

