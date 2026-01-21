/**
 * HTTP actions for contacts endpoint access.
 *
 * This provides headless access to Convex queries for integration
 * with external services.
 *
 * Note: Kapso webhook is now in kapso.ts
 */

import { httpRouter, httpAction } from "convex/server";
import { api } from "../_generated/server";

const http = httpRouter();

/**
 * GET /http/contacts/getByPhone?phone={phone}&workspace_id={workspace_id}
 *
 * Get contact context by phone number.
 *
 * Returns the same structure as /api/contacts/by-phone but directly
 * from Convex. This is used for benchmarking Convex vs Supabase performance.
 */
http.route({
  path: "/http/contacts/getByPhone",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    // Verify API key
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.CRM_API_KEY) {
      return new Response(
        JSON.stringify({ found: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const phone = url.searchParams.get("phone");
    const workspaceId = url.searchParams.get("workspace_id");

    if (!phone || !workspaceId) {
      return new Response(
        JSON.stringify({ found: false, error: "Missing parameters" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Call getContextByPhone query
    const result = await ctx.runQuery(
      api.contacts.getContextByPhone,
      { phone, workspace_id: workspaceId }
    );

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// Export router for merging in main HTTP router
export const router = http;
