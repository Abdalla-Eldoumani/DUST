import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const save = mutation({
  args: {
    sessionId: v.id("gameSessions"),
    items: v.array(
      v.object({
        sectionText: v.string(),
        wasCorrect: v.boolean(),
        level: v.number(),
        contentType: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be logged in to save archives");
    const correctItems = args.items.filter((i) => i.wasCorrect).length;

    return ctx.db.insert("archives", {
      userId: identity.subject,
      sessionId: args.sessionId,
      items: args.items,
      totalItems: args.items.length,
      correctItems,
      savedAt: Date.now(),
    });
  },
});

export const getUserArchive = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    return ctx.db
      .query("archives")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .collect();
  },
});
