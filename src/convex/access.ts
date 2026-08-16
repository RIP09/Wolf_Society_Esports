import { ConvexError, v } from "convex/values";
import { action, internalQuery, mutation, query, type MutationCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { hasAdminRole, requireAdmin, requireSuperAdmin } from "./guards";
import { wipeAuthUser, wipePlayerData } from "./players";
import { ROLES } from "./schema";

/** The built-in super admin credentials (fallback access to the grant page). */
const SUPER_ADMIN_ID = "WSE";
const SUPER_ADMIN_PASSWORD = "WSE@123";

/** The management roles that can be granted through the access page. */
export const MANAGEMENT_ROLES = [
  "Super Admin",
  "Director",
  "General Manager",
  "Team Manager",
  "Operations Manager",
  "Coach",
  "Assistant Coach",
  "Analyst",
  "Data Analyst",
  "Talent Scout",
  "Media & Content Manager",
  "Content Creator",
  "Social Media Manager",
  "Community Manager",
  "Event Manager",
  "Finance Officer",
  "Broadcast Producer",
] as const;
export type ManagementRole = (typeof MANAGEMENT_ROLES)[number];

/** Human-friendly role label → auth role. */
function authRoleFor(grantedRole: string): (typeof ROLES)["SUPER_ADMIN"] | (typeof ROLES)["ADMIN"] {
  return grantedRole === "Super Admin" ? ROLES.SUPER_ADMIN : ROLES.ADMIN;
}

const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
function generatePassword(length = 12): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PASSWORD_ALPHABET[bytes[i] % PASSWORD_ALPHABET.length];
  }
  return out;
}

/** Picks the next free generated User ID (WSE-001, WSE-002, …). */
async function nextUserId(ctx: MutationCtx): Promise<string> {
  let n = 1;
  for (;;) {
    const candidate = `WSE-${String(n).padStart(3, "0")}`;
    const taken = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", candidate),
      )
      .unique();
    if (!taken) return candidate;
    n += 1;
  }
}

/** Internal: does the super admin password account exist? */
export const superAdminExists = internalQuery({
  args: {},
  handler: async (ctx) => {
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", SUPER_ADMIN_ID),
      )
      .unique();
    return account !== null;
  },
});

/**
 * Idempotent bootstrap of the built-in super admin (WSE / WSE@123).
 * Call before a password sign-in attempt so the fallback account always exists.
 */
export const ensureSuperAdmin = action({
  args: {},
  handler: async (ctx) => {
    const exists = await ctx.runQuery(internal.access.superAdminExists);
    if (exists) return { ok: true, created: false };
    const { user } = await createAccount(ctx, {
      provider: "password",
      account: { id: SUPER_ADMIN_ID, secret: SUPER_ADMIN_PASSWORD },
      profile: {
        email: "superadmin@wolfsociety.gg",
        name: "Super Admin",
        role: ROLES.SUPER_ADMIN,
      },
    });
    return { ok: true, created: true, userId: user._id };
  },
});

/**
 * Public: request management portal access. Bot-protected, saved to the
 * database, and the organization is notified by email with a button to the
 * secret grant page.
 */
export const requestAccess = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    requestedRole: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const phone = args.phone.trim();
    const requestedRole = args.requestedRole.trim();
    if (name.length < 2) throw new ConvexError({ message: "Please enter your name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ConvexError({ message: "Please enter a valid email address." });
    }
    if (phone.length < 6) {
      throw new ConvexError({ message: "Please enter a contact number for SMS delivery." });
    }
    if (!requestedRole) throw new ConvexError({ message: "Please choose the role you need." });

    const existing = await ctx.db
      .query("accessRequests")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();
    if (existing) {
      throw new ConvexError({
        message: "You already have a pending request — the organization has been notified.",
      });
    }

    const id = await ctx.db.insert("accessRequests", {
      name,
      email,
      phone,
      requestedRole,
      reason: args.reason?.trim() || undefined,
      status: "pending",
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.notify.accessRequested, {
      name,
      email,
      phone,
      requestedRole,
      reason: args.reason?.trim() || undefined,
    });
    return { ok: true, id };
  },
});

/** Admin-only: all access requests, newest first. */
export const listRequests = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("accessRequests").order("desc").take(200);
  },
});

/** Admin-only: grant a pending request — generates credentials and provisions the account. */
export const grantAccess = mutation({
  args: {
    requestId: v.id("accessRequests"),
    role: v.string(),
  },
  handler: async (ctx, { requestId, role }) => {
    await requireAdmin(ctx);
    const request = await ctx.db.get(requestId);
    if (!request || request.status !== "pending") {
      throw new ConvexError({ message: "Request not found or already handled." });
    }
    const userId = await nextUserId(ctx);
    const password = generatePassword();
    await ctx.db.patch(requestId, {
      status: "granted",
      grantedUserId: userId,
      grantedRole: role,
      grantedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.access.provisionAccount, {
      userId,
      password,
      role,
      name: request.name,
      email: request.email,
      phone: request.phone,
    });
    return { ok: true, userId };
  },
});

/** Admin-only: decline a pending request and notify the applicant. */
export const rejectAccess = mutation({
  args: { requestId: v.id("accessRequests") },
  handler: async (ctx, { requestId }) => {
    await requireAdmin(ctx);
    const request = await ctx.db.get(requestId);
    if (!request || request.status !== "pending") {
      throw new ConvexError({ message: "Request not found or already handled." });
    }
    await ctx.db.patch(requestId, { status: "rejected" });
    await ctx.scheduler.runAfter(0, api.notify.accessRejected, {
      name: request.name,
      email: request.email,
    });
    return { ok: true };
  },
});

/** Admin-only: issue fresh credentials for an already-granted request (lost password). */
export const resendCredentials = mutation({
  args: { requestId: v.id("accessRequests") },
  handler: async (ctx, { requestId }) => {
    await requireAdmin(ctx);
    const request = await ctx.db.get(requestId);
    if (!request || request.status !== "granted" || !request.grantedUserId) {
      throw new ConvexError({ message: "No granted request found for these credentials." });
    }
    const password = generatePassword();
    await ctx.scheduler.runAfter(0, api.access.resetCredentials, {
      userId: request.grantedUserId,
      password,
      role: request.grantedRole ?? "Manager",
      name: request.name,
      email: request.email,
      phone: request.phone,
    });
    return { ok: true };
  },
});

/** Action: create the password account for a granted user, then email + SMS the credentials. */
export const provisionAccount = action({
  args: {
    userId: v.string(),
    password: v.string(),
    role: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { userId, password, role, name, email, phone }) => {
    const created = await createAccount(ctx, {
      provider: "password",
      account: { id: userId, secret: password },
      profile: {
        email,
        name,
        role: authRoleFor(role),
      },
    });
    await ctx.runAction(api.notify.credentialsIssued, {
      name,
      email,
      phone,
      userId,
      password,
      role,
    });
    return { ok: true, authUserId: created.user._id };
  },
});

/** Action: update a granted user's password and resend their credentials. */
export const resetCredentials = action({
  args: {
    userId: v.string(),
    password: v.string(),
    role: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { userId, password, role, name, email, phone }) => {
    await modifyAccountCredentials(ctx, {
      provider: "password",
      account: { id: userId, secret: password },
    });
    await ctx.runAction(api.notify.credentialsIssued, {
      name,
      email,
      phone,
      userId,
      password,
      role,
    });
    return { ok: true };
  },
});

/**
 * Super Admin only: every person with management access, joined with their
 * generated login ID, the role that was granted, and their contact details.
 */
export const listManagementUsers = query({
  args: {},
  handler: async (ctx) => {
    const caller = await requireSuperAdmin(ctx);
    const users = await ctx.db
      .query("users")
      .filter((q) =>
        q.or(q.eq(q.field("role"), ROLES.ADMIN), q.eq(q.field("role"), ROLES.SUPER_ADMIN)),
      )
      .collect();
    const granted = await ctx.db
      .query("accessRequests")
      .filter((q) => q.eq(q.field("status"), "granted"))
      .collect();
    const requestByLoginId = new Map<string, (typeof granted)[number]>();
    for (const req of granted) {
      if (req.grantedUserId) requestByLoginId.set(req.grantedUserId, req);
    }

    const rows = [];
    for (const user of users) {
      const accounts = await ctx.db
        .query("authAccounts")
        .withIndex("userIdAndProvider", (q) =>
          q.eq("userId", user._id).eq("provider", "password"),
        )
        .collect();
      const loginId = accounts[0]?.providerAccountId;
      const grant = loginId ? requestByLoginId.get(loginId) : undefined;
      rows.push({
        userId: user._id,
        name: user.name ?? user.email ?? "—",
        email: user.email ?? "",
        loginId: loginId ?? "—",
        authRole: user.role,
        displayRole:
          grant?.grantedRole ?? (user.role === ROLES.SUPER_ADMIN ? "Super Admin" : "Manager"),
        phone: grant?.phone ?? "",
        grantedAt: grant?.grantedAt,
        isSelf: user._id === caller._id,
        isBuiltIn: loginId === SUPER_ADMIN_ID,
      });
    }
    // Super Admins first, then most recently granted.
    return rows.sort((a, b) => {
      if (a.authRole !== b.authRole) {
        return a.authRole === ROLES.SUPER_ADMIN ? -1 : 1;
      }
      return (b.grantedAt ?? 0) - (a.grantedAt ?? 0);
    });
  },
});

/**
 * Super Admin only: revoke a management user's access completely.
 * Removes the account, every session and token, and their profile — they can
 * no longer sign in anywhere. Protected rails: can't remove yourself, the
 * built-in super admin (WSE), or the last remaining Super Admin.
 */
export const removeManagementUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const admin = await requireSuperAdmin(ctx);
    if (admin._id === userId) {
      throw new ConvexError({ message: "You cannot remove your own access." });
    }
    const target = await ctx.db.get(userId);
    if (!target) throw new ConvexError({ message: "Management user not found." });
    if (!hasAdminRole(target.role)) {
      throw new ConvexError({ message: "This account does not hold management access." });
    }

    // The built-in fallback super admin (WSE) is the recovery key — never removable.
    const passwordAccounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) =>
        q.eq("userId", userId).eq("provider", "password"),
      )
      .collect();
    if (passwordAccounts.some((a) => a.providerAccountId === SUPER_ADMIN_ID)) {
      throw new ConvexError({
        message: "The built-in super admin (WSE) is the recovery account and cannot be removed.",
      });
    }

    // Never strand the organization without a Super Admin.
    if (target.role === ROLES.SUPER_ADMIN) {
      const superAdmins = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), ROLES.SUPER_ADMIN))
        .collect();
      if (superAdmins.length <= 1) {
        throw new ConvexError({
          message: "You are the only Super Admin — promote another manager to Super Admin before removing this one.",
        });
      }
    }

    // 1. Auth accounts + their verification codes.
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of accounts) {
      const codes = await ctx.db
        .query("authVerificationCodes")
        .withIndex("accountId", (q) => q.eq("accountId", account._id))
        .collect();
      for (const code of codes) await ctx.db.delete(code._id);
      await ctx.db.delete(account._id);
    }

    // 2. Sessions, their refresh tokens and PKCE verifiers (kills open logins).
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of sessions) {
      const tokens = await ctx.db
        .query("authRefreshTokens")
        .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const token of tokens) await ctx.db.delete(token._id);
      const verifiers = await ctx.db
        .query("authVerifiers")
        .filter((q) => q.eq(q.field("sessionId"), session._id))
        .collect();
      for (const verifier of verifiers) await ctx.db.delete(verifier._id);
      await ctx.db.delete(session._id);
    }

    // 3. Full player footprint if the manager ever registered as a player
    // (profile, photo, performance history, team memberships, attendance).
    const profile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (profile) {
      await wipePlayerData(ctx, profile._id, profile.photoStorageId);
    }

    // 4. The complete auth wipe (subscribers, auth accounts, verification
    // codes, sessions, refresh tokens, PKCE verifiers + the user row).
    await wipeAuthUser(ctx, userId);

    // 5. Audit trail + notify the organization.
    await ctx.db.insert("securityLogs", {
      userId: admin._id,
      email: admin.email,
      reason: `Super Admin removed management user ${target.email ?? target.name ?? userId} from the portal`,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.notify.staffRemoved, {
      name: target.name ?? "Staff member",
      email: target.email ?? "",
      removedBy: admin.name ?? "Super Admin",
    });
    return { ok: true, userId };
  },
});

/**
 * Super Admin only: permanently remove a granted management user by their
 * generated login ID (WSE-001, …) — the action offered on the Access page.
 * Deletes the account, sessions, tokens, any linked player data and the
 * access request rows, so nothing is left behind to cause "wrong
 * credentials" conflicts if they ever try to sign in again.
 */
export const removeGrantedUser = mutation({
  args: { loginId: v.string() },
  handler: async (ctx, { loginId }) => {
    const admin = await requireSuperAdmin(ctx);
    const login = loginId.trim();
    if (!login) throw new ConvexError({ message: "No login ID provided." });
    if (login === SUPER_ADMIN_ID) {
      throw new ConvexError({
        message: "The built-in super admin (WSE) is the recovery account and cannot be removed.",
      });
    }

    const account = await ctx.db
      .query("authAccounts")
      .withIndex("providerAndAccountId", (q) =>
        q.eq("provider", "password").eq("providerAccountId", login),
      )
      .unique();
    if (!account) {
      throw new ConvexError({ message: "No active account found for that User ID — it may already be removed." });
    }
    const user = await ctx.db.get(account.userId);
    if (!user) {
      throw new ConvexError({ message: "User record not found — nothing to remove." });
    }

    // Full player footprint (if this person ever registered as a player).
    const profile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (profile) {
      await wipePlayerData(ctx, profile._id, profile.photoStorageId);
    }

    // Complete auth wipe — no leftover account to hit credential errors.
    await wipeAuthUser(ctx, user._id);

    // Remove every access request row tied to this person (their personal
    // data on file) so a fresh request can be made cleanly later.
    const requestRows = await ctx.db
      .query("accessRequests")
      .filter((q) => q.eq(q.field("grantedUserId"), login))
      .collect();
    for (const row of requestRows) await ctx.db.delete(row._id);
    const byEmail = await ctx.db
      .query("accessRequests")
      .filter((q) => q.eq(q.field("email"), user.email ?? ""))
      .collect();
    for (const row of byEmail) await ctx.db.delete(row._id);

    // Audit trail + notify the organization.
    await ctx.db.insert("securityLogs", {
      userId: admin._id,
      email: admin.email,
      reason: `Super Admin permanently removed management user ${user.email ?? user.name ?? login} (${login}) and all their data`,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.notify.staffRemoved, {
      name: user.name ?? "Staff member",
      email: user.email ?? "",
      removedBy: admin.name ?? "Super Admin",
    });
    return { ok: true, loginId: login };
  },
});

/**
 * Admin-only: manually delete any access-management entry by selection.
 *
 * - Pending / declined entries: the request row (the person's stored data)
 *   is deleted — admins can clean the list anytime.
 * - Granted entries: additionally performs the full management-user removal
 *   (account, sessions, tokens, linked player data, request rows) exactly like
 *   `removeGrantedUser` — this branch requires a Super Admin, so a regular
 *   manager can never silently delete a live management login.
 */
export const deleteRequestEntry = mutation({
  args: { requestId: v.id("accessRequests") },
  handler: async (ctx, { requestId }) => {
    const admin = await requireAdmin(ctx);
    const request = await ctx.db.get(requestId);
    if (!request) {
      throw new ConvexError({ message: "Request not found — it may already be deleted." });
    }

    const login = request.grantedUserId ?? "";

    // Granted entries carry a live management login → full wipe (Super Admin only).
    if (request.status === "granted" && login) {
      await requireSuperAdmin(ctx);
      if (login === SUPER_ADMIN_ID) {
        throw new ConvexError({
          message: "The built-in super admin (WSE) is the recovery account and cannot be removed.",
        });
      }
      const account = await ctx.db
        .query("authAccounts")
        .withIndex("providerAndAccountId", (q) =>
          q.eq("provider", "password").eq("providerAccountId", login),
        )
        .unique();
      if (account) {
        const user = await ctx.db.get(account.userId);
        if (user) {
          // Full player footprint if this person ever registered as a player.
          const profile = await ctx.db
            .query("players")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .first();
          if (profile) {
            await wipePlayerData(ctx, profile._id, profile.photoStorageId);
          }
          // Complete auth wipe — no leftover account to hit credential errors.
          await wipeAuthUser(ctx, user._id);
        }
      }
    }

    // Every access request row belonging to this person (any status) goes away
    // so nothing of theirs remains on the access-management list.
    const all = await ctx.db.query("accessRequests").collect();
    for (const row of all) {
      const sameLogin = !!login && row.grantedUserId === login;
      const sameEmail = row.email === request.email;
      if (sameLogin || sameEmail) await ctx.db.delete(row._id);
    }

    // Audit trail + notify the organization when a live login was removed.
    await ctx.db.insert("securityLogs", {
      userId: admin._id,
      email: admin.email,
      reason: `Deleted access-management data for ${request.name} (${request.email}) — ${request.status}${login ? ` · login ${login} removed` : ""}`,
      createdAt: Date.now(),
    });
    if (login) {
      await ctx.scheduler.runAfter(0, api.notify.staffRemoved, {
        name: request.name,
        email: request.email,
        removedBy: admin.name ?? "Admin",
      });
    }
    return { ok: true, name: request.name, loginRemoved: !!login };
  },
});

