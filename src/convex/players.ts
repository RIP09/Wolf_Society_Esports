import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { hasAdminRole, requireAdmin, requireUser } from "./guards";
import { PLAYER_STATUS, ROLES } from "./schema";

/**
 * Deletes one player's full esports footprint: performance history, team
 * memberships (and captain assignments), attendance responses and uploaded
 * photo — then the profile itself. The linked auth account is kept.
 */
export async function wipePlayerData(
  ctx: MutationCtx,
  playerId: Id<"players">,
  photoStorageId?: Id<"_storage">,
) {
  const entries = await ctx.db
    .query("performanceEntries")
    .withIndex("by_player", (q) => q.eq("playerId", playerId))
    .collect();
  for (const e of entries) await ctx.db.delete(e._id);

  const memberships = await ctx.db
    .query("teamMembers")
    .withIndex("by_player", (q) => q.eq("playerId", playerId))
    .collect();
  for (const m of memberships) await ctx.db.delete(m._id);
  const captained = await ctx.db
    .query("teams")
    .filter((q) => q.eq(q.field("captainId"), playerId))
    .collect();
  for (const t of captained) await ctx.db.patch(t._id, { captainId: undefined });

  const confirmations = await ctx.db
    .query("routineConfirmations")
    .withIndex("by_player", (q) => q.eq("playerId", playerId))
    .collect();
  for (const c of confirmations) await ctx.db.delete(c._id);

  const attendance = await ctx.db
    .query("attendanceRecords")
    .withIndex("by_player", (q) => q.eq("playerId", playerId))
    .collect();
  for (const a of attendance) await ctx.db.delete(a._id);

  const reports = await ctx.db
    .query("matchReports")
    .withIndex("by_player", (q) => q.eq("playerId", playerId))
    .collect();
  for (const r of reports) await ctx.db.delete(r._id);

  if (photoStorageId) {
    try {
      await ctx.storage.delete(photoStorageId);
    } catch {
      // best-effort cleanup — the rest of the removal continues
    }
  }
  await ctx.db.delete(playerId);
}

/**
 * Deletes a complete auth account: alert subscriptions, auth accounts +
 * verification codes, sessions + refresh tokens + verifiers, and the user
 * row itself. After this the person can sign up again with zero leftovers.
 */
export async function wipeAuthUser(ctx: MutationCtx, userId: Id<"users">) {
  const subs = await ctx.db
    .query("subscribers")
    .filter((q) => q.eq(q.field("userId"), userId))
    .collect();
  for (const s of subs) await ctx.db.delete(s._id);

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

  const user = await ctx.db.get(userId);
  if (user) await ctx.db.delete(userId);
}

export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
  },
});

/**
 * Friendly pre-registration check. Tells the registration form whether an
 * email or gamertag is already in the shared system, and whether that data
 * belongs to the signed-in user (so they can safely choose to delete it and
 * start fresh instead of hitting a hard error).
 */
export const checkExisting = query({
  args: {
    email: v.string(),
    gamertag: v.string(),
  },
  handler: async (ctx, { email, gamertag }) => {
    const user = await requireUser(ctx);
    const emailNorm = email.trim().toLowerCase();
    const gamertagNorm = gamertag.trim().toLowerCase();

    const byEmail = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("email"), emailNorm))
      .first();
    const byGamertag = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("gamertag"), gamertagNorm))
      .first();

    // A record is "mine" when it belongs to this auth account, or when it
    // shares the same verified email (the user proved inbox ownership via OTP).
    const belongsToMe = (p: { userId: unknown; email: string } | null | undefined) => {
      if (!p) return false;
      if (p.userId === user._id) return true;
      if (user.email && p.email.toLowerCase() === user.email.toLowerCase()) return true;
      return false;
    };

    const emailTaken = byEmail ? !belongsToMe(byEmail) : false;
    const gamertagTaken = byGamertag ? !belongsToMe(byGamertag) : false;

    return {
      emailTaken,
      gamertagTaken,
      emailIsMine: byEmail ? belongsToMe(byEmail) : false,
      gamertagIsMine: byGamertag ? belongsToMe(byGamertag) : false,
      // A matched profile that is mine still blocks registration until it is
      // removed — the form uses this to offer "delete my old data".
      anyConflict: !!(byEmail || byGamertag),
    };
  },
});

/**
 * Self-service permanent deletion. Removes the signed-in user's player
 * profile and EVERY piece of their data — including any older profile that
 * shares the same verified email (proof of ownership comes from the OTP sign
 * in), so someone who registered before under a different login can genuinely
 * start fresh with zero errors. This is the player-facing version of the
 * admin `remove` mutation.
 */
export const purgeMyData = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const emailNorm = user.email ? user.email.toLowerCase() : "";

    // Collect every profile that belongs to this identity: the current
    // account's profile plus any sharing the same verified email.
    const profiles: Doc<"players">[] = [];
    const mine = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (mine) profiles.push(mine);
    if (emailNorm) {
      const byEmail = await ctx.db
        .query("players")
        .filter((q) => q.eq(q.field("email"), emailNorm))
        .collect();
      for (const p of byEmail) {
        if (!profiles.some((x) => x._id === p._id)) profiles.push(p);
      }
    }

    for (const profile of profiles) {
      await wipePlayerData(ctx, profile._id, profile.photoStorageId);
      const linked = await ctx.db.get(profile.userId);
      if (linked && !hasAdminRole(linked.role)) {
        await wipeAuthUser(ctx, linked._id);
      }
    }

    // If the current account itself wasn't covered by a profile (e.g. a bare
    // guest login), still wipe it so re-registration is completely clean.
    const covered = profiles.some((p) => p.userId === user._id);
    if (!covered) await wipeAuthUser(ctx, user._id);

    await ctx.db.insert("securityLogs", {
      userId: user._id,
      email: user.email,
      reason: "Player self-deleted their account and all associated data",
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Player-facing registration. Creates the esports profile that admins see and manage. */
export const register = mutation({
  args: {
    gamertag: v.string(),
    realName: v.string(),
    email: v.string(),
    game: v.string(),
    inGameRole: v.optional(v.string()),
    region: v.optional(v.string()),
    rank: v.optional(v.string()),
    bio: v.optional(v.string()),
    discord: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneCountryCode: v.optional(v.string()),
    age: v.optional(v.number()),
    nationality: v.optional(v.string()),
    platform: v.optional(v.string()),
    secondaryGame: v.optional(v.string()),
    gameIds: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    weeklyHours: v.optional(v.string()),
    previousTeams: v.optional(v.string()),
    achievements: v.optional(v.string()),
    socials: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role === ROLES.ADMIN) {
      throw new ConvexError({ message: "Admins manage the org — they can't register as players." });
    }
    const existing = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (existing) {
      throw new ConvexError({ message: "You are already registered as a player." });
    }
    const gamertag = args.gamertag.trim();
    if (gamertag.length < 2) {
      throw new ConvexError({ message: "Gamertag must be at least 2 characters." });
    }
    const emailNorm = args.email.trim().toLowerCase();
    const taken = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("gamertag"), gamertag))
      .first();
    if (taken && taken.userId !== user._id) {
      throw new ConvexError({ message: "That gamertag is already registered to another account." });
    }
    if (taken && taken.userId === user._id) {
      throw new ConvexError({ message: "You are already registered — head to your dashboard to manage your profile." });
    }
    const emailDup = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("email"), emailNorm))
      .first();
    if (emailDup && emailDup.userId !== user._id) {
      throw new ConvexError({ message: "This email is already registered to another player account." });
    }
    const playerId = await ctx.db.insert("players", {
      userId: user._id,
      gamertag,
      realName: args.realName.trim(),
      email: emailNorm,
      game: args.game,
      inGameRole: args.inGameRole?.trim() || undefined,
      region: args.region?.trim() || undefined,
      rank: args.rank?.trim() || undefined,
      bio: args.bio?.trim() || undefined,
      discord: args.discord?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      phoneCountryCode: args.phoneCountryCode?.trim() || undefined,
      age: args.age,
      nationality: args.nationality?.trim() || undefined,
      platform: args.platform?.trim() || undefined,
      secondaryGame: args.secondaryGame?.trim() || undefined,
      gameIds: args.gameIds?.trim() || undefined,
      experienceLevel: args.experienceLevel?.trim() || undefined,
      weeklyHours: args.weeklyHours?.trim() || undefined,
      previousTeams: args.previousTeams?.trim() || undefined,
      achievements: args.achievements?.trim() || undefined,
      socials: args.socials?.trim() || undefined,
      status: PLAYER_STATUS.PENDING,
      joinedAt: Date.now(),
    });
    await ctx.db.patch(user._id, { role: ROLES.PLAYER, name: gamertag });
    await ctx.scheduler.runAfter(0, api.notify.newRegistration, {
      gamertag,
      game: args.game,
      email: args.email.trim(),
    });
    await ctx.scheduler.runAfter(0, api.automation.triggerWorkflow, {
      event: "player.registered",
      payload: JSON.stringify({
        gamertag,
        realName: args.realName.trim(),
        email: args.email.trim(),
        game: args.game,
        inGameRole: args.inGameRole?.trim() || undefined,
        region: args.region?.trim() || undefined,
        platform: args.platform?.trim() || undefined,
        nationality: args.nationality?.trim() || undefined,
        experienceLevel: args.experienceLevel?.trim() || undefined,
      }),
    });
    return playerId;
  },
});

/** Player edits their own profile. */
export const updateProfile = mutation({
  args: {
    gamertag: v.string(),
    realName: v.string(),
    game: v.string(),
    inGameRole: v.optional(v.string()),
    region: v.optional(v.string()),
    rank: v.optional(v.string()),
    bio: v.optional(v.string()),
    discord: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneCountryCode: v.optional(v.string()),
    age: v.optional(v.number()),
    nationality: v.optional(v.string()),
    platform: v.optional(v.string()),
    secondaryGame: v.optional(v.string()),
    gameIds: v.optional(v.string()),
    experienceLevel: v.optional(v.string()),
    weeklyHours: v.optional(v.string()),
    previousTeams: v.optional(v.string()),
    achievements: v.optional(v.string()),
    socials: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!profile) {
      throw new ConvexError({ message: "Register a player profile first." });
    }
    const gamertag = args.gamertag.trim();
    if (gamertag.length < 2) {
      throw new ConvexError({ message: "Gamertag must be at least 2 characters." });
    }
    const taken = await ctx.db
      .query("players")
      .filter((q) =>
        q.and(q.eq(q.field("gamertag"), gamertag), q.neq(q.field("_id"), profile._id)),
      )
      .first();
    if (taken) {
      throw new ConvexError({ message: "That gamertag is already registered." });
    }
    await ctx.db.patch(profile._id, {
      gamertag,
      realName: args.realName.trim(),
      game: args.game,
      inGameRole: args.inGameRole?.trim() || undefined,
      region: args.region?.trim() || undefined,
      rank: args.rank?.trim() || undefined,
      bio: args.bio?.trim() || undefined,
      discord: args.discord?.trim() || undefined,
      phone: args.phone?.trim() || undefined,
      phoneCountryCode: args.phoneCountryCode?.trim() || undefined,
      age: args.age,
      nationality: args.nationality?.trim() || undefined,
      platform: args.platform?.trim() || undefined,
      secondaryGame: args.secondaryGame?.trim() || undefined,
      gameIds: args.gameIds?.trim() || undefined,
      experienceLevel: args.experienceLevel?.trim() || undefined,
      weeklyHours: args.weeklyHours?.trim() || undefined,
      previousTeams: args.previousTeams?.trim() || undefined,
      achievements: args.achievements?.trim() || undefined,
      socials: args.socials?.trim() || undefined,
    });
    await ctx.db.patch(user._id, { name: gamertag });
  },
});

/** Admin-only: list all players with optional filters, photos resolved. */
export const list = query({
  args: {
    status: v.optional(v.string()),
    game: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, { status, game, search }) => {
    await requireAdmin(ctx);
    const players = await ctx.db.query("players").order("desc").take(300);
    const q = (search ?? "").trim().toLowerCase();
    const filtered = players.filter((p) => {
      if (status && p.status !== status) return false;
      if (game && p.game !== game) return false;
      if (q) {
        const hay = `${p.gamertag} ${p.realName} ${p.email} ${p.rank ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    return Promise.all(
      filtered.map(async (p) => ({
        ...p,
        photoUrl: p.photoStorageId ? (await ctx.storage.getUrl(p.photoStorageId)) ?? undefined : undefined,
      })),
    );
  },
});

/** Admin-only: a single player's full record. */
export const get = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    await requireAdmin(ctx);
    const player = await ctx.db.get(playerId);
    if (!player) throw new ConvexError({ message: "Player not found." });
    return player;
  },
});

/** Admin-only: approve / suspend / reactivate a player. */
export const setStatus = mutation({
  args: {
    playerId: v.id("players"),
    status: v.union(
      v.literal(PLAYER_STATUS.PENDING),
      v.literal(PLAYER_STATUS.ACTIVE),
      v.literal(PLAYER_STATUS.SUSPENDED),
    ),
  },
  handler: async (ctx, { playerId, status }) => {
    await requireAdmin(ctx);
    const player = await ctx.db.get(playerId);
    if (!player) throw new ConvexError({ message: "Player not found." });
    await ctx.db.patch(playerId, {
      status,
      // The first time a player is approved they become "verified" — the
      // portal then unlocks the full player experience + verified badge.
      verifiedAt: status === PLAYER_STATUS.ACTIVE ? (player.verifiedAt ?? Date.now()) : undefined,
    });
    if (status === PLAYER_STATUS.ACTIVE) {
      await ctx.db.patch(player.userId, { role: ROLES.PLAYER });
    }
    return status;
  },
});

/**
 * Admin-only: assign verified role badges to a player (e.g. "MVP", "IGL",
 * "Captain", "Starter"). They show on the player's portal and profile.
 */
export const setBadges = mutation({
  args: { playerId: v.id("players"), badges: v.array(v.string()) },
  handler: async (ctx, { playerId, badges }) => {
    await requireAdmin(ctx);
    const player = await ctx.db.get(playerId);
    if (!player) throw new ConvexError({ message: "Player not found." });
    const clean = badges
      .map((b) => b.trim())
      .filter((b) => b.length > 0)
      .slice(0, 12);
    await ctx.db.patch(playerId, { badges: clean.length > 0 ? clean : undefined });
    return clean;
  },
});

/**
 * Admin-only: permanently remove a player and EVERY piece of their data.
 *
 * Deletes the profile, performance history, team memberships (and any
 * captain assignment), attendance responses, uploaded photo, alert
 * subscriptions, and — for non-management accounts — the auth account,
 * every session/token and the user record itself. Nothing is left behind,
 * so a removed player can sign up and register again with zero errors.
 */
export const remove = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    const admin = await requireAdmin(ctx);
    const player = await ctx.db.get(playerId);
    if (!player) throw new ConvexError({ message: "Player not found." });

    // 1-5. Full esports footprint (performance, teams, attendance, photo, profile).
    await wipePlayerData(ctx, playerId, player.photoStorageId);

    // 6. The linked auth account — full removal so re-registration is clean
    // (management accounts are kept; only the player data is removed).
    const user = await ctx.db.get(player.userId);
    if (user && !hasAdminRole(user.role)) {
      await wipeAuthUser(ctx, user._id);
    }

    // 7. Audit trail for The Den's security log.
    await ctx.db.insert("securityLogs", {
      userId: admin._id,
      email: admin.email,
      reason: `Admin removed player ${player.gamertag} (${player.email}) and all associated data`,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});
