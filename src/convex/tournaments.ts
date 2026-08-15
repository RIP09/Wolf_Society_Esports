import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server";
import { api } from "./_generated/api";
import { requireAdmin, requireUser } from "./guards";
import { PLAYER_STATUS, TOURNAMENT_STATUS } from "./schema";
import type { Doc, Id } from "./_generated/dataModel";

type Tournament = Doc<"tournaments">;

const T_STATUS = TOURNAMENT_STATUS;

/** Internal: contact details of every approved participant, for notifications. */
export const getApprovedParticipantContacts = internalQuery({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    const rows = await ctx.db
      .query("tournamentParticipants")
      .withIndex("by_tournament_status", (q) =>
        q.eq("tournamentId", tournamentId).eq("status", "approved"),
      )
      .collect();
    const out: { name: string; email: string; phone?: string }[] = [];
    for (const row of rows) {
      const player = await ctx.db.get(row.playerId);
      if (!player) continue;
      out.push({
        name: row.teamId ? `${player.gamertag} (team)` : player.gamertag,
        email: player.email,
        phone: player.phone ?? undefined,
      });
    }
    return out;
  },
});

/** Collects approved participant contacts directly from a mutation's database handle. */
async function collectContacts(
  db: MutationCtx["db"],
  tournamentId: Id<"tournaments">,
): Promise<{ name: string; email: string; phone?: string }[]> {
  const rows = await db
    .query("tournamentParticipants")
    .withIndex("by_tournament_status", (q) =>
      q.eq("tournamentId", tournamentId).eq("status", "approved"),
    )
    .collect();
  const out: { name: string; email: string; phone?: string }[] = [];
  for (const row of rows) {
    const player = await db.get(row.playerId);
    if (!player) continue;
    out.push({
      name: row.teamId ? `${player.gamertag} (team)` : player.gamertag,
      email: player.email,
      phone: player.phone ?? undefined,
    });
  }
  return out;
}

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
    const tournamentId = await ctx.db.insert("tournaments", {
      name,
      game: args.game,
      description: args.description?.trim() || undefined,
      prizePool: args.prizePool,
      startDate: args.startDate,
      endDate: args.endDate,
      status: T_STATUS.UPCOMING,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.notify.tournamentNotify, {
      tournamentId,
      name,
      game: args.game,
      event: "created",
      status: T_STATUS.UPCOMING,
      message: `A new tournament is open: ${name}. Registrations are now being accepted.`,
      participants: [],
    });
    await ctx.scheduler.runAfter(0, api.automation.triggerWorkflow, {
      event: "tournament.created",
      payload: JSON.stringify({
        tournamentId,
        name,
        game: args.game,
        prizePool: args.prizePool,
        startDate: args.startDate,
      }),
    });
    return tournamentId;
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
      v.literal(T_STATUS.UPCOMING),
      v.literal(T_STATUS.LIVE),
      v.literal(T_STATUS.COMPLETED),
      v.literal(T_STATUS.CANCELLED),
    ),
  },
  handler: async (ctx, { tournamentId, status }) => {
    await requireAdmin(ctx);
    const tournament = await ctx.db.get(tournamentId);
    if (!tournament) throw new ConvexError({ message: "Tournament not found." });
    await ctx.db.patch(tournamentId, { status });

    // Notify every approved participant + the org, and fire the automation.
    const contacts = await collectContacts(ctx.db, tournamentId);
    await ctx.scheduler.runAfter(0, api.notify.tournamentNotify, {
      tournamentId,
      name: tournament.name,
      game: tournament.game,
      event: "status",
      status,
      message:
        status === T_STATUS.LIVE
          ? `${tournament.name} is now LIVE — check the bracket and be ready.`
          : status === T_STATUS.COMPLETED
            ? `${tournament.name} has concluded. Thanks for competing!`
            : status === T_STATUS.CANCELLED
              ? `${tournament.name} has been cancelled.`
              : `${tournament.name} is back to upcoming — dates may have changed.`,
      participants: contacts,
    });
    await ctx.scheduler.runAfter(0, api.automation.triggerWorkflow, {
      event: "tournament.status",
      payload: JSON.stringify({ tournamentId, name: tournament.name, status }),
    });
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
    const participants = await ctx.db
      .query("tournamentParticipants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    for (const p of participants) await ctx.db.delete(p._id);
    const nodes = await ctx.db
      .query("bracketNodes")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    for (const n of nodes) await ctx.db.delete(n._id);
    await ctx.db.delete(tournamentId);
  },
});

// ---------------------------------------------------------------------------
// Participants
// ---------------------------------------------------------------------------

/** Player-facing: register yourself (or your team) into an open tournament. */
export const registerForTournament = mutation({
  args: {
    tournamentId: v.id("tournaments"),
    teamId: v.optional(v.id("teams")),
  },
  handler: async (ctx, { tournamentId, teamId }) => {
    const user = await requireUser(ctx);
    const tournament = await ctx.db.get(tournamentId);
    if (!tournament) throw new ConvexError({ message: "Tournament not found." });
    if (tournament.status !== T_STATUS.UPCOMING) {
      throw new ConvexError({ message: "Registrations are closed — this tournament is no longer upcoming." });
    }
    const profile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!profile) throw new ConvexError({ message: "Register a player profile first." });
    if (profile.status !== PLAYER_STATUS.ACTIVE) {
      throw new ConvexError({ message: "Only verified, active players can enter tournaments." });
    }
    if (teamId) {
      const member = await ctx.db
        .query("teamMembers")
        .withIndex("by_team", (q) => q.eq("teamId", teamId))
        .filter((q) => q.eq(q.field("playerId"), profile._id))
        .first();
      if (!member) throw new ConvexError({ message: "You must be a member of that team to register it." });
    }
    const already = await ctx.db
      .query("tournamentParticipants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .filter((q) => q.eq(q.field("playerId"), profile._id))
      .first();
    if (already) {
      throw new ConvexError({ message: "You are already registered for this tournament." });
    }
    await ctx.db.insert("tournamentParticipants", {
      tournamentId,
      playerId: profile._id,
      teamId,
      status: "pending",
      registeredAt: Date.now(),
    });
    // Tell the org + fire automation. Only this player is notified here.
    await ctx.scheduler.runAfter(0, api.notify.tournamentNotify, {
      tournamentId,
      name: tournament.name,
      game: tournament.game,
      event: "registration",
      status: T_STATUS.UPCOMING,
      message: `You're registered for ${tournament.name}. Management will confirm your entry — watch your email for updates.`,
      participants: [
        { name: profile.gamertag, email: profile.email, phone: profile.phone ?? undefined },
      ],
    });
    await ctx.scheduler.runAfter(0, api.automation.triggerWorkflow, {
      event: "tournament.registered",
      payload: JSON.stringify({
        tournamentId,
        name: tournament.name,
        gamertag: profile.gamertag,
        email: profile.email,
        teamId: teamId ?? undefined,
      }),
    });
    return { ok: true };
  },
});

/** Admin-only: approve or decline a tournament entry. */
export const setParticipantStatus = mutation({
  args: {
    participantId: v.id("tournamentParticipants"),
    status: v.union(v.literal("approved"), v.literal("declined")),
  },
  handler: async (ctx, { participantId, status }) => {
    await requireAdmin(ctx);
    const participant = await ctx.db.get(participantId);
    if (!participant) throw new ConvexError({ message: "Participant not found." });
    await ctx.db.patch(participantId, { status });
    const player = await ctx.db.get(participant.playerId);
    const tournament = await ctx.db.get(participant.tournamentId);
    if (player && tournament) {
      await ctx.scheduler.runAfter(0, api.notify.tournamentNotify, {
        tournamentId: participant.tournamentId,
        name: tournament.name,
        game: tournament.game,
        event: "status",
        status: tournament.status,
        message:
          status === "approved"
            ? `Your entry for ${tournament.name} is confirmed — you're in the bracket!`
            : `Your entry for ${tournament.name} was declined. Contact management if you believe this is a mistake.`,
        participants: [
          { name: player.gamertag, email: player.email, phone: player.phone ?? undefined },
        ],
      });
    }
  },
});

/** Admin-only: full participant list with player + team details. */
export const listParticipants = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("tournamentParticipants")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    const out: (Doc<"tournamentParticipants"> & {
      gamertag: string;
      email: string;
      phone?: string;
      teamName?: string;
    })[] = [];
    for (const row of rows) {
      const player = await ctx.db.get(row.playerId);
      if (!player) continue;
      const team = row.teamId ? await ctx.db.get(row.teamId) : undefined;
      out.push({
        ...row,
        gamertag: player.gamertag,
        email: player.email,
        phone: player.phone ?? undefined,
        teamName: team?.name,
      });
    }
    return out;
  },
});

// ---------------------------------------------------------------------------
// Bracket engine
// ---------------------------------------------------------------------------

/** How many match slots a single-elimination bracket needs for n entrants. */
function roundCountFor(n: number): number {
  return Math.ceil(Math.log2(n));
}

/**
 * Admin-only: generate a seeded single-elimination bracket from the approved
 * entries. Entrants are shuffled once; byes are placed so top seeds (earlier
 * positions) skip the first round. Any existing bracket is replaced.
 */
export const generateBracket = mutation({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    await requireAdmin(ctx);
    const tournament = await ctx.db.get(tournamentId);
    if (!tournament) throw new ConvexError({ message: "Tournament not found." });

    const participants = await ctx.db
      .query("tournamentParticipants")
      .withIndex("by_tournament_status", (q) =>
        q.eq("tournamentId", tournamentId).eq("status", "approved"),
      )
      .collect();
    if (participants.length < 2) {
      throw new ConvexError({ message: "Approve at least two entries before generating the bracket." });
    }

    // Clear any existing bracket.
    const old = await ctx.db
      .query("bracketNodes")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    for (const node of old) await ctx.db.delete(node._id);

    // Shuffle entries once (seeding shuffle) — Fisher–Yates.
    const entries = [...participants];
    for (let i = entries.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [entries[i], entries[j]] = [entries[j], entries[i]];
    }

    const rounds = roundCountFor(entries.length);
    const nodeIdsByRound: Id<"bracketNodes">[][] = [];

    // Create every node (rounds 0 → final), leaving nextNodeId for later.
    for (let round = 0; round < rounds; round++) {
      const matchCount = Math.ceil(entries.length / Math.pow(2, round + 1));
      const roundIds: Id<"bracketNodes">[] = [];
      for (let pos = 0; pos < matchCount; pos++) {
        const id = await ctx.db.insert("bracketNodes", {
          tournamentId,
          round,
          position: pos,
          status: "scheduled",
        });
        roundIds.push(id);
      }
      nodeIdsByRound.push(roundIds);
    }

    // Assign entrants to the first round (byes leave the B slot empty) and
    // link every node to its parent in the next round.
    const firstRound = nodeIdsByRound[0];
    for (let pos = 0; pos < firstRound.length; pos++) {
      const a = entries[pos * 2];
      const b = entries[pos * 2 + 1];
      const patch: Record<string, unknown> = {};
      if (a) {
        if (a.teamId) patch.teamAId = a.teamId;
        else patch.playerAId = a.playerId;
      }
      if (b) {
        if (b.teamId) patch.teamBId = b.teamId;
        else patch.playerBId = b.playerId;
      }
      await ctx.db.patch(firstRound[pos], patch);
    }
    for (let round = 0; round < rounds - 1; round++) {
      const current = nodeIdsByRound[round];
      const next = nodeIdsByRound[round + 1];
      for (let pos = 0; pos < current.length; pos++) {
        await ctx.db.patch(current[pos], { nextNodeId: next[Math.floor(pos / 2)] });
      }
    }

    const contacts = await collectContacts(ctx.db, tournamentId);
    await ctx.scheduler.runAfter(0, api.notify.tournamentNotify, {
      tournamentId,
      name: tournament.name,
      game: tournament.game,
      event: "bracket",
      status: tournament.status,
      message: `The bracket for ${tournament.name} is out — ${participants.length} entrants, single elimination. Check your match slots!`,
      participants: contacts,
    });
    await ctx.scheduler.runAfter(0, api.automation.triggerWorkflow, {
      event: "tournament.bracket",
      payload: JSON.stringify({
        tournamentId,
        name: tournament.name,
        entrants: participants.length,
        rounds,
      }),
    });
    return { rounds, matches: nodeIdsByRound.flat().length };
  },
});

/** Public: the bracket for a tournament, grouped by round with names resolved. */
export const getBracket = query({
  args: { tournamentId: v.id("tournaments") },
  handler: async (ctx, { tournamentId }) => {
    const nodes = await ctx.db
      .query("bracketNodes")
      .withIndex("by_tournament", (q) => q.eq("tournamentId", tournamentId))
      .collect();
    if (nodes.length === 0) return { rounds: [], totalNodes: 0 };
    const teamNames = new Map<Id<"teams">, string>();
    const playerNames = new Map<Id<"players">, string>();
    for (const node of nodes) {
      for (const teamId of [node.teamAId, node.teamBId, node.winnerTeamId]) {
        if (teamId && !teamNames.has(teamId)) {
          const team = await ctx.db.get(teamId);
          if (team) teamNames.set(teamId, team.name);
        }
      }
      for (const playerId of [node.playerAId, node.playerBId, node.winnerPlayerId]) {
        if (playerId && !playerNames.has(playerId)) {
          const player = await ctx.db.get(playerId);
          if (player) playerNames.set(playerId, player.gamertag);
        }
      }
    }
    const resolve = (node: Doc<"bracketNodes">, which: "A" | "B" | "winner") => {
      const teamId = which === "A" ? node.teamAId : which === "B" ? node.teamBId : node.winnerTeamId;
      const playerId = which === "A" ? node.playerAId : which === "B" ? node.playerBId : node.winnerPlayerId;
      if (teamId && teamNames.has(teamId)) return { kind: "team" as const, id: teamId, name: teamNames.get(teamId)! };
      if (playerId && playerNames.has(playerId)) return { kind: "player" as const, id: playerId, name: playerNames.get(playerId)! };
      return null;
    };
    const maxRound = Math.max(...nodes.map((n) => n.round));
    const rounds = Array.from({ length: maxRound + 1 }, (_, round) =>
      nodes
        .filter((n) => n.round === round)
        .sort((a, b) => a.position - b.position)
        .map((n) => ({
          nodeId: n._id,
          round: n.round,
          position: n.position,
          slotA: resolve(n, "A"),
          slotB: resolve(n, "B"),
          winner: resolve(n, "winner"),
          nextNodeId: n.nextNodeId,
          status: n.status,
        })),
    );
    return { rounds, totalNodes: nodes.length };
  },
});

/**
 * Admin-only: record the winner of a bracket slot. The winner is copied into
 * the parent slot automatically — run the bracket by entering results.
 */
export const recordBracketResult = mutation({
  args: {
    nodeId: v.id("bracketNodes"),
    winnerIsA: v.boolean(),
  },
  handler: async (ctx, { nodeId, winnerIsA }) => {
    await requireAdmin(ctx);
    const node = await ctx.db.get(nodeId);
    if (!node) throw new ConvexError({ message: "Bracket slot not found." });
    if (node.status === "completed") {
      throw new ConvexError({ message: "This slot already has a winner." });
    }
    const winnerTeam = winnerIsA ? node.teamAId : node.teamBId;
    const winnerPlayer = winnerIsA ? node.playerAId : node.playerBId;
    if (!winnerTeam && !winnerPlayer) {
      throw new ConvexError({ message: "This slot doesn't have an entrant on that side yet." });
    }
    await ctx.db.patch(nodeId, {
      winnerTeamId: winnerTeam ?? undefined,
      winnerPlayerId: winnerPlayer ?? undefined,
      status: "completed",
    });

    // Advance the winner into the parent slot.
    if (node.nextNodeId) {
      const parent = await ctx.db.get(node.nextNodeId);
      if (parent) {
        const patch: Record<string, unknown> = {};
        if (winnerTeam) {
          if (node.position % 2 === 0) patch.teamAId = winnerTeam;
          else patch.teamBId = winnerTeam;
        } else if (winnerPlayer) {
          if (node.position % 2 === 0) patch.playerAId = winnerPlayer;
          else patch.playerBId = winnerPlayer;
        }
        await ctx.db.patch(parent._id, patch);
      }
    }
    return { ok: true };
  },
});

// ---------------------------------------------------------------------------
// Automation
// ---------------------------------------------------------------------------

/**
 * Hourly auto-pilot (called by the cron job): moves tournaments through their
 * lifecycle by the clock and the bracket —
 *   upcoming → live  when the start date arrives
 *   live      → completed when the end date passes OR the final is decided
 * Every transition notifies participants and fires the Huginn workflow.
 */
export const autoStatusJob = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const tournaments = await ctx.db.query("tournaments").collect();
    for (const tournament of tournaments) {
      let next: Tournament["status"] | null = null;
      if (tournament.status === T_STATUS.UPCOMING && now >= tournament.startDate) {
        next = T_STATUS.LIVE;
      } else if (tournament.status === T_STATUS.LIVE) {
        const endedByDate = tournament.endDate ? now >= tournament.endDate : false;
        const nodes = await ctx.db
          .query("bracketNodes")
          .withIndex("by_tournament", (q) => q.eq("tournamentId", tournament._id))
          .collect();
        const final = nodes.find((n) => n.nextNodeId === undefined);
        const finalDecided = !!final && final.status === "completed";
        if (endedByDate || (nodes.length > 0 && finalDecided)) {
          next = T_STATUS.COMPLETED;
        }
      }
      if (next) {
        await ctx.db.patch(tournament._id, { status: next });
        const contacts = await collectContacts(ctx.db, tournament._id);
        await ctx.scheduler.runAfter(0, api.notify.tournamentNotify, {
          tournamentId: tournament._id,
          name: tournament.name,
          game: tournament.game,
          event: "status",
          status: next,
          message:
            next === T_STATUS.LIVE
              ? `${tournament.name} is now LIVE — check the bracket and be ready.`
              : `${tournament.name} has concluded. Thanks for competing!`,
          participants: contacts,
        });
        await ctx.scheduler.runAfter(0, api.automation.triggerWorkflow, {
          event: "tournament.status",
          payload: JSON.stringify({
            tournamentId: tournament._id,
            name: tournament.name,
            status: next,
            source: "auto",
          }),
        });
      }
    }
    return { ok: true, checked: tournaments.length };
  },
});
