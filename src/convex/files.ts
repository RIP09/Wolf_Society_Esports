import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireSuperAdmin } from "./guards";

/**
 * Organization file storage — the Super Admin's vault.
 *
 * Every format and extension (documents, PDFs, spreadsheets, images, video,
 * audio, archives, fonts…) is stored in Convex's managed file storage and
 * indexed here with its name, size, type and category. Only the Super Admin
 * can upload, browse, download or delete — regular managers never see it.
 *
 * Files live in `_storage` (free with the Convex plan; see the Convex
 * dashboard → Storage for your plan's ceiling). Deleting a file removes both
 * the row and the stored file, so nothing is left behind.
 */

/** Super Admin only: get a fresh upload URL for a new file. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Super Admin only: register an uploaded file in the vault. */
export const recordUpload = mutation({
  args: {
    name: v.string(),
    storageId: v.id("_storage"),
    mimeType: v.string(),
    size: v.number(),
    extension: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);
    const name = args.name.trim();
    if (!name) throw new ConvexError({ message: "File name is required." });
    if (name.length > 160) {
      throw new ConvexError({ message: "File name is too long — keep it under 160 characters." });
    }
    if (args.size < 0 || args.size > 250 * 1024 * 1024) {
      throw new ConvexError({ message: "File is too large — the vault accepts files up to 250 MB." });
    }
    const ext = args.extension.trim().toLowerCase().replace(/^\./, "");
    const category = args.category.trim() || "Other";
    const id = await ctx.db.insert("files", {
      name,
      storageId: args.storageId,
      mimeType: args.mimeType || "application/octet-stream",
      size: args.size,
      extension: ext,
      category,
      description: args.description?.trim().slice(0, 400) || undefined,
      uploadedBy: admin._id,
      createdAt: Date.now(),
    });
    return { ok: true, id };
  },
});

/** Super Admin only: every stored file (newest first) with a download URL + usage totals. */
export const listFiles = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);
    const rows = await ctx.db.query("files").order("desc").take(500);
    const files = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        url: (await ctx.storage.getUrl(row.storageId)) ?? undefined,
      })),
    );
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const byCategory = new Map<string, number>();
    for (const f of files) {
      byCategory.set(f.category, (byCategory.get(f.category) ?? 0) + 1);
    }
    return {
      files,
      totals: {
        count: files.length,
        totalBytes,
        byCategory: Object.fromEntries(byCategory),
      },
    };
  },
});

/** Super Admin only: permanently delete a file and its stored blob. */
export const deleteFile = mutation({
  args: { fileId: v.id("files") },
  handler: async (ctx, { fileId }) => {
    await requireSuperAdmin(ctx);
    const file = await ctx.db.get(fileId);
    if (!file) throw new ConvexError({ message: "File not found — it may already be deleted." });
    try {
      await ctx.storage.delete(file.storageId);
    } catch {
      // Best-effort — the blob may already be gone; the row is what matters.
    }
    await ctx.db.delete(fileId);
    return { ok: true };
  },
});

/** Super Admin only: rename or re-describe a stored file. */
export const updateFileMeta = mutation({
  args: {
    fileId: v.id("files"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    const file = await ctx.db.get(args.fileId);
    if (!file) throw new ConvexError({ message: "File not found." });
    await ctx.db.patch(args.fileId, {
      name: args.name?.trim().slice(0, 160) || file.name,
      category: args.category?.trim().slice(0, 40) || file.category,
      description:
        args.description !== undefined
          ? (args.description.trim().slice(0, 400) || undefined)
          : file.description,
    });
    return { ok: true };
  },
});
