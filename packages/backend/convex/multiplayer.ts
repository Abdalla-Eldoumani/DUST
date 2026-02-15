import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export const createRoom = mutation({
  args: {
    mode: v.union(v.literal("race"), v.literal("coop")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be logged in");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    // Generate unique room code
    let roomCode: string;
    let attempts = 0;
    do {
      roomCode = generateRoomCode();
      const existing = await ctx.db
        .query("multiplayerRooms")
        .withIndex("by_roomCode", (q) => q.eq("roomCode", roomCode))
        .first();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const now = Date.now();
    const roomId = await ctx.db.insert("multiplayerRooms", {
      roomCode,
      mode: args.mode,
      hostClerkId: identity.subject,
      hostUsername: user.username,
      hostAvatarUrl: user.avatarUrl,
      status: "waiting",
      currentRound: 0,
      maxRounds: 5,
      hostScore: 0,
      guestScore: 0,
      createdAt: now,
      updatedAt: now,
    });

    return { roomId, roomCode };
  },
});

export const joinRoom = mutation({
  args: {
    roomCode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be logged in");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const room = await ctx.db
      .query("multiplayerRooms")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode.toUpperCase()))
      .first();

    if (!room) throw new Error("Room not found");
    if (room.status !== "waiting") throw new Error("Room is no longer accepting players");
    if (room.hostClerkId === identity.subject) throw new Error("Cannot join your own room");

    await ctx.db.patch(room._id, {
      guestClerkId: identity.subject,
      guestUsername: user.username,
      guestAvatarUrl: user.avatarUrl,
      status: "ready",
      updatedAt: Date.now(),
    });

    return { roomId: room._id, roomCode: room.roomCode };
  },
});

export const getRoom = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("multiplayerRooms")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode.toUpperCase()))
      .first();
  },
});

export const getRoomById = query({
  args: { roomId: v.id("multiplayerRooms") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.roomId);
  },
});

export const startGame = mutation({
  args: {
    roomId: v.id("multiplayerRooms"),
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be logged in");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.hostClerkId !== identity.subject) throw new Error("Only host can start the game");
    if (room.status !== "ready") throw new Error("Room is not ready to start");

    await ctx.db.patch(args.roomId, {
      status: "playing",
      currentRound: 1,
      currentContentId: args.contentId,
      sharedEnergy: room.mode === "coop" ? 10 : undefined,
      sharedScore: room.mode === "coop" ? 0 : undefined,
      updatedAt: Date.now(),
    });
  },
});

export const submitAction = mutation({
  args: {
    roomId: v.id("multiplayerRooms"),
    action: v.union(
      v.literal("archive"),
      v.literal("useTools"),
      v.literal("ping"),
      v.literal("ready")
    ),
    data: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be logged in");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    await ctx.db.insert("multiplayerActions", {
      roomId: args.roomId,
      clerkId: identity.subject,
      round: room.currentRound,
      action: args.action,
      data: args.data,
      timestamp: Date.now(),
    });
  },
});

export const getRoundActions = query({
  args: {
    roomId: v.id("multiplayerRooms"),
    round: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("multiplayerActions")
      .withIndex("by_roomId_round", (q) =>
        q.eq("roomId", args.roomId).eq("round", args.round)
      )
      .collect();
  },
});

export const nextRound = mutation({
  args: {
    roomId: v.id("multiplayerRooms"),
    hostScoreAdd: v.number(),
    guestScoreAdd: v.number(),
    sharedScoreAdd: v.optional(v.number()),
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const newRound = room.currentRound + 1;
    const isFinished = newRound > room.maxRounds;

    await ctx.db.patch(args.roomId, {
      hostScore: room.hostScore + args.hostScoreAdd,
      guestScore: room.guestScore + args.guestScoreAdd,
      sharedScore:
        room.mode === "coop"
          ? (room.sharedScore ?? 0) + (args.sharedScoreAdd ?? 0)
          : undefined,
      currentRound: isFinished ? room.currentRound : newRound,
      currentContentId: isFinished ? room.currentContentId : args.contentId,
      status: isFinished ? "finished" : "playing",
      sharedEnergy: room.mode === "coop" && !isFinished ? 10 : room.sharedEnergy,
      updatedAt: Date.now(),
    });
  },
});

export const endRound = mutation({
  args: {
    roomId: v.id("multiplayerRooms"),
    hostScoreAdd: v.number(),
    guestScoreAdd: v.number(),
    sharedScoreAdd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    await ctx.db.patch(args.roomId, {
      hostScore: room.hostScore + args.hostScoreAdd,
      guestScore: room.guestScore + args.guestScoreAdd,
      sharedScore:
        room.mode === "coop"
          ? (room.sharedScore ?? 0) + (args.sharedScoreAdd ?? 0)
          : undefined,
      status: "roundEnd",
      updatedAt: Date.now(),
    });
  },
});

export const leaveRoom = mutation({
  args: {
    roomId: v.id("multiplayerRooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) return;

    await ctx.db.patch(args.roomId, {
      status: "finished",
      updatedAt: Date.now(),
    });
  },
});

export const updateSharedEnergy = mutation({
  args: {
    roomId: v.id("multiplayerRooms"),
    energy: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.roomId, {
      sharedEnergy: args.energy,
      updatedAt: Date.now(),
    });
  },
});
