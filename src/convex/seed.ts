import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireAdmin } from "./guards";
import { ANNOUNCEMENT_PRIORITY, ENTRY_TYPE, MATCH_RESULT, PLAYER_STATUS, TOURNAMENT_STATUS } from "./schema";

const GAMES = ["Valorant", "League of Legends", "Counter-Strike 2", "Dota 2", "Rocket League", "Apex Legends"];
const MAPS = ["Haven", "Ascent", "Bind", "Split", "Lotus", "Mirage", "Inferno", "Ancient", "Summoner's Rift"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Admin-only: populates demo data so the dashboards have something to show. */
export const seedDemoData = mutation({
  args: { withPlayers: v.optional(v.boolean()) },
  handler: async (ctx, { withPlayers }) => {
    await requireAdmin(ctx);
    const existingTeams = await ctx.db.query("teams").collect();
    if (existingTeams.length > 0) {
      throw new ConvexError({ message: "Demo data already exists." });
    }
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    const players = await ctx.db.query("players").collect();

    const teamA = await ctx.db.insert("teams", {
      name: "Alpha Division",
      tag: "ALP",
      game: "Valorant",
      description: "The Society's flagship roster — disciplined site execution and clean rotations.",
      captainId: players[0]?._id,
      createdAt: now - 40 * DAY,
    });
    const teamB = await ctx.db.insert("teams", {
      name: "Moonhowl",
      tag: "MNW",
      game: "Valorant",
      description: "Aggressive entry specialists known for lightning-fast site takes.",
      captainId: players[1]?._id,
      createdAt: now - 30 * DAY,
    });
    const teamC = await ctx.db.insert("teams", {
      name: "Nightstrike",
      tag: "NST",
      game: "Counter-Strike 2",
      description: "Clutch-heavy lineup grinding the path to Premier.",
      captainId: players[2]?._id,
      createdAt: now - 20 * DAY,
    });

    const tournament = await ctx.db.insert("tournaments", {
      name: "Wolf Society Championship",
      game: "Valorant",
      description: "Internal season opener — eight invited rosters, single elimination, finals night.",
      prizePool: 25000,
      startDate: now - 14 * DAY,
      endDate: now + 7 * DAY,
      status: TOURNAMENT_STATUS.LIVE,
      createdAt: now - 60 * DAY,
    });

    const matchDefs = [
      { a: teamA, b: teamB, t: tournament, map: "Haven", when: now - 9 * DAY, status: "completed", sa: 2, sb: 1 },
      { a: teamB, b: teamC, t: tournament, map: "Ascent", when: now - 6 * DAY, status: "completed", sa: 0, sb: 2 },
      { a: teamA, b: teamC, t: tournament, map: "Bind", when: now - 2 * DAY, status: "live", sa: 0, sb: 0 },
    ] as const;
    for (const m of matchDefs) {
      await ctx.db.insert("matches", {
        tournamentId: m.t,
        teamAId: m.a,
        teamBId: m.b,
        map: m.map,
        scheduledAt: m.when,
        status: m.status,
        scoreA: m.sa,
        scoreB: m.sb,
        winnerId: m.status === "completed" ? (m.sa > m.sb ? m.a : m.b) : undefined,
      });
    }
    // A future scheduled match.
    const futureTeam = await ctx.db.insert("teams", {
      name: "Timberline",
      tag: "TBR",
      game: "Valorant",
      description: "Rising challenger roster.",
      createdAt: now - 5 * DAY,
    });
    await ctx.db.insert("matches", {
      tournamentId: tournament,
      teamAId: teamA,
      teamBId: futureTeam,
      map: "Split",
      scheduledAt: now + 3 * DAY,
      status: "scheduled",
      scoreA: undefined,
      scoreB: undefined,
      winnerId: undefined,
    });

    await ctx.db.insert("announcements", {
      title: "Roster lock for the Society Championship",
      body: "Rosters lock 48 hours before each match day. Any changes go through the management desk in The Den.",
      priority: ANNOUNCEMENT_PRIORITY.IMPORTANT,
      authorId: (await requireAdmin(ctx))._id,
      createdAt: now - 1 * DAY,
    });
    await ctx.db.insert("announcements", {
      title: "Weekly scrim blocks released",
      body: "This week's scrim blocks are live on the schedule. Attendance is mandatory for starters.",
      priority: ANNOUNCEMENT_PRIORITY.INFO,
      authorId: (await requireAdmin(ctx))._id,
      createdAt: now - 3 * DAY,
    });

    // Performance history for every registered player.
    for (const p of players) {
      const count = 8 + Math.floor(Math.random() * 8);
      const baseKills = p.game === "Rocket League" ? 2 : 18;
      for (let i = 0; i < count; i++) {
        const kills = Math.max(0, Math.round(baseKills + (Math.random() * 14 - 5)));
        const deaths = Math.max(1, Math.round(8 + Math.random() * 14));
        await ctx.db.insert("performanceEntries", {
          playerId: p._id,
          matchType: pick([ENTRY_TYPE.SCRIM, ENTRY_TYPE.TOURNAMENT, ENTRY_TYPE.RANKED, ENTRY_TYPE.TRYOUT]),
          game: p.game ?? pick(GAMES),
          result: pick([MATCH_RESULT.WIN, MATCH_RESULT.WIN, MATCH_RESULT.LOSS, MATCH_RESULT.DRAW]),
          kills,
          deaths,
          assists: Math.max(0, Math.round(kills * (0.4 + Math.random() * 0.5))),
          damage: p.game === "Rocket League" ? undefined : Math.round(12000 + Math.random() * 16000),
          notes: Math.random() > 0.6 ? "Review VOD — strong util usage." : undefined,
          recordedAt: now - (count - i) * 0.7 * DAY - Math.floor(Math.random() * 6 * 3600e3),
        });
      }
    }

    // CMS articles for the public news portal.
    const adminId = (await requireAdmin(ctx))._id;
    await ctx.db.insert("content", {
      title: "Welcome to Wolf Society Esports",
      slug: "welcome-to-wolf-society-esports",
      category: "News",
      excerpt: "The Society is live — rosters, schedules and results now stream from one system.",
      body: "We're thrilled to open the den doors. Wolf Society Esports runs its entire organization — rosters, scrims, tournaments, performance and media — from a single live system.\n\nEverything you see here is managed in real time by our team: if the Den changes a roster, the public site reflects it instantly.\n\nFollow the pack on the news feed and watch page for match days, results and roster announcements.",
      coverColor: "bg-neo-purple",
      authorId: adminId,
      published: true,
      createdAt: now - 2 * DAY,
      updatedAt: now - 2 * DAY,
    });
    await ctx.db.insert("content", {
      title: "How we scout: inside the Society's tryout pipeline",
      slug: "how-we-scout-tryout-pipeline",
      category: "Recruiting",
      excerpt: "From public tryout to starting roster — a look at how new wolves earn their spot.",
      body: "Every player who joins the Society starts with a tryout. Sign up on the tryouts page, and our coaches review your game, role and region before inviting you to a live scrim.\n\nWe look for three things: game sense, communication and coachability. Raw aim gets you in the door; discipline keeps you on the roster.\n\nRegistered tryouts are reviewed by management in The Den, and every applicant is notified automatically by email.",
      coverColor: "bg-neo-blue",
      authorId: adminId,
      published: true,
      createdAt: now - 4 * DAY,
      updatedAt: now - 4 * DAY,
    });
    await ctx.db.insert("content", {
      title: "Match report: Alpha Division sweep the opener",
      slug: "match-report-alpha-division-opener",
      category: "Match Reports",
      excerpt: "Clean site executes and an unbreakable defence carried the opener 2–1.",
      body: "Alpha Division opened the Wolf Society Championship with a 2–1 win, closing out the series on Split after a tense overtime on Ascent.\n\nThe defensive halves set the tone — coordinated utility allowed only one spike plant across the final three rounds.\n\nNext up: the winners face Timberline in the upper bracket on Saturday. Stream it live on the watch page.",
      coverColor: "bg-neo-green",
      authorId: adminId,
      published: true,
      createdAt: now - 8 * DAY,
      updatedAt: now - 8 * DAY,
    });

    // Sponsors for the public partners page.
    await ctx.db.insert("sponsors", {
      name: "HyperX",
      website: "https://hyperx.com",
      tier: "platinum",
      description: "Official peripherals partner — headsets and keyboards for every roster.",
      sortOrder: 1,
      createdAt: now - 30 * DAY,
    });
    await ctx.db.insert("sponsors", {
      name: "Logitech G",
      website: "https://logitechg.com",
      tier: "gold",
      description: "Gear that keeps the pack responsive round after round.",
      sortOrder: 2,
      createdAt: now - 25 * DAY,
    });
    await ctx.db.insert("sponsors", {
      name: "Monster Energy",
      website: "https://monsterenergy.com",
      tier: "gold",
      description: "Fueling our scrim blocks and tournament weekends.",
      sortOrder: 3,
      createdAt: now - 20 * DAY,
    });
    await ctx.db.insert("sponsors", {
      name: "Secretlab",
      website: "https://secretlab.co",
      tier: "silver",
      description: "Chairs for the hours we put in at the desk.",
      sortOrder: 4,
      createdAt: now - 15 * DAY,
    });

    // Optional: a handful of pending registrations to approve.
    if (withPlayers) {
      // No fake auth users — pending profiles are created through the player app.
    }

    return { seeded: true };
  },
});
