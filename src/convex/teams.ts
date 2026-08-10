import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { requireAdmin, requireUser } from "./guards";
import {
  ANNOUNCEMENT_PRIORITY,
  MATCH_STATUS,
  PLAYER_STATUS,
  TOURNAMENT_STATUS,
} from "./schema";

const DAY = 24 * 60 * 60 * 1000;

type MatchWithNames = Doc<"matches"> & {
  teamAName: string;
  teamBName: string;
  tournamentName: string | null;
};

/** One row of the unified realtime activity feed shown on the overview. */
type FeedItem = {
  kind:
    | "player"
    | "match"
    | "announcement"
    | "content"
    | "donation"
    | "tryout"
    | "inquiry"
    | "security"
    | "notification"
    | "access";
  title: string;
  meta: string;
  ts: number;
};

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function computeStats(entries: { result: string; kills: number; deaths: number; assists: number; damage?: number }[]) {
  const total = entries.length;
  const wins = entries.filter((e) => e.result === "win").length;
  const losses = entries.filter((e) => e.result === "loss").length;
  const draws = total - wins - losses;
  const kills = entries.reduce((s, e) => s + e.kills, 0);
  const deaths = entries.reduce((s, e) => s + e.deaths, 0);
  const assists = entries.reduce((s, e) => s + e.assists, 0);
  const damage = entries.reduce((s, e) => s + (e.damage ?? 0), 0);
  return {
    total,
    wins,
    losses,
    draws,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    kills,
    deaths,
    assists,
    kd: deaths > 0 ? Number((kills / deaths).toFixed(2)) : kills > 0 ? kills : 0,
    avgDamage: total > 0 ? Math.round(damage / total) : 0,
  };
}

/** Admin-only: everything the command-center overview needs. */
export const getAdminDashboard = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const [players, teams, tournaments, matches, entries, announcements] = await Promise.all([
      ctx.db.query("players").collect(),
      ctx.db.query("teams").collect(),
      ctx.db.query("tournaments").collect(),
      ctx.db.query("matches").collect(),
      ctx.db.query("performanceEntries").collect(),
      ctx.db.query("announcements").order("desc").take(3),
    ]);

    const counts = {
      players: players.length,
      activePlayers: players.filter((p) => p.status === PLAYER_STATUS.ACTIVE).length,
      pendingPlayers: players.filter((p) => p.status === PLAYER_STATUS.PENDING).length,
      suspendedPlayers: players.filter((p) => p.status === PLAYER_STATUS.SUSPENDED).length,
      teams: teams.length,
      tournaments: tournaments.length,
      matches: matches.length,
      entries: entries.length,
      announcements: announcements.length,
    };

    // ── Live counts for every data source the organization stores. Every
    // number here re-renders in real time whenever any portal writes. ──
    const [contentDocs, sponsorsDocs, inquiries, donations, tryouts, subscribers, accessReqs, announcementDocs, notifs, pageviews, securityDocs] = await Promise.all([
      ctx.db.query("content").collect(),
      ctx.db.query("sponsors").collect(),
      ctx.db.query("contactMessages").collect(),
      ctx.db.query("donations").collect(),
      ctx.db.query("tryouts").collect(),
      ctx.db.query("subscribers").collect(),
      ctx.db.query("accessRequests").collect(),
      ctx.db.query("announcements").collect(),
      ctx.db.query("notifications").collect(),
      ctx.db.query("pageviews").collect(),
      ctx.db.query("securityLogs").collect(),
    ]);
    const todayStart = startOfDay(Date.now());

    const live = {
      players: {
        total: counts.players,
        active: counts.activePlayers,
        pending: counts.pendingPlayers,
        suspended: counts.suspendedPlayers,
      },
      teams: teams.length,
      tournaments: {
        total: tournaments.length,
        live: tournaments.filter((t) => t.status === TOURNAMENT_STATUS.LIVE).length,
        upcoming: tournaments.filter((t) => t.status === TOURNAMENT_STATUS.UPCOMING).length,
        completed: tournaments.filter((t) => t.status === TOURNAMENT_STATUS.COMPLETED).length,
      },
      matches: {
        total: matches.length,
        live: matches.filter((m) => m.status === MATCH_STATUS.LIVE).length,
        scheduled: matches.filter((m) => m.status === MATCH_STATUS.SCHEDULED).length,
        completed: matches.filter((m) => m.status === MATCH_STATUS.COMPLETED).length,
      },
      entries: entries.length,
      announcements: {
        total: announcementDocs.length,
        urgent: announcementDocs.filter((a) => a.priority === ANNOUNCEMENT_PRIORITY.URGENT).length,
      },
      content: {
        total: contentDocs.length,
        published: contentDocs.filter((c) => c.published).length,
        drafts: contentDocs.filter((c) => !c.published).length,
      },
      sponsors: {
        total: sponsorsDocs.length,
        platinum: sponsorsDocs.filter((s) => s.tier === "platinum").length,
        gold: sponsorsDocs.filter((s) => s.tier === "gold").length,
        silver: sponsorsDocs.filter((s) => s.tier === "silver").length,
      },
      inquiries: {
        total: inquiries.length,
        unread: inquiries.filter((i) => !i.read).length,
      },
      donations: {
        total: donations.length,
        paid: donations.filter((d) => d.status === "paid").length,
        pending: donations.filter((d) => d.status === "pending").length,
        amountPaid: donations.filter((d) => d.status === "paid").reduce((s, d) => s + d.amount, 0),
      },
      tryouts: {
        total: tryouts.length,
        pending: tryouts.filter((t) => t.status === "pending").length,
        approved: tryouts.filter((t) => t.status === "approved").length,
        rejected: tryouts.filter((t) => t.status === "rejected").length,
        paid: tryouts.filter((t) => t.feeStatus === "paid").length,
      },
      subscribers: {
        total: subscribers.length,
        active: subscribers.filter((s) => s.active).length,
      },
      accessRequests: {
        total: accessReqs.length,
        pending: accessReqs.filter((r) => r.status === "pending").length,
        granted: accessReqs.filter((r) => r.status === "granted").length,
        rejected: accessReqs.filter((r) => r.status === "rejected").length,
      },
      security: securityDocs.length,
      notifications: {
        total: notifs.length,
        sent: notifs.filter((n) => n.status === "sent").length,
        failed: notifs.filter((n) => n.status === "failed").length,
      },
      pageviews: {
        total: pageviews.length,
        today: pageviews.filter((p) => p.createdAt >= todayStart).length,
      },
    };

    // Performance entries per day over the last 14 days.
    const today = startOfDay(Date.now());
    const buckets = Array.from({ length: 14 }, (_, i) => today - (13 - i) * DAY);
    const countsByDay = new Map<number, number>(buckets.map((b) => [b, 0]));
    for (const e of entries) {
      const day = startOfDay(e.recordedAt);
      if (countsByDay.has(day)) countsByDay.set(day, countsByDay.get(day)! + 1);
    }
    const entriesPerDay = buckets.map((b) => ({ day: b, count: countsByDay.get(b) ?? 0 }));

    // Top performers by K/D (players with at least one logged entry).
    const byPlayer = new Map<string, typeof entries>();
    for (const e of entries) {
      const list = byPlayer.get(e.playerId) ?? [];
      list.push(e);
      byPlayer.set(e.playerId, list);
    }
    const topPlayers = [...byPlayer.entries()]
      .map(([playerId, es]) => {
        const s = computeStats(es);
        return { playerId, gamertag: "…", game: "", kd: s.kd, matches: s.total, wins: s.wins, kills: s.kills, deaths: s.deaths };
      })
      .sort((a, b) => b.kd - a.kd)
      .slice(0, 6);
    const topIds = new Set(topPlayers.map((t) => t.playerId as Id<"players">));
    const playerDocs = (await Promise.all([...topIds].map((id) => ctx.db.get(id)))).filter(
      (p): p is Doc<"players"> => p !== null,
    );
    const byId = new Map(playerDocs.map((p) => [p._id, p] as const));
    for (const t of topPlayers) {
      const p = byId.get(t.playerId as Id<"players">);
      t.gamertag = p?.gamertag ?? "Unknown";
      t.game = p?.game ?? "";
    }

    // Recent registrations and matches.
    const recentPlayers = [...players].sort((a, b) => b.joinedAt - a.joinedAt).slice(0, 5);
    const recentMatches = [...matches].sort((a, b) => b.scheduledAt - a.scheduledAt).slice(0, 5);
    const matchNames = (await Promise.all(
      recentMatches.map(async (m) => {
        const [a, b, t] = await Promise.all([
          ctx.db.get(m.teamAId),
          ctx.db.get(m.teamBId),
          m.tournamentId ? ctx.db.get(m.tournamentId) : null,
        ]);
        return { ...m, teamAName: a?.name ?? "?", teamBName: b?.name ?? "?", tournamentName: t?.name ?? null };
      }),
    )) as MatchWithNames[];

    // ── Unified realtime activity feed across every portal. ──
    const recentSecurity = [...securityDocs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
    const recentNotifs = [...notifs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
    const recentDonations = [...donations].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
    const recentTryouts = [...tryouts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
    const recentInquiries = [...inquiries].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
    const recentAccess = [...accessReqs].sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);

    const feed: FeedItem[] = [
      ...recentPlayers.map((p) => ({
        kind: "player" as const,
        title: `${p.gamertag} registered`,
        meta: `${p.game}${p.region ? ` · ${p.region}` : ""}`,
        ts: p.joinedAt,
      })),
      ...announcements.map((a) => ({
        kind: "announcement" as const,
        title: a.title,
        meta: `Broadcast · ${a.priority}`,
        ts: a.createdAt,
      })),
      ...[...contentDocs].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3).map((c) => ({
        kind: "content" as const,
        title: c.title,
        meta: c.published ? "Published article" : "Draft saved",
        ts: c.updatedAt,
      })),
      ...matchNames.map((m) => ({
        kind: "match" as const,
        title: `${m.teamAName} vs ${m.teamBName}`,
        meta: m.status === "completed" ? `Final ${m.scoreA ?? 0}–${m.scoreB ?? 0}` : `Match · ${m.status}`,
        ts: m.scheduledAt,
      })),
      ...recentDonations.map((d) => ({
        kind: "donation" as const,
        title: `Donation from ${d.name}`,
        meta: `${d.currency.toUpperCase()} ${(d.amount / 100).toFixed(2)} · ${d.status}`,
        ts: d.createdAt,
      })),
      ...recentTryouts.map((t) => ({
        kind: "tryout" as const,
        title: `${t.name} — tryout application`,
        meta: `${t.game}${t.feeStatus !== "none" ? ` · fee ${t.feeStatus}` : ""}`,
        ts: t.createdAt,
      })),
      ...recentInquiries.map((i) => ({
        kind: "inquiry" as const,
        title: i.subject,
        meta: `From ${i.name}`,
        ts: i.createdAt,
      })),
      ...recentSecurity.map((s) => ({
        kind: "security" as const,
        title: "Blocked access attempt",
        meta: s.reason,
        ts: s.createdAt,
      })),
      ...recentNotifs.map((n) => ({
        kind: "notification" as const,
        title: n.subject ?? n.channel,
        meta: `${n.channel} · ${n.status}`,
        ts: n.createdAt,
      })),
      ...recentAccess.map((r) => ({
        kind: "access" as const,
        title: `${r.name} requested ${r.requestedRole}`,
        meta: `Access request · ${r.status}`,
        ts: r.createdAt,
      })),
    ];
    feed.sort((a, b) => b.ts - a.ts);

    return {
      counts,
      live,
      feed: feed.slice(0, 16),
      entriesPerDay,
      topPlayers,
      recentPlayers,
      recentMatches: matchNames,
      recentAnnouncements: announcements,
    };
  },
});

/** Player-facing: everything the player dashboard needs. */
export const getMyDashboard = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const profile = await ctx.db
      .query("players")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();

    const announcements = await ctx.db.query("announcements").order("desc").take(3);

    if (!profile) return { profile: null, team: null, stats: computeStats([]), recentEntries: [], kdTrend: [], upcomingMatches: [], announcements };

    const [entries, memberships] = await Promise.all([
      ctx.db.query("performanceEntries").withIndex("by_player", (q) => q.eq("playerId", profile._id)).order("desc").take(200),
      ctx.db.query("teamMembers").withIndex("by_player", (q) => q.eq("playerId", profile._id)).collect(),
    ]);

    // Team + roster.
    let team: {
      team: Doc<"teams">;
      players: Doc<"players">[];
      captain: Doc<"players"> | null;
    } | null = null;
    if (memberships.length > 0) {
      const teamDoc = await ctx.db.get(memberships[0].teamId);
      if (teamDoc) {
        const allMembers = await ctx.db
          .query("teamMembers")
          .withIndex("by_team", (q) => q.eq("teamId", teamDoc._id))
          .collect();
        const players = (await Promise.all(
          allMembers.map((m) => ctx.db.get(m.playerId)),
        )).filter((p): p is Doc<"players"> => p !== null);
        const captain = teamDoc.captainId ? await ctx.db.get(teamDoc.captainId) : null;
        team = { team: teamDoc, players, captain };
      }
    }

    // Upcoming matches involving my team.
    const teamIds = new Set(memberships.map((m) => m.teamId));
    let upcomingMatches: MatchWithNames[] = [];
    if (teamIds.size > 0) {
      const all = await ctx.db.query("matches").order("desc").take(300);
      const mine = all.filter(
        (m) =>
          m.status === MATCH_STATUS.SCHEDULED &&
          m.scheduledAt >= Date.now() - DAY &&
          (teamIds.has(m.teamAId) || teamIds.has(m.teamBId)),
      );
      upcomingMatches = (await Promise.all(
        mine.slice(0, 5).map(async (m) => {
          const [a, b, t] = await Promise.all([
            ctx.db.get(m.teamAId),
            ctx.db.get(m.teamBId),
            m.tournamentId ? ctx.db.get(m.tournamentId) : null,
          ]);
          return { ...m, teamAName: a?.name ?? "?", teamBName: b?.name ?? "?", tournamentName: t?.name ?? null };
        }),
      )) as MatchWithNames[];
    }

    const sorted = [...entries].sort((a, b) => b.recordedAt - a.recordedAt);
    const recentEntries = sorted.slice(0, 8);
    const kdTrend = sorted
      .slice(0, 10)
      .reverse()
      .map((e) => ({
        day: e.recordedAt,
        kd: e.deaths > 0 ? Number((e.kills / e.deaths).toFixed(2)) : e.kills,
        result: e.result,
      }));

    return {
      profile,
      team,
      stats: computeStats(entries),
      recentEntries,
      kdTrend,
      upcomingMatches,
      announcements,
    };
  },
});

/** Player-facing: aggregate stats for a specific player (admin detail view reuses this shape). */
export const forPlayer = query({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    await requireAdmin(ctx);
    const entries = await ctx.db
      .query("performanceEntries")
      .withIndex("by_player", (q) => q.eq("playerId", playerId))
      .order("desc")
      .take(300);
    const byType = new Map<string, number>();
    for (const e of entries) byType.set(e.matchType, (byType.get(e.matchType) ?? 0) + 1);
    return { ...computeStats(entries), byType: Object.fromEntries(byType) };
  },
});
