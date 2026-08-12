import { ConvexError, v } from "convex/values";
import { api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireAdmin, requireUser } from "./guards";
import {
  CONFIRMATION_STATUS,
  matchResultValidator,
  routineTypeValidator,
  SCRIM_STATUS,
  scrimStatusValidator,
} from "./schema";

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function fmtTime(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fmtWhen(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Active players on a team (used to fan out scrim notifications). */
async function teamPlayers(
  ctx: MutationCtx,
  teamId: Id<"teams"> | undefined,
): Promise<{ name: string; email: string; phone?: string }[]> {
  if (!teamId) return [];
  const members = await ctx.db
    .query("teamMembers")
    .withIndex("by_team", (q) => q.eq("teamId", teamId))
    .collect();
  const players = (await Promise.all(members.map((m) => ctx.db.get(m.playerId)))).filter(
    (p): p is Doc<"players"> => p !== null && p.status === "active",
  );
  return players.map((p) => ({ name: p.gamertag, email: p.email, phone: p.phone }));
}

/** The Den → Schedule Hub: every block with this week's attendance, every scrim, teams. */
export const adminHub = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [blocks, confirmations, scrims, teams] = await Promise.all([
      ctx.db.query("routineBlocks").collect(),
      ctx.db.query("routineConfirmations").collect(),
      ctx.db.query("scrims").collect(),
      ctx.db.query("teams").collect(),
    ]);

    const weekStart = startOfDay(Date.now());
    const weekEnd = weekStart + 6 * DAY;

    const blocksWithAttendance = blocks.map((b) => {
      const week = confirmations.filter(
        (c) => c.blockId === b._id && c.date >= weekStart && c.date <= weekEnd,
      );
      const byDay = new Map<number, { confirmed: number; declined: number; maybe: number }>();
      for (const c of week) {
        const row = byDay.get(c.date) ?? { confirmed: 0, declined: 0, maybe: 0 };
        if (c.status === CONFIRMATION_STATUS.CONFIRMED) row.confirmed += 1;
        else if (c.status === CONFIRMATION_STATUS.DECLINED) row.declined += 1;
        else row.maybe += 1;
        byDay.set(c.date, row);
      }
      return {
        ...b,
        attendance: [...byDay.entries()].map(([date, counts]) => ({ date, ...counts })),
      };
    });

    const teamNames = new Map(teams.map((t) => [t._id, t.name] as const));
    const completed = scrims.filter((s) => s.status === SCRIM_STATUS.COMPLETED);
    return {
      blocks: blocksWithAttendance.sort(
        (a, b) =>
          a.dayOfWeek - b.dayOfWeek ||
          a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute),
      ),
      scrims: scrims
        .map((s) => ({ ...s, teamName: s.teamId ? teamNames.get(s.teamId) ?? null : null }))
        .sort((a, b) => a.scheduledAt - b.scheduledAt),
      teams,
      record: {
        wins: completed.filter((s) => s.result === "win").length,
        losses: completed.filter((s) => s.result === "loss").length,
        draws: completed.filter((s) => s.result === "draw").length,
      },
    };
  },
});

/** The Den: create a recurring routine block and broadcast it. */
export const createRoutineBlock = mutation({
  args: {
    title: v.string(),
    type: routineTypeValidator,
    game: v.string(),
    teamId: v.optional(v.id("teams")),
    dayOfWeek: v.number(),
    startHour: v.number(),
    startMinute: v.number(),
    durationMin: v.number(),
    location: v.optional(v.string()),
    required: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    const title = args.title.trim();
    if (title.length < 2) throw new ConvexError({ message: "Block title is required." });
    if (args.startHour < 0 || args.startHour > 23 || args.startMinute < 0 || args.startMinute > 59) {
      throw new ConvexError({ message: "Invalid start time." });
    }
    if (args.durationMin <= 0) throw new ConvexError({ message: "Duration must be positive." });
    const blockId = await ctx.db.insert("routineBlocks", {
      ...args,
      title,
      createdBy: user._id,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.notify.routineBroadcast, {
      title,
      game: args.game,
      whenLabel: `${DAY_NAMES[args.dayOfWeek]} · ${fmtTime(args.startHour, args.startMinute)} · ${args.durationMin} min`,
      audience: args.teamId ? "Assigned team" : "All teams",
      createdBy: user.name ?? "Management",
    });
    return blockId;
  },
});

/** The Den: edit a routine block. */
export const updateRoutineBlock = mutation({
  args: {
    blockId: v.id("routineBlocks"),
    title: v.string(),
    type: routineTypeValidator,
    game: v.string(),
    teamId: v.optional(v.id("teams")),
    dayOfWeek: v.number(),
    startHour: v.number(),
    startMinute: v.number(),
    durationMin: v.number(),
    location: v.optional(v.string()),
    required: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { blockId, ...patch } = args;
    const block = await ctx.db.get(blockId);
    if (!block) throw new ConvexError({ message: "Block not found." });
    await ctx.db.patch(blockId, { ...patch, title: patch.title.trim() });
    await ctx.scheduler.runAfter(0, api.notify.routineBroadcast, {
      title: patch.title.trim(),
      game: patch.game,
      whenLabel: `${DAY_NAMES[patch.dayOfWeek]} · ${fmtTime(patch.startHour, patch.startMinute)} · ${patch.durationMin} min`,
      audience: patch.teamId ? "Assigned team" : "All teams",
      createdBy: "Schedule Hub",
    });
  },
});

/** The Den: delete a routine block and its confirmations. */
export const deleteRoutineBlock = mutation({
  args: { blockId: v.id("routineBlocks") },
  handler: async (ctx, { blockId }) => {
    await requireAdmin(ctx);
    const block = await ctx.db.get(blockId);
    if (!block) throw new ConvexError({ message: "Block not found." });
    const confs = await ctx.db
      .query("routineConfirmations")
      .withIndex("by_block_date", (q) => q.eq("blockId", blockId))
      .collect();
    for (const c of confs) await ctx.db.delete(c._id);
    await ctx.db.delete(blockId);
  },
});

/** The Den: propose a new scrim slot and alert the org. */
export const createScrim = mutation({
  args: {
    title: v.string(),
    game: v.string(),
    teamId: v.optional(v.id("teams")),
    opponentName: v.string(),
    opponentContact: v.optional(v.string()),
    scheduledAt: v.number(),
    durationMin: v.number(),
    format: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAdmin(ctx);
    const title = args.title.trim();
    const opponentName = args.opponentName.trim();
    if (title.length < 2) throw new ConvexError({ message: "Scrim title is required." });
    if (opponentName.length < 2) throw new ConvexError({ message: "Opponent name is required." });
    if (args.durationMin <= 0) throw new ConvexError({ message: "Duration must be positive." });
    const scrimId = await ctx.db.insert("scrims", {
      ...args,
      title,
      opponentName,
      status: SCRIM_STATUS.PROPOSED,
      createdBy: user._id,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.notify.scrimNotify, {
      title,
      game: args.game,
      opponent: opponentName,
      whenLabel: fmtWhen(args.scheduledAt),
      event: "proposed",
      players: [],
    });
    return scrimId;
  },
});

/** The Den: edit a scrim. Confirming fires roster notifications + the 3h reminder. */
export const updateScrim = mutation({
  args: {
    scrimId: v.id("scrims"),
    title: v.optional(v.string()),
    game: v.optional(v.string()),
    teamId: v.optional(v.id("teams")),
    opponentName: v.optional(v.string()),
    opponentContact: v.optional(v.string()),
    scheduledAt: v.optional(v.number()),
    durationMin: v.optional(v.number()),
    format: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(scrimStatusValidator),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { scrimId, ...patch } = args;
    const scrim = await ctx.db.get(scrimId);
    if (!scrim) throw new ConvexError({ message: "Scrim not found." });
    await ctx.db.patch(scrimId, patch);
    const next = { ...scrim, ...patch };

    if (patch.status === SCRIM_STATUS.CONFIRMED && scrim.status !== SCRIM_STATUS.CONFIRMED) {
      const players = await teamPlayers(ctx, next.teamId);
      await ctx.scheduler.runAfter(0, api.notify.scrimNotify, {
        title: next.title,
        game: next.game,
        opponent: next.opponentName,
        whenLabel: fmtWhen(next.scheduledAt),
        event: "confirmed",
        players,
      });
      const delay = next.scheduledAt - 3 * HOUR - Date.now();
      if (delay > 0) {
        await ctx.scheduler.runAfter(delay, api.notify.scrimReminder, {
          scrimId,
          title: next.title,
          game: next.game,
          opponent: next.opponentName,
          scheduledAt: next.scheduledAt,
          players,
        });
      }
    }
    if (patch.status === SCRIM_STATUS.CANCELLED && scrim.status !== SCRIM_STATUS.CANCELLED) {
      const players = await teamPlayers(ctx, next.teamId);
      await ctx.scheduler.runAfter(0, api.notify.scrimNotify, {
        title: next.title,
        game: next.game,
        opponent: next.opponentName,
        whenLabel: fmtWhen(next.scheduledAt),
        event: "cancelled",
        players,
      });
    }
    return scrimId;
  },
});

/** The Den: log a scrim result → completed + broadcast. */
export const logScrimResult = mutation({
  args: {
    scrimId: v.id("scrims"),
    result: matchResultValidator,
    scoreUs: v.optional(v.number()),
    scoreThem: v.optional(v.number()),
    vodUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const scrim = await ctx.db.get(args.scrimId);
    if (!scrim) throw new ConvexError({ message: "Scrim not found." });
    await ctx.db.patch(args.scrimId, {
      status: SCRIM_STATUS.COMPLETED,
      result: args.result,
      scoreUs: args.scoreUs,
      scoreThem: args.scoreThem,
      vodUrl: args.vodUrl,
      notes: args.notes,
    });
    const players = await teamPlayers(ctx, scrim.teamId);
    const scoreLine =
      args.scoreUs !== undefined && args.scoreThem !== undefined
        ? `${args.scoreUs}–${args.scoreThem}`
        : "—";
    await ctx.scheduler.runAfter(0, api.notify.scrimNotify, {
      title: scrim.title,
      game: scrim.game,
      opponent: scrim.opponentName,
      whenLabel: fmtWhen(scrim.scheduledAt),
      event: "completed",
      resultLine: `${args.result.toUpperCase()} ${scoreLine} vs ${scrim.opponentName}`,
      players,
    });
  },
});

/** The Den: delete a scrim. */
export const deleteScrim = mutation({
  args: { scrimId: v.id("scrims") },
  handler: async (ctx, { scrimId }) => {
    await requireAdmin(ctx);
    const scrim = await ctx.db.get(scrimId);
    if (!scrim) throw new ConvexError({ message: "Scrim not found." });
    await ctx.db.delete(scrimId);
  },
});

/** The Pack: my 7-day schedule (blocks for my team/game) + my scrims. */
export const mySchedule = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!profile) return { days: [], scrims: [], teamName: null, profile: null };

    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_player", (q) => q.eq("playerId", profile._id))
      .collect();
    const myTeamId = memberships[0]?.teamId ?? null;
    const team = myTeamId ? await ctx.db.get(myTeamId) : null;

    const [blocks, allConfirmations, allScrims] = await Promise.all([
      ctx.db.query("routineBlocks").collect(),
      ctx.db.query("routineConfirmations").collect(),
      ctx.db.query("scrims").order("desc").take(300),
    ]);

    const applicable = blocks.filter(
      (b) =>
        (!b.teamId || b.teamId === myTeamId) &&
        (b.game === "all" || b.game === profile.game),
    );

    const today = startOfDay(Date.now());
    const week = Array.from({ length: 7 }, (_, i) => today + i * DAY);

    const mine = new Map<string, string>();
    for (const c of allConfirmations) {
      if (c.playerId === profile._id) mine.set(`${c.blockId}:${c.date}`, c.status);
    }

    const days = week.map((date) => {
      const dow = new Date(date).getDay();
      const dayBlocks = applicable
        .filter((b) => b.dayOfWeek === dow)
        .sort((a, b) => a.startHour * 60 + a.startMinute - (b.startHour * 60 + b.startMinute));
      return {
        date,
        blocks: dayBlocks.map((b) => {
          const row = allConfirmations.filter((c) => c.blockId === b._id && c.date === date);
          return {
            ...b,
            myStatus: mine.get(`${b._id}:${date}`) ?? null,
            confirmed: row.filter((c) => c.status === CONFIRMATION_STATUS.CONFIRMED).length,
            declined: row.filter((c) => c.status === CONFIRMATION_STATUS.DECLINED).length,
            maybe: row.filter((c) => c.status === CONFIRMATION_STATUS.MAYBE).length,
          };
        }),
      };
    });

    const upcomingScrims = allScrims
      .filter(
        (s) =>
          s.status !== SCRIM_STATUS.CANCELLED &&
          s.scheduledAt >= Date.now() - DAY &&
          (!s.teamId || s.teamId === myTeamId),
      )
      .sort((a, b) => a.scheduledAt - b.scheduledAt)
      .slice(0, 10);

    return { days, scrims: upcomingScrims, teamName: team?.name ?? null, profile };
  },
});

/** The Pack: player sets attendance for a concrete routine session. */
export const setMyConfirmation = mutation({
  args: {
    blockId: v.id("routineBlocks"),
    date: v.number(),
    status: v.union(
      v.literal(CONFIRMATION_STATUS.CONFIRMED),
      v.literal(CONFIRMATION_STATUS.DECLINED),
      v.literal(CONFIRMATION_STATUS.MAYBE),
      v.literal("none"),
    ),
  },
  handler: async (ctx, { blockId, date, status }) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!profile) throw new ConvexError({ message: "Register a player profile first." });
    const day = startOfDay(date);
    const existing = await ctx.db
      .query("routineConfirmations")
      .withIndex("by_block_date", (q) => q.eq("blockId", blockId).eq("date", day))
      .filter((q) => q.eq(q.field("playerId"), profile._id))
      .first();
    if (status === "none") {
      if (existing) await ctx.db.delete(existing._id);
      return;
    }
    if (existing) {
      await ctx.db.patch(existing._id, { status, createdAt: Date.now() });
    } else {
      await ctx.db.insert("routineConfirmations", {
        blockId,
        playerId: profile._id,
        date: day,
        status,
        createdAt: Date.now(),
      });
    }
  },
});

/** Public: confirmed + completed scrims only (never leaks proposed slots). */
export const listPublicScrims = query({
  args: {},
  handler: async (ctx) => {
    const [scrims, teams] = await Promise.all([
      ctx.db.query("scrims").order("desc").take(100),
      ctx.db.query("teams").collect(),
    ]);
    const teamNames = new Map(teams.map((t) => [t._id, t.name] as const));
    return scrims
      .filter((s) => s.status === SCRIM_STATUS.CONFIRMED || s.status === SCRIM_STATUS.COMPLETED)
      .sort((a, b) => b.scheduledAt - a.scheduledAt)
      .map((s) => ({ ...s, teamName: s.teamId ? teamNames.get(s.teamId) ?? null : null }));
  },
});
