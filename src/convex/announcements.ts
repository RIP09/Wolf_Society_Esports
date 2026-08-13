import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { requireAdmin, requireUser } from "./guards";
import { ANNOUNCEMENT_PRIORITY } from "./schema";

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.db.query("announcements").order("desc").take(40);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    priority: v.union(
      v.literal(ANNOUNCEMENT_PRIORITY.INFO),
      v.literal(ANNOUNCEMENT_PRIORITY.IMPORTANT),
      v.literal(ANNOUNCEMENT_PRIORITY.URGENT),
    ),
    notifySubscribers: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const title = args.title.trim();
    if (title.length < 2) throw new ConvexError({ message: "Title is too short." });
    if (!args.body.trim()) throw new ConvexError({ message: "Body can't be empty." });
    const id = await ctx.db.insert("announcements", {
      title,
      body: args.body.trim(),
      priority: args.priority,
      authorId: admin._id,
      createdAt: Date.now(),
    });
    // Broadcast to public alert subscribers by email + SMS when requested.
    if (args.notifySubscribers) {
      const subscribers = await ctx.db
        .query("subscribers")
        .filter((q) => q.eq(q.field("active"), true))
        .take(500);
      if (subscribers.length > 0) {
        await ctx.scheduler.runAfter(0, api.notify.broadcast, {
          title,
          body: args.body.trim(),
          subscribers: subscribers.map((s) => ({
            name: s.name,
            email: s.email,
            phone: s.phone,
          })),
        });
      }
    }
    // Fire the n8n automation pipeline (CRM, AI summaries, Discord, …).
    await ctx.scheduler.runAfter(0, api.automation.triggerWorkflow, {
      event: "announcement.published",
      payload: JSON.stringify({
        title,
        body: args.body.trim(),
        priority: args.priority,
        notifySubscribers: !!args.notifySubscribers,
      }),
    });
    return id;
  },
});

export const remove = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, { announcementId }) => {
    await requireAdmin(ctx);
    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new ConvexError({ message: "Announcement not found." });
    await ctx.db.delete(announcementId);
  },
});
