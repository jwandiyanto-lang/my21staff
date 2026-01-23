import { httpRouter } from "convex/server";
import { httpAction } from "../_generated/server.js";
import { api } from "../_generated/api.js";

const http = httpRouter();

// ============================================
// GET: Webhook verification (Kapso sends hub.challenge)
// ============================================

http.route({
  path: "/webhook/kapso",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const challenge = url.searchParams.get("hub.challenge") || url.searchParams.get("challenge");
    if (challenge) {
      console.log("[Kapso Webhook] Verification challenge received");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response("Kapso webhook endpoint ready", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }),
});

// ============================================
// POST: Incoming WhatsApp messages from Kapso
// ============================================

http.route({
  path: "/webhook/kapso",
  method: "POST",
  handler: httpAction(async ({ runMutation, scheduler }, request) => {
    const startTime = Date.now();

    try {
      // Get raw body for signature verification
      const rawBody = await request.text();
      const signature = request.headers.get("x-kapso-signature");
      const webhookSecret = process.env.KAPSO_WEBHOOK_SECRET;

      // Verify signature if webhook secret is configured
      if (webhookSecret) {
        const crypto = require("crypto");
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(rawBody)
          .digest("hex");

        if (!signature || signature !== expectedSignature) {
          console.error("[Kapso Webhook] Invalid signature - rejecting request");
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
        console.log("[Kapso Webhook] Signature verified");
      } else {
        console.log("[Kapso Webhook] Warning: KAPSO_WEBHOOK_SECRET not set - skipping signature verification");
      }

      // Parse payload
      const payload = JSON.parse(rawBody);

      // Log incoming webhook (masked for privacy)
      const maskedPayload = JSON.stringify(payload).replace(/\d{10,15}/g, '"***"');
      console.log("[Kapso Webhook] Received payload (masked):", maskedPayload.substring(0, 500));

      // Respond immediately with 200 OK to prevent Kapso retries
      // Then schedule async processing for webhook payload
      await scheduler.runAfter(0, api.kapso.processWebhook, {
        payload: payload,
        receivedAt: Date.now(),
      });

      const duration = Date.now() - startTime;
      console.log(`[Kapso Webhook] Queued for async processing in ${duration}ms`);

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Kapso Webhook] Error after ${duration}ms:`, error);
      return new Response(JSON.stringify({ error: "Processing failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export const router = http;
