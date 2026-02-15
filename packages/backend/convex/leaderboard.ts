import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function getBoardKey(
  leaderboardType: "solo" | "coop",
  level?: number
): string {
  if (leaderboardType === "coop") return "coop";
  const normalizedLevel = Number.isInteger(level) && level && level > 0 ? level : 1;
  return `solo:${normalizedLevel}`;
}

export const submit = mutation({
  args: {
    score: v.number(),
    accuracy: v.number(),
    level: v.number(),
    pagesCompleted: v.number(),
    leaderboardType: v.optional(v.union(v.literal("solo"), v.literal("coop"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Must be logged in to submit scores");
    }

    const clerkId = identity.subject;
    const leaderboardType = args.leaderboardType ?? "solo";
    const boardKey = getBoardKey(leaderboardType, args.level);

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
      .withIndex("by_clerkId_boardKey", (q) =>
        q.eq("clerkId", clerkId).eq("boardKey", boardKey)
      )
      .first();

    if (existing) {
      // Only update if this is a higher score
      if (args.score > existing.score) {
        await ctx.db.patch(existing._id, {
          leaderboardType,
          boardKey,
          score: args.score,
          accuracy: args.accuracy,
          level: args.level,
          pagesCompleted: args.pagesCompleted,
          username: user.username,
          avatarUrl: user.avatarUrl,
          achievedAt: Date.now(),
        });
        return { status: "updated", leaderboardUpdated: true, boardKey };
      }
      return { status: "unchanged", leaderboardUpdated: false, boardKey };
    } else {
      await ctx.db.insert("leaderboard", {
        userId: user._id,
        clerkId,
        username: user.username,
        avatarUrl: user.avatarUrl,
        leaderboardType,
        boardKey,
        score: args.score,
        accuracy: args.accuracy,
        level: args.level,
        pagesCompleted: args.pagesCompleted,
        achievedAt: Date.now(),
      });
      return { status: "created", leaderboardUpdated: true, boardKey };
    }
  },
});

export const getTop = query({
  args: {
    limit: v.optional(v.number()),
    leaderboardType: v.optional(v.union(v.literal("solo"), v.literal("coop"))),
    level: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const leaderboardType = args.leaderboardType ?? "solo";
    const boardKey = getBoardKey(leaderboardType, args.level);

    return ctx.db
      .query("leaderboard")
      .withIndex("by_boardKey_score", (q) => q.eq("boardKey", boardKey))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getMyRank = query({
  args: {
    leaderboardType: v.optional(v.union(v.literal("solo"), v.literal("coop"))),
    level: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const leaderboardType = args.leaderboardType ?? "solo";
    const boardKey = getBoardKey(leaderboardType, args.level);

    const userEntry = await ctx.db
      .query("leaderboard")
      .withIndex("by_clerkId_boardKey", (q) =>
        q.eq("clerkId", identity.subject).eq("boardKey", boardKey)
      )
      .first();

    if (!userEntry) return null;

    // Count entries with higher scores
    const higherScores = await ctx.db
      .query("leaderboard")
      .withIndex("by_boardKey_score", (q) => q.eq("boardKey", boardKey))
      .filter((q) => q.gt(q.field("score"), userEntry.score))
      .collect();

    return {
      rank: higherScores.length + 1,
      entry: userEntry,
      boardKey,
    };
  },
});
