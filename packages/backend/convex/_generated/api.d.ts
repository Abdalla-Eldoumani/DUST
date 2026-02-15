/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as archives from "../archives.js";
import type * as cachedContent from "../cachedContent.js";
import type * as gameSessions from "../gameSessions.js";
import type * as healthCheck from "../healthCheck.js";
import type * as leaderboard from "../leaderboard.js";
import type * as levels from "../levels.js";
import type * as multiplayer from "../multiplayer.js";
import type * as pageVariants from "../pageVariants.js";
import type * as pages from "../pages.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  archives: typeof archives;
  cachedContent: typeof cachedContent;
  gameSessions: typeof gameSessions;
  healthCheck: typeof healthCheck;
  leaderboard: typeof leaderboard;
  levels: typeof levels;
  multiplayer: typeof multiplayer;
  pageVariants: typeof pageVariants;
  pages: typeof pages;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
