import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Simple presence: track visitors and get online count (no persistence, just in-memory count)
// Convex doesn't have built-in presence, so we'll store a timestamp per visitorId.
// For simplicity, we'll maintain a set in a single document.

export const ping = mutation({
  args: {
    visitorId: v.optional(v.string()),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    // Store presence in a "presence" table with ttl
    const now = Date.now();
    const id = args.visitorId || "anonymous";
    // Upsert: update or insert
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_visitor", (q) => q.eq("visitorId", id))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: now, path: args.path });
    } else {
      await ctx.db.insert("presence", {
        visitorId: id,
        lastSeen: now,
        path: args.path,
      });
    }
    // Remove stale entries older than 2 minutes
    const stale = Date.now() - 120_000;
    const old = await ctx.db
      .query("presence")
      .filter((q) => q.lt(q.field("lastSeen"), stale))
      .collect();
    for (const doc of old) {
      await ctx.db.delete(doc._id);
    }
  },
});

export const onlineCount = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const active = await ctx.db
      .query("presence")
      .filter((q) => q.gt(q.field("lastSeen"), now - 120_000))
      .collect();
    // Also count distinct visitors? For simplicity, total.
    return { total: active.length };
  },
});
