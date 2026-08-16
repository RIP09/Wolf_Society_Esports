import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import { requireAdmin, requireUser } from "./guards";
import { getCurrentUser } from "./users";

/**
 * Fan Zone — polls, trivia, predictions and rankings for the public portal.
 *
 * Every fan gets a `voterKey`: `user:<id>` when signed in, or
 * `visitor:<id>` for anonymous guests. Guest votes/predictions/answers are
 * counted in the live results, but only signed-in fans earn XP and appear on
 * the leaderboard (they claim a display name first).
 *
 * XP economy (kept simple and readable):
 *   - Cast a poll vote ......... +5 XP  (once per poll)
 *   - Answer trivia ............ +question.points (default 10) if correct
 *   - Enter a prediction ....... +2 XP  (once per prediction)
 *   - Prediction settles right . +10 XP bonus
 */

const POLL_XP = 5;
const PREDICTION_ENTRY_XP = 2;
const PREDICTION_CORRECT_XP = 10;

/** Resolve who is acting: signed-in user key, else the anonymous visitor key. */
async function resolveVoterKey(
  ctx: MutationCtx,
  visitorId?: string,
): Promise<{ key: string; userId: string | null }> {
  const user = await getCurrentUser(ctx);
  if (user) return { key: `user:${user._id}`, userId: user._id };
  if (visitorId && visitorId.trim()) {
    return { key: `visitor:${visitorId.trim().slice(0, 120)}`, userId: null };
  }
  throw new ConvexError({
    message: "Sign in or enable guest participation to take part in the Fan Zone.",
  });
}

/** Add XP to a signed-in fan's profile (anonymous visitors don't earn XP). */
async function awardXp(
  ctx: MutationCtx,
  userId: string | null,
  delta: number,
  nameHint?: string,
) {
  if (!userId || delta <= 0) return;
  const existing = await ctx.db
    .query("fanProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId as Id<"users">))
    .first();
  if (existing) {
    await ctx.db.patch(existing._id, {
      xp: existing.xp + delta,
      answers: existing.answers + 1,
      updatedAt: Date.now(),
    });
    return;
  }
  await ctx.db.insert("fanProfiles", {
    userId: userId as Id<"users">,
    displayName: (nameHint ?? "").slice(0, 40),
    xp: delta,
    answers: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/** Human-friendly name for a voter key, for the live activity feed. */
async function voterLabel(ctx: QueryCtx, key: string): Promise<string> {
  if (key.startsWith("user:")) {
    const id = key.slice(5) as Id<"users">;
    const user = await ctx.db.get(id);
    if (user?.name) return user.name;
    if (user?.email) return user.email.split("@")[0].slice(0, 20);
    return "Fan";
  }
  return `Fan-${key.slice(8).replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase() || "0000"}`;
}

// ---------------------------------------------------------------------------
// Public queries
// ---------------------------------------------------------------------------

/** Hub page — live counts, top fans and the recent activity ticker. */
export const hub = query({
  args: { voterKey: v.optional(v.string()) },
  handler: async (ctx, { voterKey }) => {
    const openPolls = await ctx.db
      .query("polls")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    const trivia = await ctx.db
      .query("triviaQuestions")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    const predictions = await ctx.db
      .query("predictions")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();
    const ranked = await ctx.db
      .query("fanProfiles")
      .withIndex("by_xp")
      .order("desc")
      .take(5);

    // Recent activity: last 6 votes + 4 answers + 4 prediction entries.
    const recentVotes = await ctx.db
      .query("pollVotes")
      .withIndex("by_createdAt")
      .order("desc")
      .take(6);
    const answers = await ctx.db.query("triviaAnswers").order("desc").take(4);
    const entries = await ctx.db.query("predictionEntries").order("desc").take(4);

    const pollById = new Map(
      (await ctx.db.query("polls").collect()).map((p) => [p._id, p]),
    );
    const triviaById = new Map(trivia.map((t) => [t._id, t]));

    const activity = [
      ...recentVotes.map(async (row) => ({
        at: row.createdAt,
        text: `${await voterLabel(ctx, row.voterKey)} voted in “${pollById.get(row.pollId)?.question ?? "a poll"}”`,
      })),
      ...answers.map(async (row) => ({
        at: row.createdAt,
        text: `${await voterLabel(ctx, row.voterKey)} answered “${triviaById.get(row.questionId)?.question ?? "trivia"}”${row.correct ? " correctly" : ""}`,
      })),
      ...entries.map(async (row) => ({
        at: row.createdAt,
        text: `${await voterLabel(ctx, row.voterKey)} placed a prediction`,
      })),
    ];
    const resolved = await Promise.all(activity);
    resolved.sort((a, b) => b.at - a.at);

    return {
      openPolls: openPolls.length,
      triviaCount: trivia.length,
      openPredictions: predictions.length,
      rankedFans: ranked.map((r) => ({ name: r.displayName, xp: r.xp, answers: r.answers })),
      activity: resolved.slice(0, 12),
      myRank: voterKey ? await myRankOf(ctx, voterKey) : null,
    };
  },
});

async function myRankOf(ctx: QueryCtx, voterKey: string): Promise<number | null> {
  if (!voterKey.startsWith("user:")) return null;
  const id = voterKey.slice(5) as Id<"users">;
  const me = await ctx.db
    .query("fanProfiles")
    .withIndex("by_userId", (q) => q.eq("userId", id))
    .first();
  if (!me) return null;
  const ahead = await ctx.db
    .query("fanProfiles")
    .withIndex("by_xp")
    .filter((q) => q.gt(q.field("xp"), me.xp))
    .collect();
  return ahead.length + 1;
}

/** All polls with live per-option counts and the caller's own vote. */
export const listPolls = query({
  args: { voterKey: v.optional(v.string()) },
  handler: async (ctx, { voterKey }) => {
    const polls = await ctx.db
      .query("polls")
      .withIndex("by_active", (q) => q.eq("active", true))
      .order("desc")
      .collect();
    return Promise.all(
      polls.map(async (poll) => {
        const votes = await ctx.db
          .query("pollVotes")
          .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
          .collect();
        const counts = poll.options.map((_, i) => votes.filter((v) => v.optionIndex === i).length);
        const mine = voterKey
          ? votes.find((v) => v.voterKey === voterKey)?.optionIndex ?? null
          : null;
        return {
          _id: poll._id,
          question: poll.question,
          options: poll.options,
          counts,
          totalVotes: votes.length,
          myVote: mine,
          endsAt: poll.endsAt,
        };
      }),
    );
  },
});

/** Active trivia questions — the correct answer is NEVER exposed here. */
export const listTrivia = query({
  args: { voterKey: v.optional(v.string()) },
  handler: async (ctx, { voterKey }) => {
    const questions = await ctx.db
      .query("triviaQuestions")
      .withIndex("by_active", (q) => q.eq("active", true))
      .order("desc")
      .collect();
    return Promise.all(
      questions.map(async (q) => {
        const answers = await ctx.db
          .query("triviaAnswers")
          .withIndex("by_question", (q2) => q2.eq("questionId", q._id))
          .collect();
        const mine = voterKey
          ? answers.find((a) => a.voterKey === voterKey) ?? null
          : null;
        return {
          _id: q._id,
          question: q.question,
          options: q.options,
          points: q.points,
          answeredCount: answers.length,
          correctCount: answers.filter((a) => a.correct).length,
          myAnswer: mine
            ? { choiceIndex: mine.choiceIndex, correct: mine.correct, pointsEarned: mine.pointsEarned }
            : null,
        };
      }),
    );
  },
});

/** Predictions — open ones (no answer) and settled ones (with result). */
export const listPredictions = query({
  args: { voterKey: v.optional(v.string()) },
  handler: async (ctx, { voterKey }) => {
    const all = await ctx.db.query("predictions").order("desc").take(50);
    return Promise.all(
      all.map(async (p) => {
        const entries = await ctx.db
          .query("predictionEntries")
          .withIndex("by_prediction", (q) => q.eq("predictionId", p._id))
          .collect();
        const counts = p.options.map((_, i) => entries.filter((e) => e.choiceIndex === i).length);
        const mine = voterKey
          ? entries.find((e) => e.voterKey === voterKey) ?? null
          : null;
        return {
          _id: p._id,
          title: p.title,
          options: p.options,
          points: p.points,
          status: p.status,
          endsAt: p.endsAt,
          settledAt: p.settledAt,
          correctIndex: p.status === "settled" ? p.correctIndex : undefined,
          counts,
          totalEntries: entries.length,
          myEntry: mine
            ? { choiceIndex: mine.choiceIndex, correct: mine.correct, pointsEarned: mine.pointsEarned }
            : null,
        };
      }),
    );
  },
});

/** The leaderboard — top 50 named fans + the caller's own rank. */
export const rankings = query({
  args: { voterKey: v.optional(v.string()) },
  handler: async (ctx, { voterKey }) => {
    const top = await ctx.db
      .query("fanProfiles")
      .withIndex("by_xp")
      .order("desc")
      .take(100);
    const named = top.filter((r) => r.displayName.trim().length > 0).slice(0, 50);
    const total = await ctx.db.query("fanProfiles").collect();
    let me = null;
    if (voterKey?.startsWith("user:")) {
      const id = voterKey.slice(5) as Id<"users">;
      const row = await ctx.db
        .query("fanProfiles")
        .withIndex("by_userId", (q) => q.eq("userId", id))
        .first();
      if (row) {
        const ahead = await ctx.db
          .query("fanProfiles")
          .withIndex("by_xp")
          .filter((q) => q.gt(q.field("xp"), row.xp))
          .collect();
        me = {
          rank: ahead.length + 1,
          name: row.displayName || "Unnamed fan",
          xp: row.xp,
          answers: row.answers,
        };
      }
    }
    return {
      top: named.map((r, i) => ({
        rank: i + 1,
        name: r.displayName,
        xp: r.xp,
        answers: r.answers,
      })),
      totalFans: total.filter((t) => t.displayName.trim().length > 0).length,
      me,
    };
  },
});

/** The signed-in fan's own profile (for the claim/status card). */
export const myProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    const row = await ctx.db
      .query("fanProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    return row
      ? { displayName: row.displayName, xp: row.xp, answers: row.answers }
      : null;
  },
});

// ---------------------------------------------------------------------------
// Public mutations
// ---------------------------------------------------------------------------

/** Signed-in fans pick the name shown on the leaderboard. */
export const claimProfile = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, { displayName }) => {
    const user = await requireUser(ctx);
    const name = displayName.trim().slice(0, 40);
    if (name.length < 2) {
      throw new ConvexError({ message: "Choose a display name of at least 2 characters." });
    }
    const existing = await ctx.db
      .query("fanProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        displayName: name,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("fanProfiles", {
        userId: user._id,
        displayName: name,
        xp: 0,
        answers: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    return { ok: true };
  },
});

/** Cast one vote per poll. +5 XP for signed-in fans. */
export const castPollVote = mutation({
  args: {
    pollId: v.id("polls"),
    optionIndex: v.number(),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, { pollId, optionIndex, visitorId }) => {
    const poll = await ctx.db.get(pollId);
    if (!poll || !poll.active) {
      throw new ConvexError({ message: "This poll is no longer open." });
    }
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      throw new ConvexError({ message: "That option doesn't exist." });
    }
    const { key, userId } = await resolveVoterKey(ctx, visitorId);
    const existing = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll_voter", (q) => q.eq("pollId", pollId).eq("voterKey", key))
      .first();
    if (existing) {
      throw new ConvexError({ message: "You've already voted in this poll." });
    }
    await ctx.db.insert("pollVotes", {
      pollId,
      voterKey: key,
      optionIndex,
      createdAt: Date.now(),
    });
    await awardXp(ctx, userId, POLL_XP, poll.question.slice(0, 40));
    return { ok: true, xp: userId ? POLL_XP : 0 };
  },
});

/** Answer a trivia question — first answer counts, correct answers earn points. */
export const answerTrivia = mutation({
  args: {
    questionId: v.id("triviaQuestions"),
    choiceIndex: v.number(),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, { questionId, choiceIndex, visitorId }) => {
    const question = await ctx.db.get(questionId);
    if (!question || !question.active) {
      throw new ConvexError({ message: "This question is no longer open." });
    }
    if (choiceIndex < 0 || choiceIndex >= question.options.length) {
      throw new ConvexError({ message: "That answer doesn't exist." });
    }
    const { key, userId } = await resolveVoterKey(ctx, visitorId);
    const existing = await ctx.db
      .query("triviaAnswers")
      .withIndex("by_question_voter", (q) =>
        q.eq("questionId", questionId).eq("voterKey", key),
      )
      .first();
    if (existing) {
      throw new ConvexError({
        message: existing.correct
          ? "You already answered this correctly."
          : "You already answered this question.",
      });
    }
    const correct = choiceIndex === question.correctIndex;
    const pointsEarned = correct ? question.points : 0;
    await ctx.db.insert("triviaAnswers", {
      questionId,
      voterKey: key,
      choiceIndex,
      correct,
      pointsEarned,
      createdAt: Date.now(),
    });
    await awardXp(ctx, userId, pointsEarned, question.question.slice(0, 40));
    return { ok: true, correct, pointsEarned, xp: userId ? pointsEarned : 0 };
  },
});

/** Enter a prediction — +2 XP now, +10 more if it settles correctly. */
export const castPrediction = mutation({
  args: {
    predictionId: v.id("predictions"),
    choiceIndex: v.number(),
    visitorId: v.optional(v.string()),
  },
  handler: async (ctx, { predictionId, choiceIndex, visitorId }) => {
    const prediction = await ctx.db.get(predictionId);
    if (!prediction || prediction.status !== "open") {
      throw new ConvexError({ message: "This prediction is no longer open." });
    }
    if (choiceIndex < 0 || choiceIndex >= prediction.options.length) {
      throw new ConvexError({ message: "That option doesn't exist." });
    }
    const { key, userId } = await resolveVoterKey(ctx, visitorId);
    const existing = await ctx.db
      .query("predictionEntries")
      .withIndex("by_prediction_voter", (q) =>
        q.eq("predictionId", predictionId).eq("voterKey", key),
      )
      .first();
    if (existing) {
      throw new ConvexError({ message: "You've already made this prediction." });
    }
    await ctx.db.insert("predictionEntries", {
      predictionId,
      voterKey: key,
      choiceIndex,
      pointsEarned: PREDICTION_ENTRY_XP,
      createdAt: Date.now(),
    });
    await awardXp(ctx, userId, PREDICTION_ENTRY_XP, prediction.title.slice(0, 40));
    return { ok: true, xp: userId ? PREDICTION_ENTRY_XP : 0 };
  },
});

// ---------------------------------------------------------------------------
// Admin mutations — The Den → Fan Zone
// ---------------------------------------------------------------------------

export const createPoll = mutation({
  args: {
    question: v.string(),
    options: v.array(v.string()),
    endsAt: v.optional(v.number()),
  },
  handler: async (ctx, { question, options, endsAt }) => {
    const user = await requireAdmin(ctx);
    const cleanOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (cleanOptions.length < 2) {
      throw new ConvexError({ message: "A poll needs at least 2 options." });
    }
    await ctx.db.insert("polls", {
      question: question.trim().slice(0, 200),
      options: cleanOptions.map((o) => o.slice(0, 80)).slice(0, 8),
      active: true,
      endsAt,
      createdBy: user._id,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

export const deletePoll = mutation({
  args: { pollId: v.id("polls") },
  handler: async (ctx, { pollId }) => {
    await requireAdmin(ctx);
    const votes = await ctx.db
      .query("pollVotes")
      .withIndex("by_poll", (q) => q.eq("pollId", pollId))
      .collect();
    for (const vote of votes) await ctx.db.delete(vote._id);
    await ctx.db.delete(pollId);
    return { ok: true };
  },
});

export const createTrivia = mutation({
  args: {
    question: v.string(),
    options: v.array(v.string()),
    correctIndex: v.number(),
    points: v.optional(v.number()),
  },
  handler: async (ctx, { question, options, correctIndex, points }) => {
    const user = await requireAdmin(ctx);
    const cleanOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (cleanOptions.length < 2) {
      throw new ConvexError({ message: "Trivia needs at least 2 options." });
    }
    if (correctIndex < 0 || correctIndex >= cleanOptions.length) {
      throw new ConvexError({ message: "Pick a valid correct answer." });
    }
    await ctx.db.insert("triviaQuestions", {
      question: question.trim().slice(0, 200),
      options: cleanOptions.map((o) => o.slice(0, 80)).slice(0, 6),
      correctIndex,
      points: Math.min(50, Math.max(1, points ?? 10)),
      active: true,
      createdBy: user._id,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

export const deleteTrivia = mutation({
  args: { questionId: v.id("triviaQuestions") },
  handler: async (ctx, { questionId }) => {
    await requireAdmin(ctx);
    const answers = await ctx.db
      .query("triviaAnswers")
      .withIndex("by_question", (q) => q.eq("questionId", questionId))
      .collect();
    for (const a of answers) await ctx.db.delete(a._id);
    await ctx.db.delete(questionId);
    return { ok: true };
  },
});

export const toggleTrivia = mutation({
  args: { questionId: v.id("triviaQuestions"), active: v.boolean() },
  handler: async (ctx, { questionId, active }) => {
    await requireAdmin(ctx);
    const q = await ctx.db.get(questionId);
    if (!q) throw new ConvexError({ message: "Question not found." });
    await ctx.db.patch(questionId, { active });
    return { ok: true };
  },
});

export const createPrediction = mutation({
  args: {
    title: v.string(),
    options: v.array(v.string()),
    points: v.optional(v.number()),
    endsAt: v.optional(v.number()),
  },
  handler: async (ctx, { title, options, points, endsAt }) => {
    const user = await requireAdmin(ctx);
    const cleanOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (cleanOptions.length < 2) {
      throw new ConvexError({ message: "A prediction needs at least 2 options." });
    }
    await ctx.db.insert("predictions", {
      title: title.trim().slice(0, 200),
      options: cleanOptions.map((o) => o.slice(0, 80)).slice(0, 8),
      points: Math.min(20, Math.max(1, points ?? PREDICTION_ENTRY_XP)),
      status: "open",
      endsAt,
      createdBy: user._id,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/**
 * Settle a prediction with the real result. Every entry matching the correct
 * option earns the +10 XP bonus; the prediction flips to "settled" so fans
 * see the result instantly.
 */
export const settlePrediction = mutation({
  args: { predictionId: v.id("predictions"), correctIndex: v.number() },
  handler: async (ctx, { predictionId, correctIndex }) => {
    await requireAdmin(ctx);
    const prediction = await ctx.db.get(predictionId);
    if (!prediction) throw new ConvexError({ message: "Prediction not found." });
    if (prediction.status === "settled") {
      throw new ConvexError({ message: "This prediction is already settled." });
    }
    if (correctIndex < 0 || correctIndex >= prediction.options.length) {
      throw new ConvexError({ message: "Pick a valid result option." });
    }
    const entries = await ctx.db
      .query("predictionEntries")
      .withIndex("by_prediction", (q) => q.eq("predictionId", predictionId))
      .collect();
    for (const entry of entries) {
      const correct = entry.choiceIndex === correctIndex;
      const earned = entry.pointsEarned + (correct ? PREDICTION_CORRECT_XP : 0);
      await ctx.db.patch(entry._id, { correct, pointsEarned: earned });
      // Award the bonus XP to the fan (user-keyed entries only).
      if (correct && entry.voterKey.startsWith("user:")) {
        const id = entry.voterKey.slice(5) as Id<"users">;
        const profile = await ctx.db
          .query("fanProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", id))
          .first();
        if (profile) {
          await ctx.db.patch(profile._id, {
            xp: profile.xp + PREDICTION_CORRECT_XP,
            updatedAt: Date.now(),
          });
        }
      }
    }
    await ctx.db.patch(predictionId, {
      status: "settled",
      correctIndex,
      settledAt: Date.now(),
    });
    return { ok: true, correctEntries: entries.filter((e) => e.choiceIndex === correctIndex).length };
  },
});

export const deletePrediction = mutation({
  args: { predictionId: v.id("predictions") },
  handler: async (ctx, { predictionId }) => {
    await requireAdmin(ctx);
    const entries = await ctx.db
      .query("predictionEntries")
      .withIndex("by_prediction", (q) => q.eq("predictionId", predictionId))
      .collect();
    for (const e of entries) await ctx.db.delete(e._id);
    await ctx.db.delete(predictionId);
    return { ok: true };
  },
});

/** Admin overview of every fan-zone item, including closed polls/trivia. */
export const adminOverview = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const polls = await ctx.db.query("polls").order("desc").take(50);
    const pollsWithVotes = await Promise.all(
      polls.map(async (poll) => {
        const votes = await ctx.db
          .query("pollVotes")
          .withIndex("by_poll", (q) => q.eq("pollId", poll._id))
          .collect();
        return {
          _id: poll._id,
          question: poll.question,
          options: poll.options,
          counts: poll.options.map((_, i) => votes.filter((v) => v.optionIndex === i).length),
          totalVotes: votes.length,
          active: poll.active,
          endsAt: poll.endsAt,
          createdAt: poll.createdAt,
        };
      }),
    );
    const trivia = await ctx.db.query("triviaQuestions").order("desc").take(50);
    const triviaWith = await Promise.all(
      trivia.map(async (q) => {
        const answers = await ctx.db
          .query("triviaAnswers")
          .withIndex("by_question", (q2) => q2.eq("questionId", q._id))
          .collect();
        return {
          _id: q._id,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          points: q.points,
          active: q.active,
          answeredCount: answers.length,
          correctCount: answers.filter((a) => a.correct).length,
          createdAt: q.createdAt,
        };
      }),
    );
    const predictions = await ctx.db.query("predictions").order("desc").take(50);
    const predictionsWith = await Promise.all(
      predictions.map(async (p) => {
        const entries = await ctx.db
          .query("predictionEntries")
          .withIndex("by_prediction", (q) => q.eq("predictionId", p._id))
          .collect();
        return {
          _id: p._id,
          title: p.title,
          options: p.options,
          points: p.points,
          status: p.status,
          correctIndex: p.correctIndex,
          counts: p.options.map((_, i) => entries.filter((e) => e.choiceIndex === i).length),
          totalEntries: entries.length,
          correctEntries: entries.filter((e) => e.correct).length,
          endsAt: p.endsAt,
          createdAt: p.createdAt,
          settledAt: p.settledAt,
        };
      }),
    );
    return { polls: pollsWithVotes, trivia: triviaWith, predictions: predictionsWith };
  },
});
