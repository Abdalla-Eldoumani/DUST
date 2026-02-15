import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Upsert a scraped page snapshot.
 *
 * Called by the Python ingestion pipeline via Convex HTTP API.
 * If a page with the same pageId already exists it is updated;
 * otherwise a new document is inserted.
 */
export const upsert = mutation({
  args: {
    pageId: v.string(),
    url: v.string(),
    title: v.string(),
    capturedAt: v.string(),
    html: v.string(),
    elements: v.array(
      v.object({
        elementId: v.string(),
        tag: v.string(),
        text: v.optional(v.union(v.string(), v.null())),
        src: v.optional(v.union(v.string(), v.null())),
        srcset: v.optional(v.union(v.string(), v.null())),
        alt: v.optional(v.union(v.string(), v.null())),
        href: v.optional(v.union(v.string(), v.null())),
        bbox: v.optional(v.union(v.object({
          x: v.float64(),
          y: v.float64(),
          width: v.float64(),
          height: v.float64(),
        }), v.null())),
      })
    ),
    assets: v.array(
      v.object({
        src: v.string(),
        alt: v.optional(v.union(v.string(), v.null())),
        srcset: v.optional(v.union(v.string(), v.null())),
        elementId: v.optional(v.union(v.string(), v.null())),
      })
    ),
    styles: v.array(v.string()),
    projectId: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for existing page with same pageId
    const existing = await ctx.db
      .query("pages")
      .withIndex("by_pageId", (q) => q.eq("pageId", args.pageId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        url: args.url,
        title: args.title,
        capturedAt: args.capturedAt,
        html: args.html,
        elements: args.elements,
        assets: args.assets,
        styles: args.styles,
        projectId: args.projectId,
        tags: args.tags,
      });
      return existing._id;
    }

    return await ctx.db.insert("pages", {
      pageId: args.pageId,
      url: args.url,
      title: args.title,
      capturedAt: args.capturedAt,
      html: args.html,
      elements: args.elements,
      assets: args.assets,
      styles: args.styles,
      projectId: args.projectId,
      tags: args.tags,
    });
  },
});

/**
 * Get a page by its stable pageId.
 */
export const getByPageId = query({
  args: { pageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pages")
      .withIndex("by_pageId", (q) => q.eq("pageId", args.pageId))
      .unique();
  },
});

