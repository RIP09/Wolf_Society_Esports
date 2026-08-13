import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Realtime presence — a lightweight "online right now" counter for the whole
 * site. Each open page pings every ~30s (client-side throttle) and sweeps
 * stale rows, so the counts are always current without a background service.
 *
 *   presence.ping        — upsert this visitor's row + delete stale rows
 *   presence.onlineCount — public reactive count (total + per-page breakdown)
 */

const STALE_MS = 60_000; // a row is "online" for 60s after its last heartbeat

/** Heartbeat mutation — call it on page load and every ~30s while open. */
export const ping = mutation({
  args: {
    visitorId: v.optional(v.string()),
    path: v.optional(v.string()),
  },
  handler: async (ctx, { visitorId, path }) => {
    const now = Date.now();

    // Sweep stale rows (bounded batch) so the table never grows unbounded.
    const stale = await ctx.db
      .query("presence")
      .withIndex("by_lastSeen")
      .filter((q) => q.lt(q.field("lastSeen"), now - STALE_MS))
      .take(50);
    for (const row of stale) {
      await ctx.db.delete(row._id);
    }

    if (!visitorId) return;
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_visitorId", (q) => q.eq("visitorId", visitorId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { path: path ?? existing.path, lastSeen: now });
    } else {
      await ctx.db.insert("presence", { visitorId, path: path ?? undefined, lastSeen: now });
    }
  },
});

/** Public: how many people are on the site right now, live. */
export const onlineCount = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const rows = await ctx.db
      .query("presence")
      .withIndex("by_lastSeen")
      .filter((q) => q.gte(q.field("lastSeen"), now - STALE_MS))
      .collect();
    const byPath = new Map<string, number>();
    for (const row of rows) {
      const key = row.path ?? "other";
      byPath.set(key, (byPath.get(key) ?? 0) + 1);
    }
    return {
      total: rows.length,
      byPath: [...byPath.entries()]
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      updatedAt: now,
    };
  },
});
