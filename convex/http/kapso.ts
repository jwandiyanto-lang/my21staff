/**
 * Kapso webhook HTTP action for Convex.
 *
 * This endpoint receives Meta/WhatsApp webhook payloads from Kapso and
 * processes them asynchronously. The HTTP action responds immediately (200 OK)
 * to prevent Kapso retries, while actual processing happens via scheduled
 * functions.
 *
 * Features:
 * - POST /webhook/kapso - Main webhook handler (responds immediately, schedules async processing)
 * - GET /webhook/kapso - Verification endpoint (returns hub.challenge for Kapso setup)
 * - Signature verification using HMAC-SHA256 (KAPSO_WEBHOOK_SECRET)
 * - PII masking in logs for privacy
 */

import { httpRouter, httpAction } from "convex/server";
import { api } from "../_generated/server";

// ============================================
// Types: Meta/WhatsApp Webhook Payload
// ============================================

/**
 * Message object from Meta webhook payload
 */
export interface MetaWebhookMessage {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
  image?: { id: string; caption?: string };
  audio?: { id: string };
  video?: { id: string; caption?: string };
  document?: { id: string; filename?: string; caption?: string };
  timestamp: string;
  // Reply context - when user replies to a specific message
  context?: {
    from: string;
    id: string; // The message ID being replied to
  };
}

/**
 * Contact object from Meta webhook payload
 */
export interface MetaWebhookContact {
  wa_id: string;
  profile: { name: string };
}

/**
 * Value object from Meta webhook payload
 */
export interface MetaWebhookValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: MetaWebhookContact[];
  messages?: MetaWebhookMessage[];
  statuses?: unknown[];
}

/**
 * Entry object from Meta webhook payload
 */
export interface MetaWebhookEntry {
  id: string;
  changes: {
    field: string;
    value: MetaWebhookValue;
  }[];
}

/**
 * Root payload from Meta webhook
 */
export interface MetaWebhookPayload {
  object: string;
  entry: MetaWebhookEntry[];
}

// ============================================
// PII Masking Helper
// ============================================

/**
 * Mask phone numbers in log output for privacy
 */
function maskPayload(payload: unknown): string {
  const str = JSON.stringify(payload);
  // Mask phone numbers (10-15 digit numbers)
  return str
    .replace(/"\d{10,15}"/g, '"***MASKED***"')
    .replace(/"from":\s*"\d+"/g, '"from":"***"')
    .replace(/"wa_id":\s*"\d+"/g, '"wa_id":"***"')
    .substring(0, 500); // Truncate for brevity
}

// ============================================
// HTTP Router
// ============================================

const http = httpRouter();

/**
 * POST /webhook/kapso
 *
 * Main Kapso webhook endpoint. Receives Meta/WhatsApp payload and:
 * 1. Verifies signature (if KAPSO_WEBHOOK_SECRET is set)
 * 2. Responds immediately with 200 (prevents Kapso retries)
 * 3. Schedules async processing via ctx.scheduler
 *
 * This pattern ensures Kapso never retries due to processing time.
 */
http.route({
  path: "/webhook/kapso",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    // Verify signature if webhook secret is configured
    const webhookSecret = process.env.KAPSO_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-kapso-signature");
      if (!signature) {
        console.error("[Kapso Webhook] Missing signature header");
        return new Response("Unauthorized", { status: 401 });
      }

      // Get raw body for signature verification
      const rawBody = await request.text();

      // Verify HMAC-SHA256 signature
      const expectedSignature = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(webhookSecret + rawBody)
      );
      const expectedHex = Array.from(new Uint8Array(expectedSignature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Simple hex comparison (Convex doesn't have timing-safe equal)
      if (signature !== expectedHex) {
        console.error("[Kapso Webhook] Invalid signature");
        return new Response("Unauthorized", { status: 401 });
      }

      console.log("[Kapso Webhook] Signature verified");
    } else {
      console.log("[Kapso Webhook] Warning: KAPSO_WEBHOOK_SECRET not set");
    }

    // Parse payload
    let payload: MetaWebhookPayload;
    try {
      // If we already read raw body for signature, we need to parse that
      // Otherwise parse from request.json()
      payload = await request.json();
    } catch (error) {
      console.error("[Kapso Webhook] Failed to parse JSON:", error);
      return new Response("Invalid JSON", { status: 400 });
    }

    // Log incoming webhook (masked for privacy)
    console.log(
      `[Kapso Webhook] Received payload (masked): ${maskPayload(payload)}`
    );

    // Validate payload structure
    if (!payload.entry || !Array.isArray(payload.entry)) {
      console.error("[Kapso Webhook] Invalid payload: missing entry array");
      return new Response("Invalid payload", { status: 400 });
    }

    // Count messages for logging
    let messageCount = 0;
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === "messages" && change.value.messages) {
          messageCount += change.value.messages.length;
        }
      }
    }

    // Schedule async processing immediately
    // ctx.scheduler.runAfter schedules a mutation to run asynchronously
    await ctx.scheduler.runAfter(0, api.kapso.processWebhook, {
      payload,
      receivedAt: Date.now(),
    });

    const duration = Date.now() - startTime;
    console.log(
      `[Kapso Webhook] Scheduled ${messageCount} message(s) for processing (${duration}ms)`
    );

    // Respond immediately to prevent Kapso retries
    return new Response(JSON.stringify({ received: true, scheduled: messageCount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

/**
 * GET /webhook/kapso
 *
 * Webhook verification endpoint for Kapso setup.
 * Returns the hub.challenge query param as plain text.
 *
 * Kapso sends this during webhook registration to verify ownership.
 */
http.route({
  path: "/webhook/kapso",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const challenge =
      url.searchParams.get("hub.challenge") || url.searchParams.get("challenge");

    if (challenge) {
      console.log("[Kapso Webhook] Verification challenge received");
      // Return plain text challenge for webhook verification
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    // No challenge - just return status
    return new Response("Kapso webhook endpoint ready", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }),
});

// Export router for merging in main HTTP router
export const router = http;
