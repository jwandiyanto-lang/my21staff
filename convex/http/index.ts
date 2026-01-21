/**
 * HTTP router entry point for Convex.
 *
 * This file merges all HTTP routers into a single entry point.
 * Each router is imported and merged with the main http instance.
 *
 * Routers:
 * - Kapso webhook: /webhook/kapso (POST/GET)
 * - Contacts endpoint: /http/contacts/getByPhone (GET)
 *
 * The merged router is exported as the default export.
 */

import { httpRouter } from "convex/server";
import { router as kapsoRouter } from "./kapso";
import { router as contactsRouter } from "./contacts";

const http = httpRouter();

// Merge Kapso webhook routes
http.route(kapsoRouter);

// Merge contacts routes
http.route(contactsRouter);

export default http;
