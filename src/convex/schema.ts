import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  SUPER_ADMIN: "superadmin",
  ADMIN: "admin",
  PLAYER: "player",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.SUPER_ADMIN),
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.PLAYER),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

// --- Esports domain constants ---

export const PLAYER_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  SUSPENDED: "suspended",
} as const;
export const playerStatusValidator = v.union(
  v.literal(PLAYER_STATUS.PENDING),
  v.literal(PLAYER_STATUS.ACTIVE),
  v.literal(PLAYER_STATUS.SUSPENDED),
);
export type PlayerStatus = Infer<typeof playerStatusValidator>;

export const TOURNAMENT_STATUS = {
  UPCOMING: "upcoming",
  LIVE: "live",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;
export const tournamentStatusValidator = v.union(
  v.literal(TOURNAMENT_STATUS.UPCOMING),
  v.literal(TOURNAMENT_STATUS.LIVE),
  v.literal(TOURNAMENT_STATUS.COMPLETED),
  v.literal(TOURNAMENT_STATUS.CANCELLED),
);
export type TournamentStatus = Infer<typeof tournamentStatusValidator>;

export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  LIVE: "live",
  COMPLETED: "completed",
} as const;
export const matchStatusValidator = v.union(
  v.literal(MATCH_STATUS.SCHEDULED),
  v.literal(MATCH_STATUS.LIVE),
  v.literal(MATCH_STATUS.COMPLETED),
);
export type MatchStatus = Infer<typeof matchStatusValidator>;

export const MATCH_RESULT = {
  WIN: "win",
  LOSS: "loss",
  DRAW: "draw",
} as const;
export const matchResultValidator = v.union(
  v.literal(MATCH_RESULT.WIN),
  v.literal(MATCH_RESULT.LOSS),
  v.literal(MATCH_RESULT.DRAW),
);
export type MatchResult = Infer<typeof matchResultValidator>;

export const ENTRY_TYPE = {
  SCRIM: "scrim",
  TOURNAMENT: "tournament",
  RANKED: "ranked",
  TRYOUT: "tryout",
} as const;
export const entryTypeValidator = v.union(
  v.literal(ENTRY_TYPE.SCRIM),
  v.literal(ENTRY_TYPE.TOURNAMENT),
  v.literal(ENTRY_TYPE.RANKED),
  v.literal(ENTRY_TYPE.TRYOUT),
);
export type EntryType = Infer<typeof entryTypeValidator>;

export const ANNOUNCEMENT_PRIORITY = {
  INFO: "info",
  IMPORTANT: "important",
  URGENT: "urgent",
} as const;
export const announcementPriorityValidator = v.union(
  v.literal(ANNOUNCEMENT_PRIORITY.INFO),
  v.literal(ANNOUNCEMENT_PRIORITY.IMPORTANT),
  v.literal(ANNOUNCEMENT_PRIORITY.URGENT),
);
export type AnnouncementPriority = Infer<typeof announcementPriorityValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // --- Esports management domain ---

    // Player esports profile. Lives in the shared database; created by the
    // player through the Player app, managed/approved by admins in the Admin app.
    players: defineTable({
      userId: v.id("users"), // auth user behind this profile
      gamertag: v.string(), // unique display name
      realName: v.string(),
      email: v.string(),
      game: v.string(), // primary game (e.g. "Valorant")
      inGameRole: v.optional(v.string()), // e.g. Duelist / AWPer / Mid
      region: v.optional(v.string()),
      rank: v.optional(v.string()),
      bio: v.optional(v.string()),
      discord: v.optional(v.string()),
      status: playerStatusValidator, // pending / active / suspended
      joinedAt: v.number(),
    })
      .index("by_userId", ["userId"])
      .index("by_status", ["status"])
      .index("by_game", ["game"]),

    teams: defineTable({
      name: v.string(),
      tag: v.string(), // short tag like "VLT"
      game: v.string(),
      description: v.optional(v.string()),
      captainId: v.optional(v.id("players")),
      createdAt: v.number(),
    }).index("by_game", ["game"]),

    teamMembers: defineTable({
      teamId: v.id("teams"),
      playerId: v.id("players"),
      joinedAt: v.number(),
    })
      .index("by_team", ["teamId"])
      .index("by_player", ["playerId"]),

    tournaments: defineTable({
      name: v.string(),
      game: v.string(),
      description: v.optional(v.string()),
      prizePool: v.optional(v.number()),
      startDate: v.number(),
      endDate: v.optional(v.number()),
      status: tournamentStatusValidator,
      createdAt: v.number(),
    }).index("by_status", ["status"]),

    matches: defineTable({
      tournamentId: v.optional(v.id("tournaments")),
      teamAId: v.id("teams"),
      teamBId: v.id("teams"),
      map: v.optional(v.string()),
      scheduledAt: v.number(),
      status: matchStatusValidator,
      scoreA: v.optional(v.number()),
      scoreB: v.optional(v.number()),
      winnerId: v.optional(v.id("teams")),
    })
      .index("by_status", ["status"])
      .index("by_tournament", ["tournamentId"])
      .index("by_team", ["teamAId", "teamBId"]),

    // Performance entries logged by players, reviewed by admins.
    performanceEntries: defineTable({
      playerId: v.id("players"),
      matchType: entryTypeValidator,
      game: v.string(),
      result: matchResultValidator,
      kills: v.number(),
      deaths: v.number(),
      assists: v.number(),
      damage: v.optional(v.number()),
      notes: v.optional(v.string()),
      recordedAt: v.number(),
    })
      .index("by_player", ["playerId"])
      .index("by_game", ["game"])
      .index("by_recordedAt", ["recordedAt"]),

    announcements: defineTable({
      title: v.string(),
      body: v.string(),
      priority: announcementPriorityValidator,
      authorId: v.id("users"),
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    // Public contact-form submissions, reviewed in The Den.
    contactMessages: defineTable({
      name: v.string(),
      email: v.string(),
      subject: v.string(),
      message: v.string(),
      read: v.boolean(),
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    // Audit trail of blocked unauthorized-access attempts.
    securityLogs: defineTable({
      userId: v.optional(v.id("users")),
      email: v.optional(v.string()),
      reason: v.string(),
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    // Management portal access requests. Submitted publicly through The Den's
    // "request access" form; reviewed and granted by managers from the secret
    // grant page (linked from the notification email).
    accessRequests: defineTable({
      name: v.string(),
      email: v.string(),
      phone: v.string(),
      requestedRole: v.string(), // role the applicant asked for (e.g. "Manager")
      reason: v.optional(v.string()),
      status: v.union(
        v.literal("pending"),
        v.literal("granted"),
        v.literal("rejected"),
      ),
      grantedUserId: v.optional(v.string()), // auto-generated login ID, e.g. WSE-042
      grantedRole: v.optional(v.string()), // role actually granted
      grantedAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_email", ["email"]),

    // Public alert subscribers — receive SMS + email notifications whenever
    // the organization broadcasts public news.
    subscribers: defineTable({
      name: v.optional(v.string()),
      email: v.string(),
      phone: v.optional(v.string()),
      active: v.boolean(),
      createdAt: v.number(),
    }).index("by_email", ["email"]),

    // --- Content management system ---

    // Long-form articles for the public portal, managed from The Den.
    content: defineTable({
      title: v.string(),
      slug: v.string(),
      category: v.string(),
      excerpt: v.optional(v.string()),
      body: v.string(),
      coverColor: v.optional(v.string()), // neo accent for the cover tile
      authorId: v.id("users"),
      published: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_slug", ["slug"])
      .index("by_published", ["published"])
      .index("by_category", ["category"])
      .index("by_createdAt", ["createdAt"]),

    // Sponsors & partners showcased on the public portal.
    sponsors: defineTable({
      name: v.string(),
      website: v.optional(v.string()),
      tier: v.union(
        v.literal("platinum"),
        v.literal("gold"),
        v.literal("silver"),
        v.literal("partner"),
      ),
      description: v.optional(v.string()),
      sortOrder: v.number(),
      createdAt: v.number(),
    }),

    // Notification outbox — every email / SMS / Discord send is recorded here
    // so The Den can watch deliveries in real time.
    notifications: defineTable({
      channel: v.union(
        v.literal("email"),
        v.literal("sms"),
        v.literal("discord"),
      ),
      recipient: v.optional(v.string()),
      subject: v.optional(v.string()),
      status: v.union(
        v.literal("sent"),
        v.literal("failed"),
        v.literal("skipped"),
      ),
      error: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    // Privacy-friendly pageview analytics (path + referrer only).
    pageviews: defineTable({
      path: v.string(),
      referrer: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    // Public donations via Stripe Checkout.
    donations: defineTable({
      name: v.string(),
      email: v.string(),
      amount: v.number(), // minor units (paise / cents)
      currency: v.string(),
      note: v.optional(v.string()),
      status: v.union(v.literal("pending"), v.literal("paid")),
      stripeSessionId: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_session", ["stripeSessionId"]),

    // Tryout registrations — free or paid via Stripe Checkout.
    tryouts: defineTable({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      game: v.string(),
      inGameRole: v.optional(v.string()),
      region: v.optional(v.string()),
      note: v.optional(v.string()),
      feeStatus: v.union(v.literal("none"), v.literal("pending"), v.literal("paid")),
      status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
      stripeSessionId: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_session", ["stripeSessionId"]),

    // Organization settings — public portal config (streams, fees, socials…).
    settings: defineTable({
      key: v.string(),
      value: v.string(),
    }).index("by_key", ["key"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
