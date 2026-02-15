# CLAUDE.md — packages/backend/convex

## Database Schema

### Tables

**`gameSessions`**
```typescript
{
  userId: v.optional(v.string()),    // Clerk user ID (null for guests)
  score: v.number(),
  level: v.number(),
  combo: v.number(),
  status: v.union(v.literal("active"), v.literal("completed"), v.literal("abandoned")),
  pagesCompleted: v.number(),
  accuracy: v.number(),              // 0-100 percentage
  startedAt: v.number(),             // Unix timestamp
  endedAt: v.optional(v.number()),
}
// Index: by_userId, by_status
```

**`leaderboard`**
```typescript
{
  userId: v.string(),                // Clerk user ID
  username: v.string(),              // Display name
  score: v.number(),
  accuracy: v.number(),
  level: v.number(),
  pagesCompleted: v.number(),
  achievedAt: v.number(),            // Unix timestamp
}
// Index: by_score (descending), by_userId
```

**`archives`**
```typescript
{
  userId: v.optional(v.string()),
  sessionId: v.id("gameSessions"),
  items: v.array(v.object({
    sectionText: v.string(),
    wasCorrect: v.boolean(),
    level: v.number(),
    contentType: v.string(),
  })),
  totalItems: v.number(),
  correctItems: v.number(),
  savedAt: v.number(),
}
// Index: by_userId
```

**`cachedContent`**
```typescript
{
  content: v.string(),               // JSON stringified PageContent
  contentType: v.string(),           // news, blog, social, wiki
  difficulty: v.number(),            // 1-10
  isDemo: v.boolean(),               // Curated for demo mode
  createdAt: v.number(),
}
// Index: by_contentType_difficulty, by_isDemo
```

## Function Specifications

### gameSessions.ts

```typescript
// Start a new game
export const create = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity(); // may be null (guest)
    return ctx.db.insert("gameSessions", {
      userId: identity?.subject ?? undefined,
      score: 0, level: 1, combo: 0,
      status: "active", pagesCompleted: 0, accuracy: 0,
      startedAt: Date.now(),
    });
  },
});

// Update during gameplay
export const update = mutation({
  args: { sessionId: v.id("gameSessions"), score, level, combo, pagesCompleted, accuracy },
  handler: async (ctx, args) => { /* patch the session */ },
});

// End the game
export const finish = mutation({
  args: { sessionId: v.id("gameSessions"), finalScore, accuracy, level },
  handler: async (ctx, args) => { /* set status=completed, endedAt */ },
});
```

### leaderboard.ts

```typescript
// Submit a score (requires auth)
export const submit = mutation({
  args: { score, accuracy, level, pagesCompleted },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be logged in to submit scores");
    // Check if user already has a higher score — only save if this is their best
    // Insert or update leaderboard entry
  },
});

// Get top scores
export const getTop = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return ctx.db.query("leaderboard")
      .withIndex("by_score")
      .order("desc")
      .take(args.limit ?? 100);
  },
});
```

### cachedContent.ts

```typescript
// Get random cached content by type and difficulty
export const getRandom = query({
  args: { contentType: v.optional(v.string()), difficulty: v.number() },
  handler: async (ctx, args) => {
    // Query matching content, return a random one
  },
});

// Get demo content (curated)
export const getDemo = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("cachedContent")
      .withIndex("by_isDemo")
      .filter(q => q.eq(q.field("isDemo"), true))
      .collect();
  },
});

// Seed content (call this during setup to populate cache)
export const seed = mutation({
  args: { content: v.string(), contentType: v.string(), difficulty: v.number(), isDemo: v.boolean() },
  handler: async (ctx, args) => {
    return ctx.db.insert("cachedContent", { ...args, createdAt: Date.now() });
  },
});
```

## Auth Configuration

`auth.config.ts` must be configured for Clerk:
```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
```

## Testing

Before marking backend tasks complete:
- [ ] `npx convex dev` runs without errors
- [ ] Can create and query game sessions
- [ ] Leaderboard sorts correctly by score (descending)
- [ ] Cached content can be seeded and retrieved
- [ ] Auth works for protected mutations (submit score)
- [ ] Unauthed users can still create sessions and play
