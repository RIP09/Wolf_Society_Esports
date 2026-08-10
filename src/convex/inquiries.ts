import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./guards";

/** Admin-only: all contact-form submissions, newest first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("contactMessages").order("desc").take(100);
  },
});

/** Admin-only: mark an inquiry read / unread. */
export const toggleRead = mutation({
  args: { messageId: v.id("contactMessages") },
  handler: async (ctx, { messageId }) => {
    await requireAdmin(ctx);
    const message = await ctx.db.get(messageId);
    if (!message) throw new ConvexError({ message: "Message not found." });
    await ctx.db.patch(messageId, { read: !message.read });
  },
});

/** Admin-only: remove an inquiry. */
export const remove = mutation({
  args: { messageId: v.id("contactMessages") },
  handler: async (ctx, { messageId }) => {
    await requireAdmin(ctx);
    const message = await ctx.db.get(messageId);
    if (!message) throw new ConvexError({ message: "Message not found." });
    await ctx.db.delete(messageId);
  },
});
