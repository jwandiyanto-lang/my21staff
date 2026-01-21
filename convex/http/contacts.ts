/**
 * HTTP actions for external API access to Convex.
 *
 * These endpoints provide headless access to Convex queries for integration
 * with external services (Kapso webhooks, Next.js API routes).
 *
 * For the spike, we use CRM_API_KEY for authentication. In production with
 * Supabase JWT auth, we'd use the JWT token instead.
 */

import { httpRouter, httpAction } from "convex/server";
import { api } from "../_generated/server";

const http = httpRouter();

/**
 * POST /webhook/kapso
 *
 * Kapso webhook endpoint for receiving message events.
 *
 * For the spike, this accepts the webhook and responds immediately.
 * In full implementation: create/update conversation, messages, and trigger
 * AI responses.
 */
http.route({
  path: "/webhook/kapso",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify API key for internal use
    const apiKey = request.headers.get("x-api-key");
    if (apiKey !== process.env.CRM_API_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();

    // Process webhook (placeholder for spike)
    // In full implementation: create/update conversation, messages

    console.log("[Webhook] Kapso webhook received:", JSON.stringify(body, null, 2));

    // Respond immediately to prevent retries
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

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

export default http;
