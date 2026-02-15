import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  gameSessions: defineTable({
    userId: v.optional(v.string()),
    score: v.number(),
    level: v.number(),
    combo: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("abandoned")
    ),
    pagesCompleted: v.number(),
    accuracy: v.number(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_status", ["status"]),

  leaderboard: defineTable({
    userId: v.string(),
    username: v.string(),
    score: v.number(),
    accuracy: v.number(),
    level: v.number(),
    pagesCompleted: v.number(),
    achievedAt: v.number(),
  })
    .index("by_score", ["score"])
    .index("by_userId", ["userId"]),

  archives: defineTable({
    userId: v.optional(v.string()),
    sessionId: v.id("gameSessions"),
    items: v.array(
      v.object({
        sectionText: v.string(),
        wasCorrect: v.boolean(),
        level: v.number(),
        contentType: v.string(),
      })
    ),
    totalItems: v.number(),
    correctItems: v.number(),
    savedAt: v.number(),
  }).index("by_userId", ["userId"]),

  cachedContent: defineTable({
    content: v.string(),
    contentType: v.string(),
    difficulty: v.number(),
    isDemo: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_contentType_difficulty", ["contentType", "difficulty"])
    .index("by_isDemo", ["isDemo"]),
});
