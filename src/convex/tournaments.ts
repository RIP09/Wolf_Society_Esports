import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./guards";
import { TOURNAMENT_STATUS } from "./schema";

export const listTournaments = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const tournaments = await ctx.db.query("tournaments").order("desc").take(100);
    const matches = await ctx.db.query("matches").collect();
    const countByTournament = new Map<string, number>();
    for (const m of matches) {
      if (m.tournamentId) {
        countByTournament.set(m.tournamentId, (countByTournament.get(m.tournamentId) ?? 0) + 1);
      }
    }
    return tournaments.map((t) => ({
      ...t,
      matchCount: countByTournament.get(t._id) ?? 0,
    }));
  },
});

export const createTournament = mutation({
  args: {
    name: v.string(),
    game: v.string(),
    description: v.optional(v.string()),
    prizePool: v.optional(v.number()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    if (name.length < 2) throw new ConvexError({ message: "Tournament name is too short." });
    return await ctx.db.insert("tournaments", {
      name,
      game: args.game,
      description: args.description?.trim() || undefined,
      prizePool: args.prizePool,
      startDate: args.startDate,
      endDate: args.endDate,
      status: TOURNAMENT_STATUS.UPCOMING,
      createdAt: Date.now(),
    });
  },
});

export const updateTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    name: v.string(),
    game: v.string(),
    description: v.optional(v.string()),
    prizePool: v.optional(v.number()),
    startDate: v.number(),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const tournament = await ctx.db.get(args.tournamentId);
    if (!tournament) throw new ConvexError({ message: "Tournament not found." });
    await ctx.db.patch(args.tournamentId, {
      name: args.name.trim(),
      game: args.game,
      description: args.description?.trim() || undefined,
      prizePool: args.prizePool,
      startDate: args.startDate,
      endDate: args.endDate,
    });
  },
});

export const setStatus = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    status: v.union(
      v.literal(TOURNAMENT_STATUS.UPCOMING),
      v.literal(TOURNAMENT_STATUS.LIVE),
      v.literal(TOURNAMENT_STATUS.COMPLETED),
      v.literal(TOURNAMENT_STATUS.CANCELLED),
    ),
  },
  handler: async (ctx, { tournamentId, status }) => {
    await requireAdmin(ctx);
    const tournament = await ctx.db.get(tournamentId);
    if (!tournament) throw new ConvexError({ message: "Tournament not found." });
    await ctx.db.patch(tournamentId, { status });
  },
});

export const deleteTournament = mutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    await requireAdmin(ctx);
    const tournament = await ctx.db.get(tournamentId);
    if (!tournament) throw new ConvexError({ message: "Tournament not found." });
    const matches = await ctx.db
      .query("matches")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    for (const m of matches) await ctx.db.delete(m._id);
    await ctx.db.delete(tournamentId);
  },
});
