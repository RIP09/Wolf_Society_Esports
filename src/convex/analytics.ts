import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Store pageviews and visitor stats in a single "analytics" table.
// For simplicity, we'll aggregate on the fly.

export const trackPageview = mutation({
  args: {
    path: v.string(),
    referrer: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const visitorId = args.visitorId || "anonymous";
    // Insert a pageview record
    await ctx.db.insert("pageviews", {
      visitorId,
      path: args.path,
      referrer: args.referrer,
      country: args.country,
      countryCode: args.countryCode,
      timestamp: Date.now(),
    });
    // Also update visitor's country in a "visitors" table for stats
    if (args.country && visitorId !== "anonymous") {
      const existing = await ctx.db
        .query("visitors")
        .withIndex("by_visitorId", (q) => q.eq("visitorId", visitorId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          country: args.country,
          countryCode: args.countryCode,
          lastSeen: Date.now(),
        });
      } else {
        await ctx.db.insert("visitors", {
          visitorId,
          country: args.country,
          countryCode: args.countryCode,
          firstSeen: Date.now(),
          lastSeen: Date.now(),
        });
      }
    }
  },
});

export const setVisitorCountry = mutation({
  args: {
    visitorId: v.string(),
    country: v.string(),
    countryCode: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("visitors")
      .withIndex("by_visitorId", (q) => q.eq("visitorId", args.visitorId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        country: args.country,
        countryCode: args.countryCode,
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("visitors", {
        visitorId: args.visitorId,
        country: args.country,
        countryCode: args.countryCode,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      });
    }
  },
});

export const visitorStats = query({
  args: {},
  handler: async (ctx) => {
    // Calculate total visitors, today visitors, last 24h pageviews, and top countries.
    const now = Date.now();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTs = todayStart.getTime();
    const last24h = now - 24 * 60 * 60 * 1000;

    // Get all visitors
    const visitors = await ctx.db.query("visitors").collect();
    const totalVisitors = visitors.length;

    // Today: visitors with firstSeen >= todayTs
    const todayVisitors = visitors.filter((v) => v.firstSeen >= todayTs).length;

    // Pageviews in last 24h
    const pageviews = await ctx.db
      .query("pageviews")
      .filter((q) => q.gt(q.field("timestamp"), last24h))
      .collect();
    const viewsLast24h = pageviews.length;

    // Top countries from visitors table
    const countryMap = new Map<string, { country: string; code: string; visitors: number }>();
    for (const v of visitors) {
      if (v.country) {
        const key = v.countryCode || v.country;
        if (!countryMap.has(key)) {
          countryMap.set(key, { country: v.country, code: v.countryCode || "", visitors: 0 });
        }
        countryMap.get(key)!.visitors++;
      }
    }
    const topCountries = Array.from(countryMap.values())
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 5);

    return {
      totalVisitors,
      todayVisitors,
      viewsLast24h,
      topCountries,
    };
  },
});
