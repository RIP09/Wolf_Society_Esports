import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { PLAYER_STATUS, TOURNAMENT_STATUS } from "./schema";

/** Public: approved players only, with photos resolved. */
export const listPlayers = query({
  args: {},
  handler: async (ctx) => {
    const players = await ctx.db
      .query("players")
      .filter((q) => q.eq(q.field("status"), PLAYER_STATUS.ACTIVE))
      .order("desc")
      .take(120);
    return Promise.all(
      players.map(async (p) => ({
        ...p,
        photoUrl: p.photoStorageId ? (await ctx.storage.getUrl(p.photoStorageId)) ?? undefined : undefined,
      })),
    );
  },
});

/** Public: teams with member counts, with photos resolved. */
export const listTeams = query({
  args: {},
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").order("desc").take(100);
    const members = await ctx.db.query("teamMembers").collect();
    const countByTeam = new Map<string, number>();
    for (const m of members) {
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

/** Public: a team with its roster and captain, photos resolved. */
export const getTeam = query({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    const team = await ctx.db.get(teamId);
    if (!team) throw new ConvexError({ message: "Team not found." });
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", teamId))
      .collect();
    const active = (await Promise.all(members.map((m) => ctx.db.get(m.playerId)))).filter(
      (p): p is NonNullable<typeof p> =>
        p !== null && p.status === PLAYER_STATUS.ACTIVE,
    );
    const players = await Promise.all(
      active.map(async (p) => ({
        ...p,
        photoUrl: p.photoStorageId ? (await ctx.storage.getUrl(p.photoStorageId)) ?? undefined : undefined,
      })),
    );
    const rawCaptain = team.captainId ? await ctx.db.get(team.captainId) : null;
    const captain =
      rawCaptain?.status === PLAYER_STATUS.ACTIVE ? rawCaptain : null;
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

/** Public: tournaments that are upcoming, live or completed. */
export const listTournaments = query({
  args: {},
  handler: async (ctx) => {
    const tournaments = await ctx.db.query("tournaments").order("desc").take(100);
    const matches = await ctx.db.query("matches").collect();
    const countByTournament = new Map<string, number>();
    for (const m of matches) {
      if (m.tournamentId) {
        countByTournament.set(m.tournamentId, (countByTournament.get(m.tournamentId) ?? 0) + 1);
      }
    }
    return tournaments
      .filter((t) => t.status !== TOURNAMENT_STATUS.CANCELLED)
      .map((t) => ({ ...t, matchCount: countByTournament.get(t._id) ?? 0 }));
  },
});

/** Public: recent matches with team and tournament names. */
export const listMatches = query({
  args: {},
  handler: async (ctx) => {
    const matches = await ctx.db.query("matches").order("desc").take(100);
    return Promise.all(
      matches.map(async (m) => {
        const [a, b, t] = await Promise.all([
          ctx.db.get(m.teamAId),
          ctx.db.get(m.teamBId),
          m.tournamentId ? ctx.db.get(m.tournamentId) : null,
        ]);
        return {
          ...m,
          teamAName: a?.name ?? "?",
          teamBName: b?.name ?? "?",
          tournamentName: t?.name ?? null,
        };
      }),
    );
  },
});

/** Public: latest announcements (news). */
export const listAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("announcements").order("desc").take(30);
  },
});

/** Public: everything the homepage needs, in one reactive query. */
export const getHome = query({
  args: {},
  handler: async (ctx) => {
    const [players, teams, tournaments, matches, entries, announcements] = await Promise.all([
      ctx.db.query("players").collect(),
      ctx.db.query("teams").collect(),
      ctx.db.query("tournaments").collect(),
      ctx.db.query("matches").collect(),
      ctx.db.query("performanceEntries").collect(),
      ctx.db.query("announcements").order("desc").take(3),
    ]);
    const activePlayers = players.filter((p) => p.status === PLAYER_STATUS.ACTIVE);

    // Top performers by K/D.
    const byPlayer = new Map<string, { kills: number; deaths: number }>();
    for (const e of entries) {
      const agg = byPlayer.get(e.playerId) ?? { kills: 0, deaths: 0 };
      agg.kills += e.kills;
      agg.deaths += e.deaths;
      byPlayer.set(e.playerId, agg);
    }
    const topPlayers = [...byPlayer.entries()]
      .map(([playerId, agg]) => {
        const p = players.find((x) => x._id === playerId);
        return {
          gamertag: p?.gamertag ?? "Unknown",
          game: p?.game ?? "",
          kd: agg.deaths > 0 ? Number((agg.kills / agg.deaths).toFixed(2)) : agg.kills,
        };
      })
      .filter((t) => t.gamertag !== "Unknown")
      .sort((a, b) => b.kd - a.kd)
      .slice(0, 6);

    // Upcoming fixtures.
    const upcoming = matches
      .filter((m) => m.status === "scheduled" && m.scheduledAt >= Date.now())
      .sort((a, b) => a.scheduledAt - b.scheduledAt)
      .slice(0, 5);
    const upcomingMatches = await Promise.all(
      upcoming.map(async (m) => {
        const [a, b, t] = await Promise.all([
          ctx.db.get(m.teamAId),
          ctx.db.get(m.teamBId),
          m.tournamentId ? ctx.db.get(m.tournamentId) : null,
        ]);
        return {
          ...m,
          teamAName: a?.name ?? "?",
          teamBName: b?.name ?? "?",
          tournamentName: t?.name ?? null,
        };
      }),
    );

    const memberships = await ctx.db.query("teamMembers").collect();
    const countByTeam = new Map<string, number>();
    for (const m of memberships) {
      countByTeam.set(m.teamId, (countByTeam.get(m.teamId) ?? 0) + 1);
    }

    return {
      counts: {
        players: activePlayers.length,
        teams: teams.length,
        tournaments: tournaments.filter((t) => t.status !== TOURNAMENT_STATUS.CANCELLED).length,
        matches: matches.length,
      },
      featuredTeams: teams.slice(0, 3).map((t) => ({ ...t, memberCount: countByTeam.get(t._id) ?? 0 })),
      upcomingMatches,
      topPlayers,
      announcements,
    };
  },
});

/**
 * Public contact form. Bot-protected by a honeypot field, persisted to the
 * database, forwarded to the organization by email, and auto-answered.
 */
export const contact = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    website: v.optional(v.string()), // honeypot — bots fill this, humans don't
  },
  handler: async (ctx, args) => {
    if (args.website) {
      throw new ConvexError({ message: "Your submission was rejected." });
    }
    const name = args.name.trim();
    const email = args.email.trim();
    const subject = args.subject.trim();
    const message = args.message.trim();
    if (name.length < 2) throw new ConvexError({ message: "Please enter your name." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ConvexError({ message: "Please enter a valid email address." });
    }
    if (subject.length < 2) throw new ConvexError({ message: "Please add a subject." });
    if (message.length < 10) {
      throw new ConvexError({ message: "Your message is too short." });
    }
    const id = await ctx.db.insert("contactMessages", {
      name,
      email,
      subject,
      message,
      read: false,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, api.notify.newContact, { name, email, subject, message });
    return { ok: true, id };
  },
});

/**
 * Public: subscribe to SMS + email alerts. Saved to the database and confirmed
 * automatically by email/SMS. Re-subscribing reactivates the existing record.
 */
export const subscribe = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = args.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ConvexError({ message: "Please enter a valid email address." });
    }
    const name = args.name?.trim() || undefined;
    const phone = args.phone?.trim() || undefined;

    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        active: true,
        name: name ?? existing.name,
        phone: phone ?? existing.phone,
      });
    } else {
      await ctx.db.insert("subscribers", {
        name,
        email,
        phone,
        active: true,
        createdAt: Date.now(),
      });
    }
    await ctx.scheduler.runAfter(0, api.notify.subscribeConfirmed, { name, email, phone });
    return { ok: true };
  },
});

/** Public: organization settings (stream channels, fees, socials). */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("settings").collect();
    const out: Record<string, string> = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  },
});

/** Public: the management / staff roster (names + roles, no private data). */
export const getStaff = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    return users
      .filter((u) => u.role === "admin" || u.role === "superadmin")
      .map((u) => ({
        name: u.name ?? "Wolf Society Staff",
        email: u.email ?? undefined,
        role: u.role,
      }))
      .sort((a, b) => (a.role === "superadmin" ? -1 : 0) - (b.role === "superadmin" ? -1 : 0));
  },
});
