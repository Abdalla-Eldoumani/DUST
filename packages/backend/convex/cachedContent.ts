import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getRandom = query({
  args: {
    contentType: v.optional(v.string()),
    difficulty: v.number(),
  },
  handler: async (ctx, args) => {
    let entries;

    if (args.contentType) {
      entries = await ctx.db
        .query("cachedContent")
        .withIndex("by_contentType_difficulty", (q) =>
          q.eq("contentType", args.contentType!).eq("difficulty", args.difficulty)
        )
        .collect();
    } else {
      entries = await ctx.db
        .query("cachedContent")
        .filter((q) => q.eq(q.field("difficulty"), args.difficulty))
        .collect();
    }

    if (entries.length === 0) {
      // Fallback: get any content
      entries = await ctx.db.query("cachedContent").take(10);
    }

    if (entries.length === 0) return null;

    const random = entries[Math.floor(Math.random() * entries.length)];
    return random ? { ...random, content: JSON.parse(random.content) } : null;
  },
});

export const getDemo = query({
  args: {},
  handler: async (ctx) => {
    const entries = await ctx.db
      .query("cachedContent")
      .withIndex("by_isDemo")
      .filter((q) => q.eq(q.field("isDemo"), true))
      .collect();

    return entries.map((e) => ({
      ...e,
      content: JSON.parse(e.content),
    }));
  },
});

export const seed = mutation({
  args: {
    content: v.string(),
    contentType: v.string(),
    difficulty: v.number(),
    isDemo: v.boolean(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("cachedContent", {
      ...args,
      createdAt: Date.now(),
    });
  },
});
