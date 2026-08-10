import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./guards";
import { ENTRY_TYPE, MATCH_RESULT, PLAYER_STATUS } from "./schema";

export const listMy = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!profile) return [];
    return await ctx.db
      .query("performanceEntries")
      .withIndex("by_player", (q) => q.eq("playerId", profile._id))
      .order("desc")
      .take(100);
  },
});

/** Player logs a performance entry; admins see it aggregated in their app. */
export const log = mutation({
  args: {
    matchType: v.union(
      v.literal(ENTRY_TYPE.SCRIM),
      v.literal(ENTRY_TYPE.TOURNAMENT),
      v.literal(ENTRY_TYPE.RANKED),
      v.literal(ENTRY_TYPE.TRYOUT),
    ),
    game: v.string(),
    result: v.union(
      v.literal(MATCH_RESULT.WIN),
      v.literal(MATCH_RESULT.LOSS),
      v.literal(MATCH_RESULT.DRAW),
    ),
    kills: v.number(),
    deaths: v.number(),
    assists: v.number(),
    damage: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!profile) throw new ConvexError({ message: "Register a player profile first." });
    if (profile.status === PLAYER_STATUS.SUSPENDED) {
      throw new ConvexError({ message: "Suspended players can't log performance." });
    }
    const nums = [args.kills, args.deaths, args.assists, args.damage ?? 0];
    if (nums.some((n) => n < 0)) throw new ConvexError({ message: "Stats can't be negative." });
    return await ctx.db.insert("performanceEntries", {
      playerId: profile._id,
      matchType: args.matchType,
      game: args.game,
      result: args.result,
      kills: Math.round(args.kills),
      deaths: Math.round(args.deaths),
      assists: Math.round(args.assists),
      damage: args.damage !== undefined ? Math.round(args.damage) : undefined,
      notes: args.notes?.trim() || undefined,
      recordedAt: Date.now(),
    });
  },
});

/** Players can delete their own entries; admins can delete any entry. */
export const remove = mutation({
  args: { entryId: v.id("performanceEntries") },
  handler: async (ctx, { entryId }) => {
    const user = await requireUser(ctx);
    const entry = await ctx.db.get(entryId);
    if (!entry) throw new ConvexError({ message: "Entry not found." });
    const profile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    const isOwner = profile?._id === entry.playerId;
    if (!isOwner && user.role !== "admin") {
      throw new ConvexError({ message: "You can only delete your own entries." });
    }
    await ctx.db.delete(entryId);
  },
});

/** Admin-only: every performance entry, joined with the player's gamertag. */
export const listAll = query({
  args: {
    playerId: v.optional(v.id("players")),
    matchType: v.optional(v.string()),
  },
  handler: async (ctx, { playerId, matchType }) => {
    await requireAdmin(ctx);
    let entries = await ctx.db.query("performanceEntries").order("desc").take(400);
    if (playerId) entries = entries.filter((e) => e.playerId === playerId);
    if (matchType) entries = entries.filter((e) => e.matchType === matchType);
    const playerIds = [...new Set(entries.map((e) => e.playerId))];
    const players = await Promise.all(playerIds.map((id) => ctx.db.get(id)));
    const byId = new Map(players.filter(Boolean).map((p) => [p!._id, p!]));
    return entries.map((e) => ({
      ...e,
      gamertag: byId.get(e.playerId)?.gamertag ?? "Unknown",
      gameName: byId.get(e.playerId)?.game ?? e.game,
    }));
  },
});
