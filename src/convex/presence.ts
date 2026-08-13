// convex/presence.ts
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const ping = mutation({
  args: {
    visitorId: v.optional(v.string()),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = args.visitorId || "anonymous";

    // Upsert presence
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

    // Clean up stale entries (> 2 min)
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
    return { total: active.length };
  },
});
