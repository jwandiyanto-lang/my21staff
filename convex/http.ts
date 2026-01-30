import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { getSarahState, upsertSarahState } from "./sarah";

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
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    try {
      const rawBody = await request.text();
      const payload = JSON.parse(rawBody);

      // Log incoming webhook (masked for privacy)
      const maskedPayload = JSON.stringify(payload).replace(/\d{10,15}/g, '"***"');
      console.log("[Kapso Webhook] Received payload (masked):", maskedPayload.substring(0, 500));

      // Schedule async processing
      await ctx.scheduler.runAfter(0, internal.kapso.processWebhook, {
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
// n8n Webhook: Lead creation from Google Forms
// ============================================

http.route({
  path: "/webhook/n8n",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();

    try {
      const rawBody = await request.text();
      const payload = JSON.parse(rawBody);

      console.log("[n8n Webhook] Received lead data:", {
        name: payload.name,
        phone: payload.phone?.substring(0, 6) + "***", // Mask phone for privacy
      });

      // Resolve workspace by slug (hardcoded for Eagle Overseas)
      const workspace = await ctx.runQuery(api.workspaces.getBySlug, {
        slug: "eagle-overseas",
      });

      if (!workspace) {
        console.error("[n8n Webhook] Workspace 'eagle-overseas' not found");
        return new Response(JSON.stringify({ error: "Workspace not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Call createLead mutation (convert null to undefined for optional fields)
      const result = await ctx.runMutation(api.n8n.createLead, {
        workspace_id: workspace._id,
        name: payload.name || "Unknown",
        phone: payload.phone,
        email: payload.email || undefined,
        lead_score: payload.lead_score || 0,
        metadata: payload.metadata || undefined,
      });

      const duration = Date.now() - startTime;
      console.log(`[n8n Webhook] Processed lead in ${duration}ms:`, result);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[n8n Webhook] Error after ${duration}ms:`, error);

      return new Response(JSON.stringify({
        success: false,
        error: errorMessage
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

// ============================================
// Sarah Bot: Conversation state management (for Kapso Function nodes)
// ============================================

/**
 * GET /sarah/state - Retrieve Sarah conversation state
 * Called by Kapso before processing a message to get current conversation state
 */
http.route({
  path: "/sarah/state",
  method: "GET",
  handler: getSarahState,
});

/**
 * POST /sarah/state - Upsert Sarah conversation state
 * Called by Kapso after each message to save/update conversation state
 */
http.route({
  path: "/sarah/state",
  method: "POST",
  handler: upsertSarahState,
});

// ============================================
// Clerk Webhook: User sync events
// ============================================

// Helper: Base64 decode (works in Convex runtime)
function base64Decode(str: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  const output: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "=") break;
    const index = chars.indexOf(char);
    if (index === -1) continue;

    buffer = (buffer << 6) | index;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      output.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(output);
}

// Helper: Uint8Array to base64
function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  const len = bytes.length;

  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;

    result += chars[b1 >> 2];
    result += chars[((b1 & 3) << 4) | (b2 >> 4)];
    result += i + 1 < len ? chars[((b2 & 15) << 2) | (b3 >> 6)] : "=";
    result += i + 2 < len ? chars[b3 & 63] : "=";
  }

  return result;
}

// Verify svix signature using Web Crypto API
async function verifySvixSignature(
  secret: string,
  svixId: string | null,
  svixTimestamp: string | null,
  rawBody: string,
  svixSignature: string | null
): Promise<boolean> {
  if (!svixId || !svixTimestamp || !svixSignature) {
    return false;
  }

  // Strip whsec_ prefix and decode
  const secretKey = secret.replace("whsec_", "");
  const secretBytes = base64Decode(secretKey);

  // Import the key for HMAC-SHA256
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Create the signed payload
  const signaturePayload = `${svixId}.${svixTimestamp}.${rawBody}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(signaturePayload);

  // Generate signature
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, data);
  const expectedSignature = uint8ArrayToBase64(new Uint8Array(signatureBuffer));

  // Check against provided signatures (may have multiple)
  const signatures = svixSignature.split(" ");
  for (const sig of signatures) {
    const [version, signature] = sig.split(",");
    if (version === "v1" && signature === expectedSignature) {
      return true;
    }
  }

  return false;
}

http.route({
  path: "/webhook/clerk",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const startTime = Date.now();
    let eventType = "unknown";
    let clerkId: string | null = null;

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

      // Verify signature using Web Crypto API
      const verified = await verifySvixSignature(
        webhookSecret,
        svixId,
        svixTimestamp,
        rawBody,
        svixSignature
      );

      if (!verified) {
        console.error("[Clerk Webhook] Invalid signature");
        await ctx.runMutation(internal.users.logWebhookEvent, {
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

      console.log(`[Clerk Webhook] Processing ${eventType}`);

      // Handle user events
      switch (eventType) {
        case "user.created":
          await ctx.runMutation(internal.users.createUser, {
            clerk_id: clerkId,
          });
          break;

        case "user.updated":
          await ctx.runMutation(internal.users.updateUser, {
            clerk_id: clerkId,
          });
          break;

        case "user.deleted":
          await ctx.runMutation(internal.users.deleteUser, {
            clerk_id: clerkId,
          });
          break;

        // Organization events
        case "organization.created":
          await ctx.runMutation(internal.organizations.createOrganization, {
            clerk_org_id: userData.id,
            name: userData.name,
            slug: userData.slug,
            workspace_id: userData.public_metadata?.convexWorkspaceId,
          });
          clerkId = userData.id; // For audit logging
          break;

        case "organization.updated":
          await ctx.runMutation(internal.organizations.updateOrganization, {
            clerk_org_id: userData.id,
            name: userData.name,
            slug: userData.slug,
          });
          clerkId = userData.id;
          break;

        case "organization.deleted":
          await ctx.runMutation(internal.organizations.deleteOrganization, {
            clerk_org_id: userData.id,
          });
          clerkId = userData.id;
          break;

        // Organization membership events
        case "organizationMembership.created":
          await ctx.runMutation(internal.organizations.addMember, {
            clerk_org_id: userData.organization.id,
            clerk_user_id: userData.public_user_data.user_id,
            role: userData.role,
          });
          clerkId = userData.public_user_data.user_id;
          break;

        case "organizationMembership.updated":
          await ctx.runMutation(internal.organizations.updateMemberRole, {
            clerk_org_id: userData.organization.id,
            clerk_user_id: userData.public_user_data.user_id,
            role: userData.role,
          });
          clerkId = userData.public_user_data.user_id;
          break;

        case "organizationMembership.deleted":
          await ctx.runMutation(internal.organizations.removeMember, {
            clerk_org_id: userData.organization.id,
            clerk_user_id: userData.public_user_data.user_id,
          });
          clerkId = userData.public_user_data.user_id;
          break;

        default:
          console.log(`[Clerk Webhook] Ignoring event type: ${eventType}`);
      }

      // Log successful processing
      await ctx.runMutation(internal.users.logWebhookEvent, {
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
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[Clerk Webhook] Error after ${duration}ms:`, error);

      // Log error for debugging
      await ctx.runMutation(internal.users.logWebhookEvent, {
        event_type: eventType,
        clerk_id: clerkId,
        payload: { error: errorMessage },
        status: "error",
        error_message: errorMessage,
      });

      return new Response(JSON.stringify({ error: "Processing failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
