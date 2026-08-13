import { ConvexError, v } from "convex/values";
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./guards";
import { PLAYER_STATUS, ROLES } from "./schema";

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
    const taken = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("gamertag"), gamertag))
      .first();
    if (taken) {
      throw new ConvexError({ message: "That gamertag is already registered." });
    }
    const playerId = await ctx.db.insert("players", {
      userId: user._id,
      gamertag,
      realName: args.realName.trim(),
      email: args.email.trim(),
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
    await ctx.db.patch(playerId, { status });
    if (status === PLAYER_STATUS.ACTIVE) {
      await ctx.db.patch(player.userId, { role: ROLES.PLAYER });
    }
    return status;
  },
});
