import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireAdmin } from "./guards";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80) || "article";
}

async function uniqueSlug(ctx: QueryCtx, base: string): Promise<string> {
  let candidate = base;
  let n = 2;
  for (;;) {
    const existing = await ctx.db
      .query("content")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .unique();
    if (!existing) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

/** Public: published articles, newest first, optionally filtered by category. */
export const publicList = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, { category }) => {
    let q = ctx.db.query("content").filter((row) => row.eq(row.field("published"), true));
    if (category) {
      q = q.filter((row) => row.eq(row.field("category"), category!));
    }
    return await q.order("desc").take(60);
  },
});

/** Public: a single published article by slug. */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const article = await ctx.db
      .query("content")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!article || !article.published) return null;
    const author = await ctx.db.get(article.authorId);
    return { ...article, authorName: author?.name ?? "Wolf Society Esports" };
  },
});

/** Admin: every article (draft or published). */
export const adminList = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("content").order("desc").take(200);
  },
});

/** Admin: create an article. */
export const create = mutation({
  args: {
    title: v.string(),
    category: v.string(),
    excerpt: v.optional(v.string()),
    body: v.string(),
    coverColor: v.optional(v.string()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const title = args.title.trim();
    if (title.length < 3) throw new ConvexError({ message: "Title is too short." });
    if (!args.body.trim()) throw new ConvexError({ message: "Article body can't be empty." });
    const slug = await uniqueSlug(ctx, slugify(title));
    return await ctx.db.insert("content", {
      title,
      slug,
      category: args.category.trim() || "News",
      excerpt: args.excerpt?.trim() || undefined,
      body: args.body.trim(),
      coverColor: args.coverColor || "bg-neo-yellow",
      authorId: admin._id,
      published: args.published ?? false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/** Admin: update an article (re-slugs only when the title changes). */
export const update = mutation({
  args: {
    articleId: v.id("content"),
    title: v.string(),
    category: v.string(),
    excerpt: v.optional(v.string()),
    body: v.string(),
    coverColor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const article = await ctx.db.get(args.articleId);
    if (!article) throw new ConvexError({ message: "Article not found." });
    const title = args.title.trim();
    if (title.length < 3) throw new ConvexError({ message: "Title is too short." });
    const slug = title === article.title ? article.slug : await uniqueSlug(ctx, slugify(title));
    await ctx.db.patch(args.articleId, {
      title,
      slug,
      category: args.category.trim() || "News",
      excerpt: args.excerpt?.trim() || undefined,
      body: args.body.trim(),
      coverColor: args.coverColor || article.coverColor,
      updatedAt: Date.now(),
    });
  },
});

/** Admin: toggle publish state. */
export const setPublished = mutation({
  args: { articleId: v.id("content"), published: v.boolean() },
  handler: async (ctx, { articleId, published }) => {
    await requireAdmin(ctx);
    const article = await ctx.db.get(articleId);
    if (!article) throw new ConvexError({ message: "Article not found." });
    await ctx.db.patch(articleId, { published, updatedAt: Date.now() });
  },
});

/** Admin: delete an article. */
export const remove = mutation({
  args: { articleId: v.id("content") },
  handler: async (ctx, { articleId }) => {
    await requireAdmin(ctx);
    const article = await ctx.db.get(articleId);
    if (!article) throw new ConvexError({ message: "Article not found." });
    await ctx.db.delete(articleId);
  },
});
