import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return ctx.db.insert("gameSessions", {
      userId: identity?.subject ?? undefined,
      score: 0,
      level: 1,
      combo: 0,
      status: "active",
      pagesCompleted: 0,
      accuracy: 0,
      startedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    score: v.number(),
    level: v.number(),
    combo: v.number(),
    pagesCompleted: v.number(),
    accuracy: v.number(),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...fields } = args;
    await ctx.db.patch(sessionId, fields);
  },
});

export const finish = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    finalScore: v.number(),
    accuracy: v.number(),
    level: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      score: args.finalScore,
      accuracy: args.accuracy,
      level: args.level,
      status: "completed",
      endedAt: Date.now(),
    });
  },
});

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const sessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return sessions;
  },
});
