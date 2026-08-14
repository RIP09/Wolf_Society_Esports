/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as account from "../account.js";
import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as announcements from "../announcements.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as automation from "../automation.js";
import type * as content from "../content.js";
import type * as crons from "../crons.js";
import type * as gallery from "../gallery.js";
import type * as guards from "../guards.js";
import type * as http from "../http.js";
import type * as inquiries from "../inquiries.js";
import type * as matches from "../matches.js";
import type * as notify from "../notify.js";
import type * as payments from "../payments.js";
import type * as performance from "../performance.js";
import type * as players from "../players.js";
import type * as presence from "../presence.js";
import type * as public_ from "../public.js";
import type * as push from "../push.js";
import type * as rateLimit from "../rateLimit.js";
import type * as schedules from "../schedules.js";
import type * as security from "../security.js";
import type * as securityLogs from "../securityLogs.js";
import type * as seed from "../seed.js";
import type * as sponsors from "../sponsors.js";
import type * as stats from "../stats.js";
import type * as teams from "../teams.js";
import type * as tournaments from "../tournaments.js";
import type * as uploads from "../uploads.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  account: typeof account;
  admin: typeof admin;
  analytics: typeof analytics;
  announcements: typeof announcements;
  attendance: typeof attendance;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  automation: typeof automation;
  content: typeof content;
  crons: typeof crons;
  gallery: typeof gallery;
  guards: typeof guards;
  http: typeof http;
  inquiries: typeof inquiries;
  matches: typeof matches;
  notify: typeof notify;
  payments: typeof payments;
  performance: typeof performance;
  players: typeof players;
  presence: typeof presence;
  public: typeof public_;
  push: typeof push;
  rateLimit: typeof rateLimit;
  schedules: typeof schedules;
  security: typeof security;
  securityLogs: typeof securityLogs;
  seed: typeof seed;
  sponsors: typeof sponsors;
  stats: typeof stats;
  teams: typeof teams;
  tournaments: typeof tournaments;
  uploads: typeof uploads;
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
