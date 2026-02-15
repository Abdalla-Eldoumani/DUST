import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Insert an altered page variant.
 *
 * Called by the Python ingestion pipeline after OpenAI produces
 * an altered version of a scraped page.
 */
export const insert = mutation({
  args: {
    variantId: v.string(),
    pageId: v.string(),
    levelId: v.string(),
    difficulty: v.number(),
    alteredContent: v.string(),
    fakeMarks: v.array(
      v.object({
        kind: v.union(v.literal("FAKE"), v.literal("MISLEADING")),
        elementId: v.optional(v.union(v.string(), v.null())),
        snippet: v.string(),
        explanation: v.string(),
      })
    ),
    projectId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("pageVariants", {
      variantId: args.variantId,
      pageId: args.pageId,
      levelId: args.levelId,
      difficulty: args.difficulty,
      alteredContent: args.alteredContent,
      fakeMarks: args.fakeMarks,
      projectId: args.projectId,
    });
  },
});

/**
 * Get all variants for a given page.
 */
export const getByPageId = query({
  args: { pageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pageVariants")
      .withIndex("by_pageId", (q) => q.eq("pageId", args.pageId))
      .collect();
  },
});

/**
 * Get all variants for a given level.
 */
export const getByLevelId = query({
  args: { levelId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pageVariants")
      .withIndex("by_levelId", (q) => q.eq("levelId", args.levelId))
      .collect();
  },
});

