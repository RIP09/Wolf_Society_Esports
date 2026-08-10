import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./guards";
import { MATCH_STATUS } from "./schema";
import type { Doc } from "./_generated/dataModel";

async function withNames(ctx: Parameters<typeof requireUser>[0], match: Doc<"matches">) {
  const [teamA, teamB, tournament] = await Promise.all([
    ctx.db.get(match.teamAId),
    ctx.db.get(match.teamBId),
    match.tournamentId ? ctx.db.get(match.tournamentId) : null,
  ]);
  return {
    ...match,
    teamA: teamA ? { _id: teamA._id, name: teamA.name, tag: teamA.tag } : null,
    teamB: teamB ? { _id: teamB._id, name: teamB.name, tag: teamB.tag } : null,
    tournamentName: tournament?.name ?? null,
  };
}

export const listMatches = query({
  args: { status: v.optional(v.string()), tournamentId: v.optional(v.id("tournaments")) },
  handler: async (ctx, { status, tournamentId }) => {
    await requireUser(ctx);
    let matches = await ctx.db.query("matches").order("desc").take(200);
    if (status) matches = matches.filter((m) => m.status === status);
    if (tournamentId) matches = matches.filter((m) => m.tournamentId === tournamentId);
    return Promise.all(matches.map((m) => withNames(ctx, m)));
  },
});

export const createMatch = mutation({
  args: {
    tournamentId: v.optional(v.id("tournaments")),
    teamAId: v.id("teams"),
    teamBId: v.id("teams"),
    map: v.optional(v.string()),
    scheduledAt: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.teamAId === args.teamBId) {
      throw new ConvexError({ message: "A team can't play against itself." });
    }
    const [teamA, teamB] = await Promise.all([ctx.db.get(args.teamAId), ctx.db.get(args.teamBId)]);
    if (!teamA || !teamB) throw new ConvexError({ message: "Both teams must exist." });
    if (args.tournamentId) {
      const tournament = await ctx.db.get(args.tournamentId);
      if (!tournament) throw new ConvexError({ message: "Tournament not found." });
    }
    return await ctx.db.insert("matches", {
      tournamentId: args.tournamentId,
      teamAId: args.teamAId,
      teamBId: args.teamBId,
      map: args.map?.trim() || undefined,
      scheduledAt: args.scheduledAt,
      status: MATCH_STATUS.SCHEDULED,
      scoreA: undefined,
      scoreB: undefined,
      winnerId: undefined,
    });
  },
});

export const setStatus = mutation({
  args: {
    matchId: v.id("matches"),
    status: v.union(
      v.literal(MATCH_STATUS.SCHEDULED),
      v.literal(MATCH_STATUS.LIVE),
      v.literal(MATCH_STATUS.COMPLETED),
    ),
  },
  handler: async (ctx, { matchId, status }) => {
    await requireAdmin(ctx);
    const match = await ctx.db.get(matchId);
    if (!match) throw new ConvexError({ message: "Match not found." });
    await ctx.db.patch(matchId, { status });
  },
});

/** Admin-only: record final scores; winner is derived automatically. */
export const recordResult = mutation({
  args: {
    matchId: v.id("matches"),
    scoreA: v.number(),
    scoreB: v.number(),
  },
  handler: async (ctx, { matchId, scoreA, scoreB }) => {
    await requireAdmin(ctx);
    if (scoreA < 0 || scoreB < 0) throw new ConvexError({ message: "Scores can't be negative." });
    const match = await ctx.db.get(matchId);
    if (!match) throw new ConvexError({ message: "Match not found." });
    const winnerId = scoreA > scoreB ? match.teamAId : scoreB > scoreA ? match.teamBId : undefined;
    await ctx.db.patch(matchId, {
      status: MATCH_STATUS.COMPLETED,
      scoreA,
      scoreB,
      winnerId,
    });
  },
});

export const deleteMatch = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, { matchId }) => {
    await requireAdmin(ctx);
    const match = await ctx.db.get(matchId);
    if (!match) throw new ConvexError({ message: "Match not found." });
    await ctx.db.delete(matchId);
  },
});

/** Player-facing: matches involving my team(s). */
export const listMyMatches = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!profile) return [];
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_player", (q) => q.eq("playerId", profile._id))
      .collect();
    const teamIds = new Set(memberships.map((m) => m.teamId));
    if (teamIds.size === 0) return [];
    const matches = await ctx.db.query("matches").order("desc").take(300);
    const mine = matches.filter(
      (m) => teamIds.has(m.teamAId) || teamIds.has(m.teamBId),
    );
    return Promise.all(mine.map((m) => withNames(ctx, m)));
  },
});
