/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _internal_webhook from "../_internal/webhook.js";
import type * as ari from "../ari.js";
import type * as cms from "../cms.js";
import type * as contacts from "../contacts.js";
import type * as conversations from "../conversations.js";
import type * as http from "../http.js";
import type * as http_kapso from "../http/kapso.js";
import type * as kapso from "../kapso.js";
import type * as lib_auth from "../lib/auth.js";
import type * as messages from "../messages.js";
import type * as migrate from "../migrate.js";
import type * as mutations from "../mutations.js";
import type * as organizations from "../organizations.js";
import type * as testAuth from "../testAuth.js";
import type * as tickets from "../tickets.js";
import type * as users from "../users.js";
import type * as workspaceMembers from "../workspaceMembers.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_internal/webhook": typeof _internal_webhook;
  ari: typeof ari;
  cms: typeof cms;
  contacts: typeof contacts;
  conversations: typeof conversations;
  http: typeof http;
  "http/kapso": typeof http_kapso;
  kapso: typeof kapso;
  "lib/auth": typeof lib_auth;
  messages: typeof messages;
  migrate: typeof migrate;
  mutations: typeof mutations;
  organizations: typeof organizations;
  testAuth: typeof testAuth;
  tickets: typeof tickets;
  users: typeof users;
  workspaceMembers: typeof workspaceMembers;
  workspaces: typeof workspaces;
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
