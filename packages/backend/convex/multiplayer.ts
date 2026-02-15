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
    const username = user?.username ?? identity.name ?? "Archivist";
    const avatarUrl = user?.avatarUrl ?? identity.pictureUrl ?? "";

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
      hostUsername: username,
      hostAvatarUrl: avatarUrl,
      status: "waiting",
      currentRound: 0,
      maxRounds: 5,
      hostScore: 0,
      guestScore: 0,
      hostPresent: true,
      guestPresent: false,
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
    const username = user?.username ?? identity.name ?? "Archivist";
    const avatarUrl = user?.avatarUrl ?? identity.pictureUrl ?? "";

    const room = await ctx.db
      .query("multiplayerRooms")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode.toUpperCase()))
      .first();

    if (!room) throw new Error("Room not found");
    if (room.hostClerkId === identity.subject) throw new Error("Cannot join your own room");

    // If this user is already the guest (e.g. double-click or re-render), just return
    if (room.guestClerkId === identity.subject) {
      return { roomId: room._id, roomCode: room.roomCode };
    }

    if (room.status !== "waiting") throw new Error("Room is no longer accepting players");

    await ctx.db.patch(room._id, {
      guestClerkId: identity.subject,
      guestUsername: username,
      guestAvatarUrl: avatarUrl,
      status: "ready",
      hostPresent: true,
      guestPresent: true,
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
      hostPresent: true,
      guestPresent: true,
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
      v.literal("ready"),
      v.literal("select")
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

export const finishGame = mutation({
  args: {
    roomId: v.id("multiplayerRooms"),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.status !== "roundEnd") return; // already transitioned

    await ctx.db.patch(args.roomId, {
      status: "finished",
      hostPresent: true,
      guestPresent: true,
      updatedAt: Date.now(),
    });
  },
});

export const setPresence = mutation({
  args: {
    roomId: v.id("multiplayerRooms"),
    present: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const room = await ctx.db.get(args.roomId);
    if (!room) return;

    // If a match was already ended early because someone left, freeze presence
    // so post-game default win/lose state stays stable.
    if (room.status === "finished" && room.currentRound < room.maxRounds) return;

    const isHost = room.hostClerkId === identity.subject;
    await ctx.db.patch(args.roomId, {
      ...(isHost ? { hostPresent: args.present } : { guestPresent: args.present }),
      updatedAt: Date.now(),
    });
  },
});

export const leaveRoom = mutation({
  args: {
    roomId: v.id("multiplayerRooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const room = await ctx.db.get(args.roomId);
    if (!room) return;

    const isHost = room.hostClerkId === identity.subject;
    const isGuest = room.guestClerkId === identity.subject;
    if (!isHost && !isGuest) return;

    // During active gameplay, leaving marks the player absent and allows
    // the remaining player to claim a default win after reconnect grace.
    if (room.status === "playing" || room.status === "roundEnd") {
      await ctx.db.patch(args.roomId, {
        ...(isHost ? { hostPresent: false } : { guestPresent: false }),
        updatedAt: Date.now(),
      });
      return;
    }

    await ctx.db.patch(args.roomId, {
      status: "finished",
      updatedAt: Date.now(),
    });
  },
});

export const claimWinByAbandonment = mutation({
  args: {
    roomId: v.id("multiplayerRooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be logged in");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.mode !== "race") return { ended: false };
    if (room.status !== "playing" && room.status !== "roundEnd") return { ended: false };

    const isHost = room.hostClerkId === identity.subject;
    const isGuest = room.guestClerkId === identity.subject;
    if (!isHost && !isGuest) throw new Error("Not a room participant");

    const selfPresent = isHost ? room.hostPresent !== false : room.guestPresent !== false;
    const opponentPresent = isHost ? room.guestPresent !== false : room.hostPresent !== false;

    if (!selfPresent || opponentPresent) return { ended: false };

    await ctx.db.patch(args.roomId, {
      status: "finished",
      hostPresent: isHost,
      guestPresent: !isHost,
      updatedAt: Date.now(),
    });

    return { ended: true };
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

export const getCoopSelections = query({
  args: {
    roomId: v.id("multiplayerRooms"),
    round: v.number(),
  },
  handler: async (ctx, args) => {
    const actions = await ctx.db
      .query("multiplayerActions")
      .withIndex("by_roomId_round", (q) =>
        q.eq("roomId", args.roomId).eq("round", args.round)
      )
      .collect();

    // Build a toggle map: each "select" action toggles that section
    const toggleCounts = new Map<string, { clerkId: string; count: number }>();
    for (const action of actions) {
      if (action.action !== "select" || !action.data) continue;
      try {
        const { sectionId, playerId } = JSON.parse(action.data) as {
          sectionId: string;
          playerId: string;
        };
        const key = `${playerId}:${sectionId}`;
        const existing = toggleCounts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          toggleCounts.set(key, { clerkId: playerId, count: 1 });
        }
      } catch {
        // skip malformed data
      }
    }

    // Odd count = selected, even count = deselected
    const selections: { sectionId: string; playerId: string }[] = [];
    for (const [key, { clerkId, count }] of toggleCounts.entries()) {
      if (count % 2 === 1) {
        const sectionId = key.split(":").slice(1).join(":");
        selections.push({ sectionId, playerId: clerkId });
      }
    }

    return selections;
  },
});

export const rematch = mutation({
  args: {
    roomId: v.id("multiplayerRooms"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Must be logged in");

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");
    if (room.status !== "finished") throw new Error("Game is not finished");

    // Generate new room code
    let roomCode: string;
    let attempts = 0;
    do {
      roomCode = "";
      for (let i = 0; i < 6; i++) {
        roomCode += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
      }
      const existing = await ctx.db
        .query("multiplayerRooms")
        .withIndex("by_roomCode", (q) => q.eq("roomCode", roomCode))
        .first();
      if (!existing) break;
      attempts++;
    } while (attempts < 10);

    const now = Date.now();
    const newRoomId = await ctx.db.insert("multiplayerRooms", {
      roomCode,
      mode: room.mode,
      hostClerkId: room.hostClerkId,
      guestClerkId: room.guestClerkId,
      hostUsername: room.hostUsername,
      guestUsername: room.guestUsername,
      hostAvatarUrl: room.hostAvatarUrl,
      guestAvatarUrl: room.guestAvatarUrl,
      status: "ready",
      currentRound: 0,
      maxRounds: room.maxRounds,
      hostScore: 0,
      guestScore: 0,
      sharedEnergy: room.mode === "coop" ? 10 : undefined,
      sharedScore: room.mode === "coop" ? 0 : undefined,
      createdAt: now,
      updatedAt: now,
    });

    // Update old room with rematch pointer
    await ctx.db.patch(args.roomId, {
      rematchRoomCode: roomCode,
      updatedAt: now,
    });

    return { roomId: newRoomId, roomCode };
  },
});
