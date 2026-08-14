import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./guards";

/**
 * Admin-only file storage. Managers upload player + team photos from The Den;
 * the storage URLs are resolved server-side and shown on the public /players,
 * /teams and team-detail pages in real time.
 */

/** Admin-only: get a fresh upload URL for a photo. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Admin-only: attach (or replace) a player's photo. */
export const setPlayerPhoto = mutation({
  args: {
    playerId: v.id("players"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { playerId, storageId }) => {
    await requireAdmin(ctx);
    const player = await ctx.db.get(playerId);
    if (!player) throw new ConvexError({ message: "Player not found." });
    const previous = player.photoStorageId;
    await ctx.db.patch(playerId, { photoStorageId: storageId });
    if (previous && previous !== storageId) {
      try {
        await ctx.storage.delete(previous);
      } catch {
        // Best-effort cleanup — the new photo is already live.
      }
    }
  },
});

/** Admin-only: remove a player's photo. */
export const removePlayerPhoto = mutation({
  args: { playerId: v.id("players") },
  handler: async (ctx, { playerId }) => {
    await requireAdmin(ctx);
    const player = await ctx.db.get(playerId);
    if (!player) throw new ConvexError({ message: "Player not found." });
    const storageId = player.photoStorageId;
    await ctx.db.patch(playerId, { photoStorageId: undefined });
    if (storageId) {
      try {
        await ctx.storage.delete(storageId);
      } catch {
        // Already gone — fine.
      }
    }
  },
});

/** Admin-only: attach (or replace) a team's photo. */
export const setTeamPhoto = mutation({
  args: {
    teamId: v.id("teams"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { teamId, storageId }) => {
    await requireAdmin(ctx);
    const team = await ctx.db.get(teamId);
    if (!team) throw new ConvexError({ message: "Team not found." });
    const previous = team.photoStorageId;
    await ctx.db.patch(teamId, { photoStorageId: storageId });
    if (previous && previous !== storageId) {
      try {
        await ctx.storage.delete(previous);
      } catch {
        // Best-effort cleanup.
      }
    }
  },
});

/** Admin-only: remove a team's photo. */
export const removeTeamPhoto = mutation({
  args: { teamId: v.id("teams") },
  handler: async (ctx, { teamId }) => {
    await requireAdmin(ctx);
    const team = await ctx.db.get(teamId);
    if (!team) throw new ConvexError({ message: "Team not found." });
    const storageId = team.photoStorageId;
    await ctx.db.patch(teamId, { photoStorageId: undefined });
    if (storageId) {
      try {
        await ctx.storage.delete(storageId);
      } catch {
        // Already gone — fine.
      }
    }
  },
});

/** Admin-only: attach (or replace) a news article's cover image. */
export const setContentImage = mutation({
  args: {
    articleId: v.id("content"),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, { articleId, storageId }) => {
    await requireAdmin(ctx);
    const article = await ctx.db.get(articleId);
    if (!article) throw new ConvexError({ message: "Article not found." });
    const previous = article.imageStorageId;
    await ctx.db.patch(articleId, { imageStorageId: storageId });
    if (previous && previous !== storageId) {
      try {
        await ctx.storage.delete(previous);
      } catch {
        // Best-effort cleanup — the new image is already live.
      }
    }
  },
});

/** Admin-only: remove a news article's cover image. */
export const removeContentImage = mutation({
  args: { articleId: v.id("content") },
  handler: async (ctx, { articleId }) => {
    await requireAdmin(ctx);
    const article = await ctx.db.get(articleId);
    if (!article) throw new ConvexError({ message: "Article not found." });
    const storageId = article.imageStorageId;
    await ctx.db.patch(articleId, { imageStorageId: undefined });
    if (storageId) {
      try {
        await ctx.storage.delete(storageId);
      } catch {
        // Already gone — fine.
      }
    }
  },
});

/** Admin-only: resolve a storage id to a public URL (used by the upload preview). */
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    await requireAdmin(ctx);
    return await ctx.storage.getUrl(storageId);
  },
});
