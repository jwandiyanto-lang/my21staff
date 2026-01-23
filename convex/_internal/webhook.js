import { httpRouter } from "convex/server";
import { httpAction } from "../_generated/server.js";
import { api, internal } from "../_generated/api.js";

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

// ============================================
// Clerk Webhook: User sync events
// ============================================

http.route({
  path: "/webhook/clerk",
  method: "POST",
  handler: httpAction(async ({ runMutation }, request) => {
    const startTime = Date.now();
    let eventType = "unknown";
    let clerkId = null;

    try {
      // Get raw body and headers for signature verification
      const rawBody = await request.text();
      const svixId = request.headers.get("svix-id");
      const svixTimestamp = request.headers.get("svix-timestamp");
      const svixSignature = request.headers.get("svix-signature");

      // Verify svix signature
      const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
      if (!webhookSecret) {
        console.error("[Clerk Webhook] CLERK_WEBHOOK_SECRET not set");
        return new Response(JSON.stringify({ error: "Webhook secret not configured" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Svix signature verification
      // Format: v1,<signature>
      const signaturePayload = `${svixId}.${svixTimestamp}.${rawBody}`;
      const crypto = require("crypto");

      // Extract the signature (may have multiple, take first v1)
      const signatures = svixSignature.split(" ");
      let verified = false;

      for (const sig of signatures) {
        const [version, signature] = sig.split(",");
        if (version === "v1") {
          const secretBytes = Buffer.from(webhookSecret.replace("whsec_", ""), "base64");
          const expectedSignature = crypto
            .createHmac("sha256", secretBytes)
            .update(signaturePayload)
            .digest("base64");

          if (signature === expectedSignature) {
            verified = true;
            break;
          }
        }
      }

      if (!verified) {
        console.error("[Clerk Webhook] Invalid signature");
        await runMutation(internal.users.logWebhookEvent, {
          event_type: "signature_failed",
          payload: { headers: { svixId, svixTimestamp } },
          status: "error",
          error_message: "Invalid svix signature",
        });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Parse the verified payload
      const payload = JSON.parse(rawBody);
      eventType = payload.type;
      const userData = payload.data;
      clerkId = userData?.id;

      console.log(`[Clerk Webhook] Processing ${eventType} for user ${clerkId}`);

      // Handle user events
      switch (eventType) {
        case "user.created":
          await runMutation(internal.users.createUser, {
            clerk_id: clerkId,
          });
          break;

        case "user.updated":
          await runMutation(internal.users.updateUser, {
            clerk_id: clerkId,
          });
          break;

        case "user.deleted":
          await runMutation(internal.users.deleteUser, {
            clerk_id: clerkId,
          });
          break;

        default:
          console.log(`[Clerk Webhook] Ignoring event type: ${eventType}`);
      }

      // Log successful processing
      await runMutation(internal.users.logWebhookEvent, {
        event_type: eventType,
        clerk_id: clerkId,
        payload: { type: eventType, user_id: clerkId },
        status: "success",
      });

      const duration = Date.now() - startTime;
      console.log(`[Clerk Webhook] Processed ${eventType} in ${duration}ms`);

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[Clerk Webhook] Error after ${duration}ms:`, error);

      // Log error for debugging
      await runMutation(internal.users.logWebhookEvent, {
        event_type: eventType,
        clerk_id: clerkId,
        payload: { error: error.message },
        status: "error",
        error_message: error.message,
      });

      return new Response(JSON.stringify({ error: "Processing failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export const router = http;
