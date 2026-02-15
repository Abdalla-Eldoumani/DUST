import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    score: v.number(),
    accuracy: v.number(),
    level: v.number(),
    pagesCompleted: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to submit scores");
    }

    // Check if user already has a leaderboard entry
    const existing = await ctx.db
      .query("leaderboard")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (existing) {
      // Only update if this is a higher score
      if (args.score > existing.score) {
        await ctx.db.patch(existing._id, {
          score: args.score,
          accuracy: args.accuracy,
          level: args.level,
          pagesCompleted: args.pagesCompleted,
          username: identity.name ?? identity.email ?? "Archivist",
          achievedAt: Date.now(),
        });
      }
    } else {
      await ctx.db.insert("leaderboard", {
        userId: identity.subject,
        username: identity.name ?? identity.email ?? "Archivist",
        score: args.score,
        accuracy: args.accuracy,
        level: args.level,
        pagesCompleted: args.pagesCompleted,
        achievedAt: Date.now(),
      });
    }
  },
});

export const getTop = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("leaderboard")
      .withIndex("by_score")
      .order("desc")
      .take(args.limit ?? 100);

    return entries;
  },
});

export const getUserRank = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userEntry = await ctx.db
      .query("leaderboard")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!userEntry) return null;

    // Count entries with higher scores
    const higherScores = await ctx.db
      .query("leaderboard")
      .withIndex("by_score")
      .filter((q) => q.gt(q.field("score"), userEntry.score))
      .collect();

    return {
      rank: higherScores.length + 1,
      entry: userEntry,
    };
  },
});
