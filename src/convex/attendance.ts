import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { requireAdmin, requireUser } from "./guards";
import { PLAYER_STATUS } from "./schema";

export const ATTENDANCE_STATUS = {
  PRESENT: "present",
  LATE: "late",
  ABSENT: "absent",
  LEAVE: "leave",
} as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS];

export const ATTENDANCE_TYPES = {
  PRACTICE: "practice",
  MATCH: "match",
  OTHER: "other",
} as const;
export type AttendanceType = (typeof ATTENDANCE_TYPES)[keyof typeof ATTENDANCE_TYPES];

/** "YYYY-MM-DD" for a UTC calendar day — the attendance key. */
export function dateKey(ts: number = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/** Start-of-day epoch (UTC) for a dateKey. */
export function dayStart(key: string): number {
  return Date.parse(`${key}T00:00:00.000Z`);
}

/** The dateKey `days` calendar days before now. */
export function daysAgoKey(days: number, now: number = Date.now()): string {
  return dateKey(now - days * 24 * 60 * 60 * 1000);
}

/** The signed-in player's profile, or null when they aren't registered. */
async function myProfile(ctx: QueryCtx | MutationCtx) {
  const user = await requireUser(ctx);
  return await ctx.db
    .query("players")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .first();
}

/** Public helper reused by dashboards: streaks over a record list. */
export function attendanceStreaks(records: { dateKey: string; status: string }[]) {
  const byDay = new Map(records.map((r) => [r.dateKey, r.status]));
  let current = 0;
  let best = 0;
  let missed = 0;
  // Walk backwards from today; only count days where a record exists.
  let i = 0;
  while (true) {
    const key = daysAgoKey(i);
    const status = byDay.get(key);
    if (!status) break;
    const ok = status === ATTENDANCE_STATUS.PRESENT || status === ATTENDANCE_STATUS.LATE;
    if (ok) {
      current += 1;
      best = Math.max(best, current);
    } else {
      if (status === ATTENDANCE_STATUS.ABSENT) missed += 1;
      current = 0;
    }
    i += 1;
  }
  return { currentStreak: current, bestStreak: best, missedDays: missed };
}

/** Player: today's attendance card + streak summary. */
export const myStatus = query({
  args: {},
  handler: async (ctx) => {
    const profile = await myProfile(ctx);
    if (!profile) return null;
    const today = dateKey();
    const todayRecord = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", profile._id).eq("dateKey", today),
      )
      .first();
    const recent = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_player", (q) => q.eq("playerId", profile._id))
      .order("desc")
      .take(60);
    return {
      profile,
      today: todayRecord ?? null,
      streaks: attendanceStreaks(recent),
      checkedInToday: !!todayRecord && todayRecord.status !== ATTENDANCE_STATUS.ABSENT,
    };
  },
});

/** Player: their full attendance history. */
export const myHistory = query({
  args: {},
  handler: async (ctx) => {
    const profile = await myProfile(ctx);
    if (!profile) return [];
    return await ctx.db
      .query("attendanceRecords")
      .withIndex("by_player", (q) => q.eq("playerId", profile._id))
      .order("desc")
      .take(120);
  },
});

/**
 * Player: mark today's attendance. Verified (active) players only. Running it
 * again updates today's type / remarks (never a duplicate row).
 */
export const checkIn = mutation({
  args: {
    type: v.union(
      v.literal(ATTENDANCE_TYPES.PRACTICE),
      v.literal(ATTENDANCE_TYPES.MATCH),
      v.literal(ATTENDANCE_TYPES.OTHER),
    ),
    status: v.union(v.literal(ATTENDANCE_STATUS.PRESENT), v.literal(ATTENDANCE_STATUS.LATE)),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, { type, status, remarks }) => {
    const profile = await myProfile(ctx);
    if (!profile) throw new ConvexError({ message: "Register a player profile first." });
    if (profile.status !== PLAYER_STATUS.ACTIVE) {
      throw new ConvexError({
        message:
          profile.status === PLAYER_STATUS.PENDING
          ? "Your registration is pending management approval — you can check in once you're verified."
          : "Suspended players can't check in.",
      });
    }
    const today = dateKey();
    const existing = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", profile._id).eq("dateKey", today),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status,
        type,
        remarks: remarks?.trim() || existing.remarks,
        source: "manual",
        checkedInAt: Date.now(),
      });
      return { ok: true, updated: true, id: existing._id };
    }
    const id = await ctx.db.insert("attendanceRecords", {
      playerId: profile._id,
      dateKey: today,
      status,
      type,
      remarks: remarks?.trim() || undefined,
      source: "manual",
      checkedInAt: Date.now(),
      createdAt: Date.now(),
    });
    return { ok: true, updated: false, id };
  },
});

/** Player: request a leave day (sick / emergency). Management can adjust it. */
export const requestLeave = mutation({
  args: { date: v.string(), reason: v.string() },
  handler: async (ctx, { date, reason }) => {
    const profile = await myProfile(ctx);
    if (!profile) throw new ConvexError({ message: "Register a player profile first." });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new ConvexError({ message: "Invalid date." });
    }
    if (date > dateKey()) throw new ConvexError({ message: "You can only request leave for today or earlier." });
    const reasonTrim = reason.trim();
    if (reasonTrim.length < 2) throw new ConvexError({ message: "Please add a short reason for your leave." });
    const existing = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_player_date", (q) => q.eq("playerId", profile._id).eq("dateKey", date))
      .first();
    if (existing && existing.source === "manual") {
      await ctx.db.patch(existing._id, { status: ATTENDANCE_STATUS.LEAVE, remarks: reasonTrim });
      return { ok: true, id: existing._id };
    }
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    const id = await ctx.db.insert("attendanceRecords", {
      playerId: profile._id,
      dateKey: date,
      status: ATTENDANCE_STATUS.LEAVE,
      type: ATTENDANCE_TYPES.OTHER,
      remarks: reasonTrim,
      source: "manual",
      createdAt: Date.now(),
    });
    return { ok: true, id };
  },
});

/** Player: detailed post-match report. */
export const submitMatchReport = mutation({
  args: {
    game: v.string(),
    opponent: v.optional(v.string()),
    result: v.union(v.literal("win"), v.literal("loss"), v.literal("draw")),
    kills: v.number(),
    deaths: v.number(),
    assists: v.number(),
    damage: v.optional(v.number()),
    rating: v.optional(v.number()),
    rolePlayed: v.optional(v.string()),
    highlights: v.optional(v.string()),
    improvement: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const profile = await myProfile(ctx);
    if (!profile) throw new ConvexError({ message: "Register a player profile first." });
    if (profile.status !== PLAYER_STATUS.ACTIVE) {
      throw new ConvexError({ message: "Only verified players can submit match reports." });
    }
    const nums = [args.kills, args.deaths, args.assists, args.damage ?? 0];
    if (nums.some((n) => n < 0)) throw new ConvexError({ message: "Stats can't be negative." });
    if (args.rating !== undefined && (args.rating < 1 || args.rating > 10)) {
      throw new ConvexError({ message: "Rating must be between 1 and 10." });
    }
    if (!args.game.trim()) throw new ConvexError({ message: "Choose the game you played." });
    const id = await ctx.db.insert("matchReports", {
      playerId: profile._id,
      dateKey: dateKey(),
      game: args.game.trim(),
      opponent: args.opponent?.trim() || undefined,
      result: args.result,
      kills: Math.round(args.kills),
      deaths: Math.round(args.deaths),
      assists: Math.round(args.assists),
      damage: args.damage !== undefined ? Math.round(args.damage) : undefined,
      rating: args.rating,
      rolePlayed: args.rolePlayed?.trim() || undefined,
      highlights: args.highlights?.trim() || undefined,
      improvement: args.improvement?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
      submittedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.notify.matchReportSubmitted, {
      gamertag: profile.gamertag,
      game: args.game.trim(),
      result: args.result,
      kills: Math.round(args.kills),
      deaths: Math.round(args.deaths),
      assists: Math.round(args.assists),
    });
    return { ok: true, id };
  },
});

/** Player: delete their own match report (admins can delete any). */
export const removeMatchReport = mutation({
  args: { reportId: v.id("matchReports") },
  handler: async (ctx, { reportId }) => {
    const user = await requireUser(ctx);
    const report = await ctx.db.get(reportId);
    if (!report) throw new ConvexError({ message: "Report not found." });
    const profile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    const isOwner = profile?._id === report.playerId;
    if (!isOwner) await requireAdmin(ctx);
    await ctx.db.delete(reportId);
    return { ok: true };
  },
});

/** Player: their match reports. */
export const myMatchReports = query({
  args: {},
  handler: async (ctx) => {
    const profile = await myProfile(ctx);
    if (!profile) return [];
    return await ctx.db
      .query("matchReports")
      .withIndex("by_player", (q) => q.eq("playerId", profile._id))
      .order("desc")
      .take(60);
  },
});

/**
 * Admin: one day's attendance board. Every active player is listed with their
 * record for that date (or "—" if not yet processed), plus day totals.
 */
export const adminDay = query({
  args: { date: v.optional(v.string()) },
  handler: async (ctx, { date }) => {
    await requireAdmin(ctx);
    const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : dateKey();
    const players = await ctx.db
      .query("players")
      .withIndex("by_status", (q) => q.eq("status", PLAYER_STATUS.ACTIVE))
      .collect();
    const records = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_date", (q) => q.eq("dateKey", day))
      .collect();
    const byPlayer = new Map(records.map((r) => [r.playerId, r]));
    const rows = players.map((p) => ({ player: p, record: byPlayer.get(p._id) ?? null }));
    return {
      date: day,
      rows,
      totals: {
        present: records.filter((r) => r.status === "present").length,
        late: records.filter((r) => r.status === "late").length,
        absent: records.filter((r) => r.status === "absent").length,
        leave: records.filter((r) => r.status === "leave").length,
        marked: records.length,
        unmarked: players.length - records.length,
      },
    };
  },
});

/** Admin: full attendance history (joined with player info), newest first. */
export const adminHistory = query({
  args: { playerId: v.optional(v.id("players")), status: v.optional(v.string()) },
  handler: async (ctx, { playerId, status }) => {
    await requireAdmin(ctx);
    let records = await ctx.db.query("attendanceRecords").order("desc").take(600);
    if (playerId) records = records.filter((r) => r.playerId === playerId);
    if (status) records = records.filter((r) => r.status === status);
    const playerIds = [...new Set(records.map((r) => r.playerId))];
    const players = await Promise.all(playerIds.map((id) => ctx.db.get(id)));
    const byId = new Map(players.filter(Boolean).map((p) => [p!._id, p!]));
    return records.map((r) => ({
      ...r,
      gamertag: byId.get(r.playerId)?.gamertag ?? "Removed player",
      game: byId.get(r.playerId)?.game ?? "",
    }));
  },
});

/** Admin: 30-day attendance rates per player + AI flags (3+ consecutive misses). */
export const adminSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const players = await ctx.db
      .query("players")
      .withIndex("by_status", (q) => q.eq("status", PLAYER_STATUS.ACTIVE))
      .collect();
    const from = daysAgoKey(29);
    const records = await ctx.db
      .query("attendanceRecords")
      .filter((q) => q.gte(q.field("dateKey"), from))
      .collect();
    const byPlayer = new Map<string, Doc<"attendanceRecords">[]>();
    for (const r of records) {
      const list = byPlayer.get(r.playerId) ?? [];
      list.push(r);
      byPlayer.set(r.playerId, list);
    }
    const days = 30;
    const rows = players.map((p) => {
      const list = byPlayer.get(p._id) ?? [];
      const present = list.filter((r) => r.status === "present" || r.status === "late").length;
      const absent = list.filter((r) => r.status === "absent").length;
      const leave = list.filter((r) => r.status === "leave").length;
      const unmarked = Math.max(0, days - list.length);
      const rate = days > 0 ? Math.round(((present + leave) / days) * 100) : 0;
      const streaks = attendanceStreaks(list);
      return {
        player: p,
        present,
        absent,
        leave,
        unmarked,
        rate,
        currentStreak: streaks.currentStreak,
        bestStreak: streaks.bestStreak,
        autoAbsent: list.filter((r) => r.source === "auto").length,
        flag: streaks.missedDays >= 3 ? "consecutive-absences" : absent >= 5 ? "low-attendance" : null,
      };
    });
    return {
      days,
      rows: rows.sort((a, b) => a.rate - b.rate || b.absent - a.absent),
    };
  },
});

/** Admin: every match report joined with the player's gamertag. */
export const adminMatchReports = query({
  args: { playerId: v.optional(v.id("players")), game: v.optional(v.string()) },
  handler: async (ctx, { playerId, game }) => {
    await requireAdmin(ctx);
    let reports = await ctx.db.query("matchReports").order("desc").take(300);
    if (playerId) reports = reports.filter((r) => r.playerId === playerId);
    if (game) reports = reports.filter((r) => r.game === game);
    const playerIds = [...new Set(reports.map((r) => r.playerId))];
    const players = await Promise.all(playerIds.map((id) => ctx.db.get(id)));
    const byId = new Map(players.filter(Boolean).map((p) => [p!._id, p!]));
    return reports.map((r) => ({
      ...r,
      gamertag: byId.get(r.playerId)?.gamertag ?? "Removed player",
    }));
  },
});

/**
 * Admin: correct any player's record for any date (fix an auto-absent, approve
 * a leave, backfill a late check-in…). Fully audited in the security log.
 */
export const adminOverride = mutation({
  args: {
    playerId: v.id("players"),
    date: v.string(),
    status: v.union(
      v.literal("present"),
      v.literal("late"),
      v.literal("absent"),
      v.literal("leave"),
    ),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, { playerId, date, status, remarks }) => {
    const admin = await requireAdmin(ctx);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ConvexError({ message: "Invalid date." });
    const player = await ctx.db.get(playerId);
    if (!player) throw new ConvexError({ message: "Player not found." });
    const existing = await ctx.db
      .query("attendanceRecords")
      .withIndex("by_player_date", (q) =>
        q.eq("playerId", playerId).eq("dateKey", date),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        status,
        remarks: remarks?.trim() || existing.remarks,
        source: "manual",
      });
    } else {
      await ctx.db.insert("attendanceRecords", {
        playerId,
        dateKey: date,
        status,
        type: "other",
        remarks: remarks?.trim() || undefined,
        source: "manual",
        createdAt: Date.now(),
      });
    }
    await ctx.db.insert("securityLogs", {
      userId: admin._id,
      email: admin.email,
      reason: `Admin set attendance for ${player.gamertag} on ${date} to ${status}`,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/**
 * Admin: wipe ALL attendance records and match reports so tracking restarts
 * fresh from today. Player profiles, teams and security logs are kept; the AI
 * auto-absent job simply re-builds records for fully-elapsed days going forward.
 * Fully audited in the security log.
 */
export const resetAttendance = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    const records = await ctx.db.query("attendanceRecords").collect();
    const reports = await ctx.db.query("matchReports").collect();
    for (const r of records) await ctx.db.delete(r._id);
    for (const r of reports) await ctx.db.delete(r._id);
    await ctx.db.insert("securityLogs", {
      userId: admin._id,
      email: admin.email,
      reason: `Attendance data reset — cleared ${records.length} attendance records and ${reports.length} match reports`,
      createdAt: Date.now(),
    });
    return {
      ok: true,
      recordsCleared: records.length,
      reportsCleared: reports.length,
    };
  },
});

/**
 * THE AI ATTENDANCE JOB (cron, runs every 6h).
 *
 * Any verified player who has NO record for a calendar day that ended more
 * than 24 hours ago is automatically marked ABSENT (source: auto). The job is
 * idempotent — it only inserts rows that don't exist yet — and afterwards it
 * flags players with 3+ consecutive auto-misses to the management team.
 */
export const markAbsentJob = internalMutation({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_status", (q) => q.eq("status", PLAYER_STATUS.ACTIVE))
      .collect();
    if (players.length === 0) return { marked: 0, flags: [] };

    // Days that have fully elapsed (older than 24h). Process the last 3 so a
    // deployment gap never leaves a day unprocessed.
    const days = [1, 2, 3].map((d) => daysAgoKey(d));
    const existing = await ctx.db
      .query("attendanceRecords")
      .filter((q) => q.gte(q.field("dateKey"), days[2]))
      .collect();
    const hasRecord = new Set(existing.map((r) => `${r.playerId}:${r.dateKey}`));

    let marked = 0;
    const now = Date.now();
    for (const player of players) {
      for (const day of days) {
        if (!hasRecord.has(`${player._id}:${day}`)) {
          await ctx.db.insert("attendanceRecords", {
            playerId: player._id,
            dateKey: day,
            status: "absent",
            type: "other",
            remarks: "Auto-marked absent — no attendance check-in within the last 24 hours.",
            source: "auto",
            createdAt: now,
          });
          hasRecord.add(`${player._id}:${day}`);
          marked += 1;
        }
      }
    }

    // Flag players with 3+ consecutive auto-absences ending yesterday.
    const flags: { playerId: Id<"players">; gamertag: string }[] = [];
    for (const player of players) {
      const byDay = new Map<string, Doc<"attendanceRecords">>();
      for (const r of existing) {
        if (r.playerId === player._id) byDay.set(r.dateKey, r);
      }
      let streak = 0;
      for (let d = 1; d <= 10; d++) {
        const rec = byDay.get(daysAgoKey(d));
        if (!rec || rec.status !== "absent" || rec.source !== "auto") break;
        streak += 1;
      }
      if (streak >= 3) flags.push({ playerId: player._id, gamertag: player.gamertag });
    }

    if (flags.length > 0) {
      await ctx.scheduler.runAfter(0, api.notify.attendanceAlert, {
        players: flags.map((f) => f.gamertag),
        days: 3,
      });
    }
    return { marked, flags: flags.map((f) => f.gamertag) };
  },
});
