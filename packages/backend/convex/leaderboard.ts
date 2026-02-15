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

    const clerkId = identity.subject;

    // Look up user from users table
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (!user) {
      throw new Error("User not found — please sign in again");
    }

    // Check if user already has a leaderboard entry
    const existing = await ctx.db
      .query("leaderboard")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existing) {
      // Only update if this is a higher score
      if (args.score > existing.score) {
        await ctx.db.patch(existing._id, {
          score: args.score,
          accuracy: args.accuracy,
          level: args.level,
          pagesCompleted: args.pagesCompleted,
          username: user.username,
          avatarUrl: user.avatarUrl,
          achievedAt: Date.now(),
        });
      }
    } else {
      await ctx.db.insert("leaderboard", {
        userId: user._id,
        clerkId,
        username: user.username,
        avatarUrl: user.avatarUrl,
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
    return ctx.db
      .query("leaderboard")
      .withIndex("by_score")
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getMyRank = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userEntry = await ctx.db
      .query("leaderboard")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
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
