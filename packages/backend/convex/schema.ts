import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    avatarUrl: v.string(),
    createdAt: v.number(),
  }).index("by_clerkId", ["clerkId"]),

  gameSessions: defineTable({
    userId: v.string(),
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
    userId: v.id("users"),
    clerkId: v.string(),
    username: v.string(),
    avatarUrl: v.string(),
    score: v.number(),
    accuracy: v.number(),
    level: v.number(),
    pagesCompleted: v.number(),
    achievedAt: v.number(),
  })
    .index("by_score", ["score"])
    .index("by_clerkId", ["clerkId"]),

  archives: defineTable({
    userId: v.string(),
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

  multiplayerRooms: defineTable({
    roomCode: v.string(),
    mode: v.union(v.literal("race"), v.literal("coop")),
    hostClerkId: v.string(),
    guestClerkId: v.optional(v.string()),
    hostUsername: v.string(),
    guestUsername: v.optional(v.string()),
    hostAvatarUrl: v.string(),
    guestAvatarUrl: v.optional(v.string()),
    status: v.union(
      v.literal("waiting"),
      v.literal("ready"),
      v.literal("playing"),
      v.literal("roundEnd"),
      v.literal("finished")
    ),
    currentRound: v.number(),
    maxRounds: v.number(),
    currentContentId: v.optional(v.string()),
    hostScore: v.number(),
    guestScore: v.number(),
    sharedEnergy: v.optional(v.number()),
    sharedScore: v.optional(v.number()),
    hostPresent: v.optional(v.boolean()),
    guestPresent: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_roomCode", ["roomCode"])
    .index("by_status", ["status"])
    .index("by_hostClerkId", ["hostClerkId"]),

  multiplayerActions: defineTable({
    roomId: v.id("multiplayerRooms"),
    clerkId: v.string(),
    round: v.number(),
    action: v.union(
      v.literal("archive"),
      v.literal("useTools"),
      v.literal("ping"),
      v.literal("ready")
    ),
    data: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_roomId", ["roomId"])
    .index("by_roomId_round", ["roomId", "round"]),

  // ---------------------------------------------------------------
  // Ingestion pipeline tables
  // ---------------------------------------------------------------

  /**
   * Scraped page snapshots uploaded by the Python ingestion pipeline.
   */
  pages: defineTable({
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
        bbox: v.optional(
          v.union(
            v.object({
              x: v.float64(),
              y: v.float64(),
              width: v.float64(),
              height: v.float64(),
            }),
            v.null()
          )
        ),
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
  })
    .index("by_pageId", ["pageId"])
    .index("by_projectId", ["projectId"]),

  /**
   * Altered page variants produced by the OpenAI alteration step.
   */
  pageVariants: defineTable({
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
  })
    .index("by_pageId", ["pageId"])
    .index("by_levelId", ["levelId"])
    .index("by_projectId", ["projectId"]),

  /**
   * Level definitions with difficulty scaling and page assignments.
   */
  levels: defineTable({
    levelId: v.string(),
    projectId: v.string(),
    difficulty: v.number(),
    pageIds: v.array(v.string()),
    mutationParams: v.object({
      fakeRate: v.float64(),
      subtlety: v.float64(),
      maxFakeSpans: v.number(),
    }),
  })
    .index("by_levelId_projectId", ["levelId", "projectId"])
    .index("by_projectId", ["projectId"]),
});

