import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./guards";

/** Public: all sponsors, ordered by tier priority then sort order. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("sponsors").collect();
    const order: Record<string, number> = { platinum: 0, gold: 1, silver: 2, partner: 3 };
    return rows.sort((a, b) => (order[a.tier] ?? 9) - (order[b.tier] ?? 9) || a.sortOrder - b.sortOrder);
  },
});

/** Admin: create or update a sponsor. */
export const upsert = mutation({
  args: {
    sponsorId: v.optional(v.id("sponsors")),
    name: v.string(),
    website: v.optional(v.string()),
    tier: v.union(v.literal("platinum"), v.literal("gold"), v.literal("silver"), v.literal("partner")),
    description: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const name = args.name.trim();
    if (name.length < 2) throw new ConvexError({ message: "Sponsor name is too short." });
    const data = {
      name,
      website: args.website?.trim() || undefined,
      tier: args.tier,
      description: args.description?.trim() || undefined,
      sortOrder: args.sortOrder ?? 0,
    };
    if (args.sponsorId) {
      const existing = await ctx.db.get(args.sponsorId);
      if (!existing) throw new ConvexError({ message: "Sponsor not found." });
      await ctx.db.patch(args.sponsorId, data);
      return args.sponsorId;
    }
    return await ctx.db.insert("sponsors", { ...data, createdAt: Date.now() });
  },
});

/** Admin: delete a sponsor. */
export const remove = mutation({
  args: { sponsorId: v.id("sponsors") },
  handler: async (ctx, { sponsorId }) => {
    await requireAdmin(ctx);
    const sponsor = await ctx.db.get(sponsorId);
    if (!sponsor) throw new ConvexError({ message: "Sponsor not found." });
    await ctx.db.delete(sponsorId);
  },
});
