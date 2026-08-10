import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./guards";

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Privacy-friendly pageview tracking — only path + referrer are stored. */
export const trackPageview = mutation({
  args: {
    path: v.string(),
    referrer: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const path = args.path.slice(0, 200);
    if (!path.startsWith("/")) return;
    // Ignore in-app admin/player routes to keep public analytics meaningful.
    if (path.startsWith("/admin") || path.startsWith("/player") || path.startsWith("/auth") || path.startsWith("/grant")) return;
    await ctx.db.insert("pageviews", {
      path,
      referrer: args.referrer?.slice(0, 300) || undefined,
      createdAt: Date.now(),
    });
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
