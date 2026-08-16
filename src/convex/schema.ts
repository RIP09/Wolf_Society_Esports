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

// --- Schedule Hub: daily routines + scrims ---

export const ROUTINE_TYPES = {
  PRACTICE: "practice",
  VOD: "vod",
  PHYSICAL: "physical",
  CONTENT: "content",
  MEETING: "meeting",
  REST: "rest",
} as const;
export const routineTypeValidator = v.union(
  v.literal(ROUTINE_TYPES.PRACTICE),
  v.literal(ROUTINE_TYPES.VOD),
  v.literal(ROUTINE_TYPES.PHYSICAL),
  v.literal(ROUTINE_TYPES.CONTENT),
  v.literal(ROUTINE_TYPES.MEETING),
  v.literal(ROUTINE_TYPES.REST),
);
export type RoutineType = Infer<typeof routineTypeValidator>;

export const SCRIM_STATUS = {
  PROPOSED: "proposed",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;
export const scrimStatusValidator = v.union(
  v.literal(SCRIM_STATUS.PROPOSED),
  v.literal(SCRIM_STATUS.CONFIRMED),
  v.literal(SCRIM_STATUS.COMPLETED),
  v.literal(SCRIM_STATUS.CANCELLED),
);
export type ScrimStatus = Infer<typeof scrimStatusValidator>;

export const CONFIRMATION_STATUS = {
  CONFIRMED: "confirmed",
  DECLINED: "declined",
  MAYBE: "maybe",
} as const;
export const confirmationStatusValidator = v.union(
  v.literal(CONFIRMATION_STATUS.CONFIRMED),
  v.literal(CONFIRMATION_STATUS.DECLINED),
  v.literal(CONFIRMATION_STATUS.MAYBE),
);
export type ConfirmationStatus = Infer<typeof confirmationStatusValidator>;

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
      phone: v.optional(v.string()), // full number incl. dial code, e.g. "+91 98765 43210" — enables real SMS reminders
      phoneCountryCode: v.optional(v.string()), // dial code only, e.g. "+91"
      age: v.optional(v.number()), // age in years
      nationality: v.optional(v.string()), // country the player lives in
      platform: v.optional(v.string()), // PC / Console / Mobile…
      secondaryGame: v.optional(v.string()), // second esports title (optional)
      gameIds: v.optional(v.string()), // in-game ID for the primary game (Riot ID, Steam…)
      experienceLevel: v.optional(v.string()), // new / casual / amateur / semi-pro / pro
      weeklyHours: v.optional(v.string()), // practice time available per week
      previousTeams: v.optional(v.string()),
      achievements: v.optional(v.string()),
      socials: v.optional(v.string()), // Twitch / YouTube / X links
      photoStorageId: v.optional(v.id("_storage")), // player photo uploaded from The Den
      status: playerStatusValidator, // pending / active / suspended
      verifiedAt: v.optional(v.number()), // when management approved this player
      phoneVerifiedAt: v.optional(v.number()), // when the player proved ownership of their phone via SMS OTP
      badges: v.optional(v.array(v.string())), // verified role badges, e.g. ["MVP", "IGL", "Captain"]
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
      photoStorageId: v.optional(v.id("_storage")), // team crest/photo uploaded from The Den
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

    // Tournament entries — players (or their team) sign up for a tournament;
    // management approves entries before the bracket is generated.
    tournamentParticipants: defineTable({
      tournamentId: v.id("tournaments"),
      playerId: v.id("players"), // the player who registered (captain for a team entry)
      teamId: v.optional(v.id("teams")), // set when the player registers their team
      status: v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("declined"),
      ),
      registeredAt: v.number(),
    })
      .index("by_tournament", ["tournamentId"])
      .index("by_player", ["playerId"])
      .index("by_tournament_status", ["tournamentId", "status"]),

    // Single-elimination bracket — one row per match slot. Each slot holds
    // either a team (teamXId) or a solo player (playerXId); `nextNodeId` links
    // to the parent slot so recording a winner auto-advances the entrant.
    bracketNodes: defineTable({
      tournamentId: v.id("tournaments"),
      round: v.number(), // 0 = first round … roundCount-1 = final
      position: v.number(), // index within the round
      teamAId: v.optional(v.id("teams")),
      playerAId: v.optional(v.id("players")),
      teamBId: v.optional(v.id("teams")),
      playerBId: v.optional(v.id("players")),
      winnerTeamId: v.optional(v.id("teams")),
      winnerPlayerId: v.optional(v.id("players")),
      nextNodeId: v.optional(v.id("bracketNodes")), // parent slot in the next round
      status: matchStatusValidator,
    })
      .index("by_tournament", ["tournamentId"])
      .index("by_tournament_round", ["tournamentId", "round"]),

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

    // Public contact-form submissions, reviewed in The Den. The extra fields
    // capture everything the org needs to reply: phone + dial code (worldwide
    // country-code picker), who the sender is, the esports title, organization
    // name, country/region and how they'd like to be reached.
    contactMessages: defineTable({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()), // full number incl. dial code, e.g. "+91 98765 43210"
      phoneCountryCode: v.optional(v.string()), // dial code only, e.g. "+91"
      category: v.optional(v.string()), // Player / Fan / Organization / Media / Coach…
      game: v.optional(v.string()), // esports title the inquiry is about
      organization: v.optional(v.string()), // brand / team / company name
      country: v.optional(v.string()), // country or region
      replyPreference: v.optional(v.string()), // Email / Phone / Both / No preference
      subject: v.string(), // chosen from options or written by the user
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
      userId: v.optional(v.id("users")), // set when managed from the Account page
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
      imageStorageId: v.optional(v.id("_storage")), // uploaded cover image
      authorId: v.id("users"),
      published: v.boolean(),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_slug", ["slug"])
      .index("by_published", ["published"])
      .index("by_category", ["category"])
      .index("by_createdAt", ["createdAt"]),

    // Media gallery photos — uploaded from The Den and shown on the public
    // /gallery page in real time, grouped by category (Matches / Practice /
    // Events). Each row owns one storage file so removals clean up fully.
    gallery: defineTable({
      caption: v.string(),
      category: v.string(), // Matches / Practice / Events
      storageId: v.id("_storage"),
      uploadedBy: v.id("users"),
      createdAt: v.number(),
    })
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

    // Notification outbox — every email / SMS / Discord / Huginn webhook send is
    // recorded here so The Den can watch deliveries in real time.
    notifications: defineTable({
      channel: v.union(
        v.literal("email"),
        v.literal("sms"),
        v.literal("whatsapp"),
        v.literal("discord"),
        v.literal("webhook"),
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

    // Lightweight anti-abuse rate limiting for public forms (contact, alerts,
    // feedback, tryouts). Keys are action + target (usually the email); the
    // counter window resets automatically when it ages out.
    rateLimits: defineTable({
      key: v.string(),
      windowStart: v.number(),
      count: v.number(),
    }).index("by_key", ["key"]),

    // Free, unlimited web-push subscriptions (VAPID) — one row per device.
    // Anonymous visitor id tags the device; the push action sends to all rows.
    pushSubscriptions: defineTable({
      visitorId: v.optional(v.string()),
      endpoint: v.string(),
      keysJson: v.string(),
      createdAt: v.number(),
    }).index("by_endpoint", ["endpoint"]),

    // One-time SMS one-time-passwords (phone verification). A row is created
    // when a user requests a code, checked on verify, and deleted after use or
    // expiry so old codes can never be reused.
    smsOtps: defineTable({
      phone: v.string(), // full international number, e.g. "+91 98765 43210"
      code: v.string(), // 6-digit code
      expiresAt: v.number(),
      attempts: v.number(), // failed verify attempts — locks after 5
      verified: v.boolean(),
      createdAt: v.number(),
    }).index("by_phone", ["phone"]),

    // Broadcast history — every send from The Den → Broadcast Center, with
    // per-channel delivery counts so management can see who was reached and when.
    broadcasts: defineTable({
      title: v.string(),
      body: v.string(),
      url: v.optional(v.string()),
      channels: v.array(v.string()), // "push" | "email" | "sms"
      pushSent: v.number(),
      emailSent: v.number(),
      smsSent: v.number(),
      createdBy: v.id("users"),
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    // Public feedback / suggestions — reviewed in The Den.
    feedback: defineTable({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      rating: v.optional(v.number()),
      message: v.string(),
      status: v.union(v.literal("new"), v.literal("read")),
      createdAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_createdAt", ["createdAt"]),

    // AI assistant replies returned by the Huginn chat workflow. The "Ask Wolf"
    // widget asks for a chatId, Huginn's PostAgent POSTs the finished reply back
    // to /huginn-reply, and this table delivers it to the open chat live.
    assistantReplies: defineTable({
      chatId: v.string(),
      reply: v.string(),
      createdAt: v.number(),
    }).index("by_chatId", ["chatId"]),

    // Privacy-friendly pageview analytics (path + referrer only). The extra
    // fields power the live footer visitor counter: one row per page load,
    // tagged with a per-visitor id and country (auto-detected, not PII).
    pageviews: defineTable({
      path: v.string(),
      referrer: v.optional(v.string()),
      visitorId: v.optional(v.string()),
      country: v.optional(v.string()),
      countryCode: v.optional(v.string()),
      createdAt: v.number(),
    }).index("by_createdAt", ["createdAt"]),

    // Daily attendance — one row per player per calendar day. Players check
    // in when they practice or play; the AI attendance job automatically marks
    // "absent" anyone who didn't check in within the last 24h. Leave requests
    // and corrections are managed from The Den.
    attendanceRecords: defineTable({
      playerId: v.id("players"),
      dateKey: v.string(), // "YYYY-MM-DD" (UTC calendar day)
      status: v.union(
        v.literal("present"),
        v.literal("late"),
        v.literal("absent"),
        v.literal("leave"),
      ),
      type: v.union(
        v.literal("practice"),
        v.literal("match"),
        v.literal("other"),
      ), // what they attended
      remarks: v.optional(v.string()), // player's own remarks for the day
      source: v.union(v.literal("manual"), v.literal("auto")), // auto = AI marked absent
      checkedInAt: v.optional(v.number()),
      createdAt: v.number(),
    })
      .index("by_player_date", ["playerId", "dateKey"])
      .index("by_date", ["dateKey"])
      .index("by_player", ["playerId"]),

    // Detailed post-match reports — every verified player fills one in after
    // practice matches / tournaments: stats, role, self-rating, highlights and
    // what to improve. Management sees all of it live in The Den.
    matchReports: defineTable({
      playerId: v.id("players"),
      dateKey: v.string(),
      game: v.string(),
      opponent: v.optional(v.string()),
      result: matchResultValidator,
      kills: v.number(),
      deaths: v.number(),
      assists: v.number(),
      damage: v.optional(v.number()),
      rating: v.optional(v.number()), // 1–10 self performance rating
      rolePlayed: v.optional(v.string()),
      highlights: v.optional(v.string()),
      improvement: v.optional(v.string()),
      notes: v.optional(v.string()),
      submittedAt: v.number(),
    })
      .index("by_player", ["playerId"])
      .index("by_date", ["dateKey"])
      .index("by_submittedAt", ["submittedAt"]),

    // One row per unique visitor — exact unique counts + country breakdown
    // for the realtime footer widget. Upserted automatically on every pageview.
    visitors: defineTable({
      visitorId: v.string(),
      country: v.optional(v.string()),
      countryCode: v.optional(v.string()),
      firstSeen: v.number(),
      lastSeen: v.number(),
      views: v.number(),
    })
      .index("by_visitorId", ["visitorId"])
      .index("by_lastSeen", ["lastSeen"]),

    // Realtime presence — one row per visitor currently on the site. Heartbeat
    // mutations upsert this every ~30s and sweep stale rows, so the public
    // footer and The Den can show a live "online right now" counter.
    presence: defineTable({
      visitorId: v.string(),
      path: v.optional(v.string()), // current page path, for "on this page" counts
      lastSeen: v.number(),
    })
      .index("by_visitorId", ["visitorId"])
      .index("by_lastSeen", ["lastSeen"]),

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

    // --- Schedule Hub: daily routines + scrims ---

    // Recurring weekly routine blocks (practice, VOD review, physical, content…).
    // teamId unset = applies to every team; game "all" = every title.
    routineBlocks: defineTable({
      title: v.string(),
      type: routineTypeValidator,
      game: v.string(), // "all" or a specific esports title
      teamId: v.optional(v.id("teams")),
      dayOfWeek: v.number(), // 0 (Sunday) .. 6 (Saturday)
      startHour: v.number(), // 0-23
      startMinute: v.number(), // 0-59
      durationMin: v.number(),
      location: v.optional(v.string()),
      required: v.boolean(),
      createdBy: v.id("users"),
      createdAt: v.number(),
    }).index("by_team", ["teamId"]),

    // Player attendance responses for concrete routine sessions.
    routineConfirmations: defineTable({
      blockId: v.id("routineBlocks"),
      playerId: v.id("players"),
      date: v.number(), // start-of-day epoch of the concrete session
      status: confirmationStatusValidator,
      createdAt: v.number(),
    })
      .index("by_block_date", ["blockId", "date"])
      .index("by_player", ["playerId"]),

    // Scrim slots booked against other organizations.
    scrims: defineTable({
      title: v.string(),
      game: v.string(),
      teamId: v.optional(v.id("teams")),
      opponentName: v.string(),
      opponentContact: v.optional(v.string()),
      scheduledAt: v.number(),
      durationMin: v.number(),
      format: v.optional(v.string()), // Bo1 / Bo3 / Bo5
      status: scrimStatusValidator,
      result: v.optional(matchResultValidator),
      scoreUs: v.optional(v.number()),
      scoreThem: v.optional(v.number()),
      vodUrl: v.optional(v.string()),
      notes: v.optional(v.string()),
      createdBy: v.id("users"),
      createdAt: v.number(),
    })
      .index("by_status", ["status"])
      .index("by_scheduledAt", ["scheduledAt"]),

    // Organization settings — public portal config (streams, fees, socials…).
    settings: defineTable({
      key: v.string(),
      value: v.string(),
    }).index("by_key", ["key"]),

    // Private management staff profiles — one row per staff member (admin/
    // superadmin). Staff edit their own details here (name/email live on the
    // users table; everything else lives here). Rows are readable only by the
    // owner and the Super Admin — regular managers never see each other's
    // edited details. Password changes are handled by the auth provider and are
    // NEVER stored or logged on this table or anywhere else.
    staffProfiles: defineTable({
      userId: v.id("users"),
      phone: v.optional(v.string()),
      title: v.optional(v.string()), // optional job title / designation
      location: v.optional(v.string()),
      timezone: v.optional(v.string()),
      discord: v.optional(v.string()),
      gameFocus: v.optional(v.string()),
      bio: v.optional(v.string()),
      socials: v.optional(v.string()),
      updatedAt: v.number(),
    }).index("by_userId", ["userId"]),

    // --- Fan Zone: polls, trivia, predictions, rankings ---
    // One row per fan (or signed-in user). xp accumulates from polls (5),
    // trivia answers (question points for correct answers) and predictions
    // (2 for entering, 10 more when the prediction settles correctly). The
    // leaderboard is this table sorted by xp. displayName is empty until the
    // fan claims a name — unnamed profiles participate but don't rank.
    fanProfiles: defineTable({
      userId: v.optional(v.id("users")),
      visitorId: v.optional(v.string()),
      displayName: v.string(),
      xp: v.number(),
      answers: v.number(), // total trivia + prediction entries
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_userId", ["userId"])
      .index("by_visitorId", ["visitorId"])
      .index("by_xp", ["xp"]),

    // Polls — a question with 2+ options. Fans vote once each; results are
    // shown live with per-option counts.
    polls: defineTable({
      question: v.string(),
      options: v.array(v.string()),
      active: v.boolean(),
      endsAt: v.optional(v.number()),
      createdBy: v.id("users"),
      createdAt: v.number(),
    }).index("by_active", ["active"]),

    // One row per vote. voterKey is "user:<id>" for signed-in fans or
    // "visitor:<id>" for anonymous guests (counted but not ranked).
    pollVotes: defineTable({
      pollId: v.id("polls"),
      voterKey: v.string(),
      optionIndex: v.number(),
      createdAt: v.number(),
    })
      .index("by_poll", ["pollId"])
      .index("by_poll_voter", ["pollId", "voterKey"])
      .index("by_createdAt", ["createdAt"]),

    // Trivia questions — the correct answer is hidden from the public API;
    // it's only returned after the fan answers (and to management).
    triviaQuestions: defineTable({
      question: v.string(),
      options: v.array(v.string()),
      correctIndex: v.number(),
      points: v.number(),
      active: v.boolean(),
      createdBy: v.id("users"),
      createdAt: v.number(),
    }).index("by_active", ["active"]),

    // One row per answer. First answer per question counts; wrong answers
    // earn 0 points but are kept so fans can review what they got right.
    triviaAnswers: defineTable({
      questionId: v.id("triviaQuestions"),
      voterKey: v.string(),
      choiceIndex: v.number(),
      correct: v.boolean(),
      pointsEarned: v.number(),
      createdAt: v.number(),
    })
      .index("by_question", ["questionId"])
      .index("by_question_voter", ["questionId", "voterKey"]),

    // Match predictions — fans call the outcome before the match. When
    // management settles with the real result, correct entries earn +10 XP.
    predictions: defineTable({
      title: v.string(),
      options: v.array(v.string()),
      correctIndex: v.optional(v.number()),
      points: v.number(), // entry points (usually 2)
      status: v.union(v.literal("open"), v.literal("settled")),
      endsAt: v.optional(v.number()),
      createdBy: v.id("users"),
      createdAt: v.number(),
      settledAt: v.optional(v.number()),
    }).index("by_status", ["status"]),

    // One row per prediction entry. correct/pointsEarned are filled in when
    // management settles the prediction.
    predictionEntries: defineTable({
      predictionId: v.id("predictions"),
      voterKey: v.string(),
      choiceIndex: v.number(),
      correct: v.optional(v.boolean()),
      pointsEarned: v.number(),
      createdAt: v.number(),
    })
      .index("by_prediction", ["predictionId"])
      .index("by_prediction_voter", ["predictionId", "voterKey"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
