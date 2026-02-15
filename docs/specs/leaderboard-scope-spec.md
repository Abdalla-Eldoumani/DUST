# Leaderboard Scope and Save-State Spec

## Goal
Ensure score persistence and leaderboard updates are consistent at game end, with explicit leaderboard scopes:
- Solo leaderboards are split by level.
- Co-op has a separate leaderboard.

## Functional Requirements
1. Game-over save state transitions:
   - `saving` while backend mutation is in flight.
   - `saved` only after backend confirms mutation completion.
   - `error` if mutation fails, with retry.
2. Leaderboard submission must include a scope:
   - `solo` with optional `level` (used for per-level solo boards).
   - `coop` (single board).
3. Leaderboard storage must upsert per user per scope, preserving best-score behavior.
4. Leaderboard read APIs must filter by scope and return rank within that scope only.
5. Existing gameplay integration must continue working for solo game-over and multiplayer result submission.

## Non-Goals
- Redesigning the full leaderboard UI beyond scope selection controls.
- Historical score timelines (this remains best-score-per-user-per-scope).

## Acceptance Criteria
- A solo score submitted for level N appears in solo level N board and not in other solo levels/co-op board.
- A co-op score appears in co-op board.
- Game-over status changes from saving to saved only after mutation resolves.
- Rank queries are scope-aware.

## Task Checklist
- [x] Extend leaderboard schema for scoped leaderboards and indexes.
- [x] Refactor leaderboard submit/getTop/getMyRank for scope-aware behavior.
- [x] Update solo game-over submission to send `leaderboardType: "solo"`.
- [x] Update multiplayer submission to send explicit scope (`coop` for co-op, `solo` for race fallback).
- [x] Update leaderboard page to query selected scope (solo level / co-op).
- [x] Run type checks and resolve any errors.
