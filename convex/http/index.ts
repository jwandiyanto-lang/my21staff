/**
 * HTTP router entry point for Convex.
 *
 * This file merges all HTTP routers into a single entry point.
 * Routes from each router module are added directly to the main router.
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

// Get routes from sub-routers and register them directly
const getRoutes = (router: any) => {
  if (router.getRoutes) {
    return router.getRoutes();
  }
  return [];
};

const http = httpRouter();

// Register Kapso webhook routes
const kapsoRoutes = getRoutes(kapsoRouter);
for (const [path, method, handler] of kapsoRoutes) {
  // @ts-ignore - handler type inference
  http.route({ path, method, handler });
}

// Register contacts routes
const contactsRoutes = getRoutes(contactsRouter);
for (const [path, method, handler] of contactsRoutes) {
  // @ts-ignore - handler type inference
  http.route({ path, method, handler });
}

export default http;
