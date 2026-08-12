import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./guards";
import { PLAYER_STATUS } from "./schema";

export const listTeams = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const teams = await ctx.db.query("teams").order("desc").take(100);
    const memberships = await ctx.db.query("teamMembers").collect();
    const countByTeam = new Map<string, number>();
    for (const m of memberships) {
      countByTeam.set(m.teamId, (countByTeam.get(m.teamId) ?? 0) + 1);
    }
    return Promise.all(
      teams.map(async (t) => ({
        ...t,
        memberCount: countByTeam.get(t._id) ?? 0,
        photoUrl: t.photoStorageId ? (await ctx.storage.getUrl(t.photoStorageId)) ?? undefined : undefined,
      })),
    );
  },
});

export const getTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireUser(ctx);
    const team = await ctx.db.get(teamId);
    if (!team) throw new ConvexError({ message: "Team not found." });
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();
    const rawPlayers = (await Promise.all(
      members.map((m) => ctx.db.get(m.playerId)),
    )).filter((p): p is NonNullable<typeof p> => p !== null);
    const players = await Promise.all(
      rawPlayers.map(async (p) => ({
        ...p,
        photoUrl: p.photoStorageId ? (await ctx.storage.getUrl(p.photoStorageId)) ?? undefined : undefined,
      })),
    );
    const captain = team.captainId ? await ctx.db.get(team.captainId) : null;
    return {
      team: {
        ...team,
        photoUrl: team.photoStorageId ? (await ctx.storage.getUrl(team.photoStorageId)) ?? undefined : undefined,
      },
      players,
      captain,
    };
  },
});

/** Admin-only: create a team. */
export const createTeam = mutation({
  args: {
    name: v.string(),
    tag: v.string(),
    game: v.string(),
    description: v.optional(v.string()),
    captainId: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    if (name.length < 2) throw new ConvexError({ message: "Team name is too short." });
    if (args.captainId) {
      const captain = await ctx.db.get(args.captainId);
      if (!captain) throw new ConvexError({ message: "Captain not found." });
    }
    return await ctx.db.insert("teams", {
      name,
      tag: args.tag.trim().toUpperCase() || name.slice(0, 3).toUpperCase(),
      game: args.game,
      description: args.description?.trim() || undefined,
      captainId: args.captainId,
      createdAt: Date.now(),
    });
  },
});

/** Admin-only: update a team. */
export const updateTeam = mutation({
  args: {
    teamId: v.id("teams"),
    name: v.string(),
    tag: v.string(),
    game: v.string(),
    description: v.optional(v.string()),
    captainId: v.optional(v.id("players")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const team = await ctx.db.get(args.teamId);
    if (!team) throw new ConvexError({ message: "Team not found." });
    if (args.captainId) {
      const captain = await ctx.db.get(args.captainId);
      if (!captain) throw new ConvexError({ message: "Captain not found." });
    }
    await ctx.db.patch(args.teamId, {
      name: args.name.trim(),
      tag: args.tag.trim().toUpperCase() || args.name.slice(0, 3).toUpperCase(),
      game: args.game,
      description: args.description?.trim() || undefined,
      captainId: args.captainId,
    });
  },
});

/** Admin-only: delete a team and its roster links. */
export const deleteTeam = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireAdmin(ctx);
    const team = await ctx.db.get(teamId);
    if (!team) throw new ConvexError({ message: "Team not found." });
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();
    for (const m of members) await ctx.db.delete(m._id);
    await ctx.db.delete(teamId);
  },
});

/** Admin-only: assign a player to a team (removes them from any other team first). */
export const assignPlayer = mutation({
  args: {
    teamId: v.id("teams"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { teamId, playerId }) => {
    await requireAdmin(ctx);
    const team = await ctx.db.get(teamId);
    if (!team) throw new ConvexError({ message: "Team not found." });
    const player = await ctx.db.get(playerId);
    if (!player || player.status !== PLAYER_STATUS.ACTIVE) {
      throw new ConvexError({ message: "Only active players can join teams." });
    }
    const existing = await ctx.db
      .query("teamMembers")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .first();
    if (existing && existing.teamId === teamId) {
      throw new ConvexError({ message: "Player is already on this team." });
    }
    if (existing) await ctx.db.delete(existing._id);
    await ctx.db.insert("teamMembers", { teamId, playerId, joinedAt: Date.now() });
  },
});

/** Admin-only: remove a player from a team. */
export const removePlayer = mutation({
  args: {
    teamId: v.id("teams"),
    playerId: v.id("players"),
  },
  handler: async (ctx, { teamId, playerId }) => {
    await requireAdmin(ctx);
    const membership = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .filter((q) => q.eq(q.field("playerId"), playerId))
      .first();
    if (!membership) throw new ConvexError({ message: "Player is not on this team." });
    const team = await ctx.db.get(teamId);
    if (team?.captainId === playerId) {
      await ctx.db.patch(teamId, { captainId: undefined });
    }
    await ctx.db.delete(membership._id);
  },
});
