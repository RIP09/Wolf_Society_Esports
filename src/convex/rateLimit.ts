import { ConvexError } from "convex/values";
import type { MutationCtx } from "./_generated/server";

/**
 * Lightweight, DB-backed rate limiter for public mutations (contact form,
 * alert subscriptions, feedback, tryout signups…). Best-effort protection:
 * keys are usually the target email plus the action name, so one address can't
 * hammer a form. When a window expires the counter resets automatically.
 */
export async function enforceRateLimit(
  ctx: MutationCtx,
  key: string,
  max: number,
  windowMs: number,
): Promise<void> {
  const now = Date.now();
  const row = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .first();
  if (!row || now - row.windowStart > windowMs) {
    await ctx.db.insert("rateLimits", { key, windowStart: now, count: 1 });
    return;
  }
  if (row.count >= max) {
    throw new ConvexError({
      message: "Too many attempts — please try again later.",
    });
  }
  await ctx.db.patch(row._id, { count: row.count + 1 });
}
