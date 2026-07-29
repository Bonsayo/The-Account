/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as checkSchema from "../checkSchema.js";
import type * as crons from "../crons.js";
import type * as discoveredGames from "../discoveredGames.js";
import type * as matches from "../matches.js";
import type * as persistQuarterEnd from "../persistQuarterEnd.js";
import type * as scrapeCyberBasketball from "../scrapeCyberBasketball.js";
import type * as transitionQuarter from "../transitionQuarter.js";
import type * as upsertMatch from "../upsertMatch.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  checkSchema: typeof checkSchema;
  crons: typeof crons;
  discoveredGames: typeof discoveredGames;
  matches: typeof matches;
  persistQuarterEnd: typeof persistQuarterEnd;
  scrapeCyberBasketball: typeof scrapeCyberBasketball;
  transitionQuarter: typeof transitionQuarter;
  upsertMatch: typeof upsertMatch;
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
