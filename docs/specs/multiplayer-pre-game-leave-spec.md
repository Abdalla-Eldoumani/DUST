# Spec: Multiplayer Pre-Game Leave Cleanup

## Problem
When a player joins a multiplayer room and then leaves before the game starts, the player is not removed from the room state. This leaves stale room membership and blocks expected host flow.

## Scope
This spec only covers room membership cleanup in pre-game states:
- `waiting`
- `ready`

Active round behavior (`playing`, `roundEnd`) stays presence-based.

## Behavioral Requirements
1. If a guest leaves during pre-game, remove guest identity fields from the room and return room status to `waiting`.
2. If a host cancels/leaves during pre-game, close the room so it is no longer usable.
3. UI "leave/back" actions from pre-game room screens must call backend leave cleanup before navigation.

## Acceptance Criteria
1. Host creates room, guest joins, guest leaves:
   - `guestClerkId`, `guestUsername`, `guestAvatarUrl` are cleared.
   - `status` becomes `waiting`.
2. Host creates room and cancels:
   - room transitions to closed/finished and cannot be joined.
3. From pre-game room UI, clicking the header back control triggers leave cleanup (not only client navigation).

## Task List
- [x] Update backend `leaveRoom` mutation with explicit pre-game host/guest handling.
- [x] Update multiplayer room page pre-game back control to call `leaveRoom`.
- [x] Validate TypeScript compilation for changed files (`npm run check-types`).
