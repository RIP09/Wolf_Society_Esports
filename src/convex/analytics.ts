import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./guards";

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Privacy-friendly pageview tracking — path + referrer + an anonymous visitor id
 * with an auto-detected country. The visitor row is upserted here so unique
 * visitor counts and the country breakdown stay exact and realtime.
 */
export const trackPageview = mutation({
  args: {
    path: v.string(),
    referrer: v.optional(v.string()),
    visitorId: v.optional(v.string()),
    country: v.optional(v.string()),
    countryCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const path = args.path.slice(0, 200);
    if (!path.startsWith("/")) return;
    // Ignore in-app admin/player routes to keep public analytics meaningful.
    if (path.startsWith("/admin") || path.startsWith("/player") || path.startsWith("/auth") || path.startsWith("/grant")) return;
    const now = Date.now();

    // Upsert the visitor row for exact unique-visitor counts.
    if (args.visitorId) {
      const visitorId = args.visitorId.slice(0, 100);
      const existing = await ctx.db
        .query("visitors")
        .withIndex("by_visitorId", (q) => q.eq("visitorId", visitorId))
        .first();
      if (existing) {
        await ctx.db.patch(existing._id, {
          lastSeen: now,
          views: existing.views + 1,
          // First successful auto-detection wins — later anonymous views must not erase it.
          country: existing.country ?? args.country?.slice(0, 80),
          countryCode: existing.countryCode ?? args.countryCode?.slice(0, 8),
        });
      } else {
        await ctx.db.insert("visitors", {
          visitorId,
          country: args.country?.slice(0, 80),
          countryCode: args.countryCode?.slice(0, 8),
          firstSeen: now,
          lastSeen: now,
          views: 1,
        });
      }
    }

    await ctx.db.insert("pageviews", {
      path,
      referrer: args.referrer?.slice(0, 300) || undefined,
      visitorId: args.visitorId?.slice(0, 100),
      country: args.country?.slice(0, 80),
      countryCode: args.countryCode?.slice(0, 8),
      createdAt: now,
    });
  },
});

/**
 * Attaches a country to an existing visitor row once the free GeoIP lookup
 * resolves (it can land after the visitor's very first pageview).
 */
export const setVisitorCountry = mutation({
  args: {
    visitorId: v.string(),
    country: v.string(),
    countryCode: v.string(),
  },
  handler: async (ctx, { visitorId, country, countryCode }) => {
    const existing = await ctx.db
      .query("visitors")
      .withIndex("by_visitorId", (q) => q.eq("visitorId", visitorId.slice(0, 100)))
      .first();
    if (existing && !existing.country) {
      await ctx.db.patch(existing._id, {
        country: country.slice(0, 80),
        countryCode: countryCode.slice(0, 8),
      });
    }
  },
});

/**
 * Public, reactive visitor statistics for the live footer widget — updates in
 * real time because Convex queries are subscriptions.
 */
export const visitorStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayStart = startOfDay(now);
    const cutoff24h = now - DAY;

    const visitors = await ctx.db.query("visitors").collect();
    const totalVisitors = visitors.length;
    const todayVisitors = visitors.filter((v) => v.lastSeen >= dayStart).length;

    const recentViews = await ctx.db
      .query("pageviews")
      .withIndex("by_createdAt", (q) => q.gte("createdAt", cutoff24h))
      .collect();
    const viewsLast24h = recentViews.length;
    const viewsToday = recentViews.filter((v) => v.createdAt >= dayStart).length;

    // Aggregate visitors per country (auto-detected, country-level only).
    const byCountry = new Map<
      string,
      { country: string; code: string; visitors: number; views: number }
    >();
    for (const v of visitors) {
      const key = v.countryCode || v.country || "unknown";
      const entry =
        byCountry.get(key) ??
        ({
          country: v.country || "Unknown",
          code: v.countryCode || "",
          visitors: 0,
          views: 0,
        } as { country: string; code: string; visitors: number; views: number });
      entry.visitors += 1;
      entry.views += v.views;
      byCountry.set(key, entry);
    }
    const topCountries = [...byCountry.values()]
      .sort((a, b) => b.visitors - a.visitors || b.views - a.views)
      .slice(0, 10);

    return { totalVisitors, todayVisitors, viewsLast24h, viewsToday, topCountries };
  },
});

/** Admin-only: realtime analytics dashboard data. */
export const getAnalytics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const views = await ctx.db.query("pageviews").order("desc").take(20000);

    const total = views.length;
    const today = startOfDay(Date.now());

    // Last 14 days of pageviews.
    const buckets = Array.from({ length: 14 }, (_, i) => today - (13 - i) * DAY);
    const countsByDay = new Map<number, number>(buckets.map((b) => [b, 0]));
    for (const v of views) {
      const day = startOfDay(v.createdAt);
      if (countsByDay.has(day)) countsByDay.set(day, countsByDay.get(day)! + 1);
    }
    const viewsPerDay = buckets.map((b) => ({ day: b, count: countsByDay.get(b) ?? 0 }));

    // Top pages.
    const byPath = new Map<string, number>();
    for (const v of views) byPath.set(v.path, (byPath.get(v.path) ?? 0) + 1);
    const topPaths = [...byPath.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Unique referrers (domain only).
    const byReferrer = new Map<string, number>();
    for (const v of views) {
      if (!v.referrer) continue;
      let domain = v.referrer;
      try {
        domain = new URL(v.referrer).hostname.replace(/^www\./, "");
      } catch {
        // keep as-is
      }
      byReferrer.set(domain, (byReferrer.get(domain) ?? 0) + 1);
    }
    const topReferrers = [...byReferrer.entries()]
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return { total, viewsPerDay, topPaths, topReferrers };
  },
});
