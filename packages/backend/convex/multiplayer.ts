import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEFAULT_MAX_PLAYERS = 5;

function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

// Helper: get the canonical players array from a room, falling back to legacy fields
type PlayerEntry = {
  clerkId: string;
  username: string;
  avatarUrl: string;
  score: number;
  present: boolean;
  isHost: boolean;
  joinOrder: number;
};

function getPlayers(room: {
  players?: PlayerEntry[] | null;
  hostClerkId: string;
  hostUsername?: string;
  hostAvatarUrl?: string;
  hostScore?: number;
  hostPresent?: boolean;
  guestClerkId?: string;
  guestUsername?: string;
  guestAvatarUrl?: string;
  guestScore?: number;
  guestPresent?: boolean;
}): PlayerEntry[] {
  if (room.players && room.players.length > 0) return room.players;

  // Fallback: build from legacy host/guest fields
  const players: PlayerEntry[] = [
    {
      clerkId: room.hostClerkId,
      username: room.hostUsername ?? "Host",
      avatarUrl: room.hostAvatarUrl ?? "",
      score: room.hostScore ?? 0,
      present: room.hostPresent !== false,
      isHost: true,
      joinOrder: 0,
    },
  ];

  if (room.guestClerkId) {
    players.push({
      clerkId: room.guestClerkId,
      username: room.guestUsername ?? "Guest",
      avatarUrl: room.guestAvatarUrl ?? "",
      score: room.guestScore ?? 0,
      present: room.guestPresent !== false,
      isHost: false,
      joinOrder: 1,
    });
  }

  return players;
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
      maxPlayers: DEFAULT_MAX_PLAYERS,
      hostScore: 0,
      guestScore: 0,
      hostPresent: true,
      guestPresent: false,
      players: [
        {
          clerkId: identity.subject,
          username,
          avatarUrl,
          score: 0,
          present: true,
          isHost: true,
          joinOrder: 0,
        },
      ],
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

    const players = getPlayers(room);
    const maxPlayers = room.maxPlayers ?? DEFAULT_MAX_PLAYERS;

    // If this user is already in the room, just return
    if (players.some((p) => p.clerkId === identity.subject)) {
      return { roomId: room._id, roomCode: room.roomCode };
    }

    // Allow joining when waiting or ready (room still in lobby)
    if (room.status !== "waiting" && room.status !== "ready") {
      throw new Error(
        `Room is no longer accepting players (current status: ${room.status})`
      );
    }

    if (players.length >= maxPlayers) {
      throw new Error(`Room is full (${maxPlayers} players max)`);
    }

    const newPlayer: PlayerEntry = {
      clerkId: identity.subject,
      username,
      avatarUrl,
      score: 0,
      present: true,
      isHost: false,
      joinOrder: players.length,
    };

    const updatedPlayers = [...players, newPlayer];

    // Status becomes "ready" when >= 2 players
    const newStatus = updatedPlayers.length >= 2 ? "ready" : "waiting";

    await ctx.db.patch(room._id, {
      // Legacy fields for backward compat (fill guest with latest joiner)
      guestClerkId: identity.subject,
      guestUsername: username,
      guestAvatarUrl: avatarUrl,
      guestPresent: true,
      hostPresent: true,
      status: newStatus,
      players: updatedPlayers,
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

    const players = getPlayers(room);

    // Reset all player scores to 0 and mark present
    const resetPlayers = players.map((p) => ({
      ...p,
      score: 0,
      present: true,
    }));

    await ctx.db.patch(args.roomId, {
      status: "playing",
      currentRound: 1,
      currentContentId: args.contentId,
      sharedEnergy: room.mode === "coop" ? 10 : undefined,
      sharedScore: room.mode === "coop" ? 0 : undefined,
      hostPresent: true,
      guestPresent: true,
      hostScore: 0,
      guestScore: 0,
      players: resetPlayers,
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
    hostScoreAdd: v.optional(v.number()),
    guestScoreAdd: v.optional(v.number()),
    scoreUpdates: v.optional(v.array(v.object({ clerkId: v.string(), scoreAdd: v.number() }))),
    sharedScoreAdd: v.optional(v.number()),
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    const newRound = room.currentRound + 1;
    const isFinished = newRound > room.maxRounds;

    // Update players array scores
    const players = getPlayers(room);
    const updatedPlayers = players.map((p) => {
      if (args.scoreUpdates) {
        const update = args.scoreUpdates.find((u) => u.clerkId === p.clerkId);
        return { ...p, score: p.score + (update?.scoreAdd ?? 0) };
      }
      // Legacy path
      if (p.isHost) return { ...p, score: p.score + (args.hostScoreAdd ?? 0) };
      return { ...p, score: p.score + (args.guestScoreAdd ?? 0) };
    });

    await ctx.db.patch(args.roomId, {
      hostScore: (room.hostScore ?? 0) + (args.hostScoreAdd ?? 0),
      guestScore: (room.guestScore ?? 0) + (args.guestScoreAdd ?? 0),
      sharedScore:
        room.mode === "coop"
          ? (room.sharedScore ?? 0) + (args.sharedScoreAdd ?? 0)
          : undefined,
      currentRound: isFinished ? room.currentRound : newRound,
      currentContentId: isFinished ? room.currentContentId : args.contentId,
      status: isFinished ? "finished" : "playing",
      sharedEnergy: room.mode === "coop" && !isFinished ? 10 : room.sharedEnergy,
      players: updatedPlayers,
      updatedAt: Date.now(),
    });
  },
});

export const endRound = mutation({
  args: {
    roomId: v.id("multiplayerRooms"),
    hostScoreAdd: v.optional(v.number()),
    guestScoreAdd: v.optional(v.number()),
    scoreUpdates: v.optional(v.array(v.object({ clerkId: v.string(), scoreAdd: v.number() }))),
    sharedScoreAdd: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("Room not found");

    // Update players array scores
    const players = getPlayers(room);
    const updatedPlayers = players.map((p) => {
      if (args.scoreUpdates) {
        const update = args.scoreUpdates.find((u) => u.clerkId === p.clerkId);
        return { ...p, score: p.score + (update?.scoreAdd ?? 0) };
      }
      // Legacy path
      if (p.isHost) return { ...p, score: p.score + (args.hostScoreAdd ?? 0) };
      return { ...p, score: p.score + (args.guestScoreAdd ?? 0) };
    });

    await ctx.db.patch(args.roomId, {
      hostScore: (room.hostScore ?? 0) + (args.hostScoreAdd ?? 0),
      guestScore: (room.guestScore ?? 0) + (args.guestScoreAdd ?? 0),
      sharedScore:
        room.mode === "coop"
          ? (room.sharedScore ?? 0) + (args.sharedScoreAdd ?? 0)
          : undefined,
      status: "roundEnd",
      players: updatedPlayers,
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

    // Mark all players as present in the players array
    const players = getPlayers(room);
    const updatedPlayers = players.map((p) => ({ ...p, present: true }));

    await ctx.db.patch(args.roomId, {
      status: "finished",
      hostPresent: true,
      guestPresent: true,
      players: updatedPlayers,
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
    if (room.status === "finished" && room.currentRound < room.maxRounds) return;

    const players = getPlayers(room);
    const playerIdx = players.findIndex((p) => p.clerkId === identity.subject);

    // Update players array
    if (playerIdx >= 0) {
      const updatedPlayers = players.map((p, i) =>
        i === playerIdx ? { ...p, present: args.present } : p
      );
      await ctx.db.patch(args.roomId, {
        players: updatedPlayers,
        updatedAt: Date.now(),
      });
    }

    // Also update legacy fields
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
    const players = getPlayers(room);
    const playerIdx = players.findIndex((p) => p.clerkId === identity.subject);
    if (playerIdx < 0) return;

    // Before a match starts, room membership should be actively cleaned up.
    if (room.status === "waiting" || room.status === "ready") {
      if (isHost) {
        await ctx.db.patch(args.roomId, {
          status: "finished",
          hostPresent: false,
          guestPresent: false,
          updatedAt: Date.now(),
        });
        return;
      }

      await ctx.db.patch(args.roomId, {
        guestClerkId: undefined,
        guestUsername: undefined,
        guestAvatarUrl: undefined,
        status: "waiting",
        hostPresent: true,
        guestPresent: false,
        updatedAt: Date.now(),
      });
      return;
    }

    // During active gameplay, leaving marks the player absent
    if (room.status === "playing" || room.status === "roundEnd") {
      const updatedPlayers = players.map((p, i) =>
        i === playerIdx ? { ...p, present: false } : p
      );

      const isHost = room.hostClerkId === identity.subject;
      await ctx.db.patch(args.roomId, {
        ...(isHost ? { hostPresent: false } : { guestPresent: false }),
        players: updatedPlayers,
        updatedAt: Date.now(),
      });
      return;
    }

    // In lobby: remove from array
    const updatedPlayers = players.filter((_, i) => i !== playerIdx);

    // If host leaves, end the room
    if (players[playerIdx].isHost) {
      await ctx.db.patch(args.roomId, {
        status: "finished",
        players: updatedPlayers,
        updatedAt: Date.now(),
      });
      return;
    }

    // Revert to "waiting" if < 2 players remain
    const newStatus = updatedPlayers.length >= 2 ? "ready" : "waiting";

    await ctx.db.patch(args.roomId, {
      ...(isHost ? { hostPresent: false } : { guestPresent: false }),
      status: newStatus,
      players: updatedPlayers,
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

    const players = getPlayers(room);
    const me = players.find((p) => p.clerkId === identity.subject);
    if (!me) throw new Error("Not a room participant");
    if (!me.present) return { ended: false };

    // Check if ALL other players are absent
    const otherPlayers = players.filter((p) => p.clerkId !== identity.subject);
    const allOthersAbsent = otherPlayers.every((p) => !p.present);
    if (!allOthersAbsent) return { ended: false };

    // Mark all others as absent, self as present
    const updatedPlayers = players.map((p) =>
      p.clerkId === identity.subject ? { ...p, present: true } : { ...p, present: false }
    );

    const isHost = room.hostClerkId === identity.subject;
    await ctx.db.patch(args.roomId, {
      status: "finished",
      hostPresent: isHost,
      guestPresent: !isHost,
      players: updatedPlayers,
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
    for (const [key, { count }] of toggleCounts.entries()) {
      if (count % 2 === 1) {
        const parts = key.split(":");
        const playerId = parts[0];
        const sectionId = parts.slice(1).join(":");
        selections.push({ sectionId, playerId });
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

    // Copy players array with scores reset
    const oldPlayers = getPlayers(room);
    const newPlayers = oldPlayers.map((p) => ({
      ...p,
      score: 0,
      present: true,
    }));

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
      maxPlayers: room.maxPlayers ?? DEFAULT_MAX_PLAYERS,
      hostScore: 0,
      guestScore: 0,
      sharedEnergy: room.mode === "coop" ? 10 : undefined,
      sharedScore: room.mode === "coop" ? 0 : undefined,
      players: newPlayers,
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
