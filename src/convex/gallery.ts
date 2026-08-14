import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./guards";

/**
 * Media gallery — real photos uploaded from The Den and shown on the public
 * /gallery page in real time. Every row owns one storage file; removing a
 * photo deletes the row and the file so nothing is left behind.
 */

/** Public: every gallery photo, newest first, with resolved URLs. */
export const publicList = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("gallery").order("desc").take(200);
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        imageUrl: (await ctx.storage.getUrl(row.storageId)) ?? undefined,
      })),
    );
  },
});

/** Admin: every gallery photo, newest first, with resolved URLs. */
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("gallery").order("desc").take(500);
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        imageUrl: (await ctx.storage.getUrl(row.storageId)) ?? undefined,
      })),
    );
  },
});

/** Admin: attach an uploaded photo to the gallery. */
export const add = mutation({
  args: {
    storageId: v.id("_storage"),
    caption: v.string(),
    category: v.string(),
  },
  handler: async (ctx, { storageId, caption, category }) => {
    const admin = await requireAdmin(ctx);
    const cleanCaption = caption.trim();
    const cleanCategory = category.trim() || "Matches";
    if (!cleanCaption) {
      throw new ConvexError({ message: "Please write a short caption for the photo." });
    }
    if (cleanCaption.length > 120) {
      throw new ConvexError({ message: "Caption is too long — keep it under 120 characters." });
    }
    const id = await ctx.db.insert("gallery", {
      caption: cleanCaption,
      category: cleanCategory,
      storageId,
      uploadedBy: admin._id,
      createdAt: Date.now(),
    });
    return { ok: true, id };
  },
});

/** Admin: permanently remove a gallery photo and its storage file. */
export const remove = mutation({
  args: { photoId: v.id("gallery") },
  handler: async (ctx, { photoId }) => {
    await requireAdmin(ctx);
    const photo = await ctx.db.get(photoId);
    if (!photo) throw new ConvexError({ message: "Photo not found — it may already be removed." });
    try {
      await ctx.storage.delete(photo.storageId);
    } catch {
      // Best-effort cleanup — the row itself is already gone.
    }
    await ctx.db.delete(photoId);
  },
});
