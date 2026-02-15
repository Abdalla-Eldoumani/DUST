import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Upsert a level definition.
 *
 * Called by the Python ingestion pipeline.  If a level with the same
 * levelId + projectId already exists it is updated; otherwise inserted.
 */
export const upsert = mutation({
  args: {
    levelId: v.string(),
    projectId: v.string(),
    difficulty: v.number(),
    pageIds: v.array(v.string()),
    mutationParams: v.object({
      fakeRate: v.float64(),
      subtlety: v.float64(),
      maxFakeSpans: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("levels")
      .withIndex("by_levelId_projectId", (q) =>
        q.eq("levelId", args.levelId).eq("projectId", args.projectId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        difficulty: args.difficulty,
        pageIds: args.pageIds,
        mutationParams: args.mutationParams,
      });
      return existing._id;
    }

    return await ctx.db.insert("levels", {
      levelId: args.levelId,
      projectId: args.projectId,
      difficulty: args.difficulty,
      pageIds: args.pageIds,
      mutationParams: args.mutationParams,
    });
  },
});

/**
 * Get all levels for a project, ordered by difficulty.
 */
export const getByProject = query({
  args: { projectId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("levels")
      .withIndex("by_projectId", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

/**
 * Get a specific level.
 */
export const getByLevelId = query({
  args: { levelId: v.string(), projectId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("levels")
      .withIndex("by_levelId_projectId", (q) =>
        q.eq("levelId", args.levelId).eq("projectId", args.projectId)
      )
      .unique();
  },
});

