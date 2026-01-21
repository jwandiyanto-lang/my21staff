/**
 * Kapso webhook processing functions.
 *
 * These scheduled functions process incoming Meta/WhatsApp webhook payloads
 * asynchronously. They handle:
 * - Finding workspace by Kapso phone_number_id
 * - Creating/updating contacts and conversations
 * - Creating inbound message records
 * - Updating conversation unread counts and last message info
 *
 * Processing is done in batches for efficiency.
 */

import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import type {
  MetaWebhookPayload,
  MetaWebhookMessage,
  MetaWebhookContact,
} from "./http/kapso";

// ============================================
// Helper: Normalize Phone Number
// ============================================

/**
 * Normalize phone number by removing non-digit characters.
 * This ensures consistent phone matching across Kapso and database.
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

// ============================================
// Internal Mutation: Process Kapso Webhook
// ============================================

/**
 * Process Kapso webhook payload asynchronously.
 *
 * This mutation is scheduled by the HTTP action after responding 200 OK.
 * It iterates through the payload, finds the workspace by kapso_phone_id,
 * and creates/updates contacts, conversations, and messages.
 *
 * @param payload - The Meta/WhatsApp webhook payload
 * @param receivedAt - Timestamp when webhook was received
 */
export const processWebhook = internalMutation({
  args: {
    payload: v.any(),
    receivedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { payload, receivedAt } = args;
    const startTime = Date.now();

    const webhookPayload = payload as MetaWebhookPayload;

    // Collect all messages grouped by workspace and phone
    const workspaceMessages = new Map<
      string,
      Map<string, { message: MetaWebhookMessage; contactInfo?: MetaWebhookContact }[]>
    >();

    // Iterate over entry -> changes -> messages
    for (const entry of webhookPayload.entry) {
      for (const change of entry.changes) {
        if (change.field !== "messages") continue;

        const value = change.value;
        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId) {
          console.log("[Kapso] No phone_number_id in metadata");
          continue;
        }

        // Find workspace by kapso_phone_id
        const workspace = await ctx.db
          .query("workspaces")
          .withIndex("by_kapso_phone", (q) =>
            q.eq("kapso_phone_id", phoneNumberId)
          )
          .first();

        if (!workspace) {
          console.log(
            `[Kapso] No workspace for phone_number_id: ${phoneNumberId}`
          );
          continue;
        }

        const workspaceId = workspace._id;
        const contacts = value.contacts || [];
        const messages = value.messages || [];

        if (messages.length === 0) continue;

        // Initialize workspace map if needed
        if (!workspaceMessages.has(workspaceId)) {
          workspaceMessages.set(workspaceId, new Map());
        }

        // Group messages by phone number
        for (const message of messages) {
          const phone = message.from;
          if (!workspaceMessages.get(workspaceId)!.has(phone)) {
            workspaceMessages.get(workspaceId)!.set(phone, []);
          }

          const contactInfo = contacts.find((c) => c.wa_id === phone);
          workspaceMessages.get(workspaceId)!.get(phone)!.push({
            message,
            contactInfo,
          });
        }
      }
    }

    // Process each workspace's messages
    let totalMessages = 0;
    for (const [workspaceId, phoneMessages] of workspaceMessages) {
      await processWorkspaceMessages(ctx, workspaceId, phoneMessages);
      totalMessages += Array.from(phoneMessages.values()).flat().length;
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Kapso] Processed ${totalMessages} messages across ${workspaceMessages.size} workspace(s) in ${duration}ms`
    );
  },
});

// ============================================
// Internal Mutation: Process Workspace Messages
// ============================================

/**
 * Process all messages for a single workspace.
 *
 * @param ctx - Convex mutation context
 * @param workspaceId - The workspace ID
 * @param phoneMessages - Map of phone -> array of messages with contact info
 */
async function processWorkspaceMessages(
  ctx: any,
  workspaceId: string,
  phoneMessages: Map<string, { message: MetaWebhookMessage; contactInfo?: MetaWebhookContact }[]>
): Promise<void> {
  // Get unique phone numbers
  const phones = Array.from(phoneMessages.keys());

  // Batch 1: Get or create all contacts
  const contactMap = new Map<string, any>();
  for (const phone of phones) {
    const messages = phoneMessages.get(phone)!;
    const contactInfo = messages[0]?.contactInfo;

    // Try to find existing contact by normalized phone
    const normalized = normalizePhone(phone);

    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", workspaceId).eq("phone", phone)
      )
      .first();

    const now = Date.now();

    if (existing) {
      // Update contact with Kapso info if available
      const updates: any = {
        updated_at: now,
        phone_normalized: normalized,
        cache_updated_at: now,
      };

      if (contactInfo?.profile?.name && contactInfo.profile.name !== existing.kapso_name) {
        updates.kapso_name = contactInfo.profile.name;
        if (!existing.name) {
          updates.name = contactInfo.profile.name;
        }
      }

      await ctx.db.patch(existing._id, updates);
      contactMap.set(phone, existing);
    } else {
      // Create new contact
      const contactId = await ctx.db.insert("contacts", {
        workspace_id: workspaceId,
        phone,
        phone_normalized: normalized,
        name: contactInfo?.profile?.name || null,
        kapso_name: contactInfo?.profile?.name || null,
        email: null,
        lead_score: 0,
        lead_status: "new",
        tags: [],
        assigned_to: null,
        source: "whatsapp",
        metadata: {},
        cache_updated_at: now,
        created_at: now,
        updated_at: now,
        supabaseId: "",
      });

      contactMap.set(phone, await ctx.db.get(contactId));
    }
  }

  // Batch 2: Get or create conversations
  const conversationMap = new Map<string, any>();
  for (const [phone, contact] of contactMap) {
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contact_id", contact._id))
      .first();

    if (existing) {
      conversationMap.set(phone, existing);
    } else {
      const now = Date.now();
      const convId = await ctx.db.insert("conversations", {
        workspace_id: workspaceId,
        contact_id: contact._id,
        status: "open",
        assigned_to: null,
        unread_count: 0,
        last_message_at: null,
        last_message_preview: null,
        created_at: now,
        updated_at: now,
        supabaseId: "",
      });

      conversationMap.set(phone, await ctx.db.get(convId));
    }
  }

  // Batch 3: Create messages (deduplicate by kapso_message_id)
  const allMessages = Array.from(phoneMessages.entries()).flatMap(([phone, msgs]) =>
    msgs.map((m) => ({ phone, message: m.message }))
  );

  // Check for existing messages to avoid duplicates
  const messageIds = allMessages.map((m) => m.message.id);
  const existingMessages = await ctx.db
    .query("messages")
    .filter((q: any) => q.has("kapso_message_id"))
    .collect();

  const existingIds = new Set(
    existingMessages
      .filter((m: any) => m.kapso_message_id)
      .map((m: any) => m.kapso_message_id)
  );

  const newMessages = allMessages.filter((m) => !existingIds.has(m.message.id));

  if (newMessages.length === 0) {
    console.log(`[Kapso] All ${allMessages.length} messages already exist, skipping`);
    return;
  }

  // Group by conversation for conversation updates
  const conversationUpdates = new Map<string, { count: number; lastPreview: string }>();

  for (const { phone, message } of newMessages) {
    const conversation = conversationMap.get(phone);
    if (!conversation) continue;

    // Extract message content based on type
    let content: string | undefined;
    let mediaUrl: string | undefined;
    const messageType = message.type || "text";

    switch (messageType) {
      case "text":
        content = message.text?.body;
        break;
      case "image":
        mediaUrl = message.image?.id;
        content = message.image?.caption || "[Image]";
        break;
      case "audio":
        mediaUrl = message.audio?.id;
        content = "[Audio message]";
        break;
      case "video":
        mediaUrl = message.video?.id;
        content = message.video?.caption || "[Video]";
        break;
      case "document":
        mediaUrl = message.document?.id;
        content =
          message.document?.caption ||
          `[Document: ${message.document?.filename || "file"}]`;
        break;
      default:
        content = `[${messageType}]`;
    }

    const now = Date.now();

    // Build metadata for reply context
    const metadata: any = {};
    if (message.context) {
      metadata.reply_to_kapso_id = message.context.id;
      metadata.reply_to_from = message.context.from;
    }

    // Create message
    await ctx.db.insert("messages", {
      conversation_id: conversation._id,
      workspace_id: workspaceId,
      direction: "inbound",
      sender_type: "contact",
      sender_id: message.from,
      content,
      message_type: messageType,
      media_url: mediaUrl,
      kapso_message_id: message.id,
      metadata,
      created_at: now,
      supabaseId: "",
    });

    // Track conversation update
    const existing = conversationUpdates.get(conversation._id) || {
      count: 0,
      lastPreview: "",
    };
    existing.count++;
    existing.lastPreview = content?.substring(0, 200) || "[media]";
    conversationUpdates.set(conversation._id, existing);
  }

  // Batch 4: Update conversations
  for (const [conversationId, update] of conversationUpdates) {
    const conversation = conversationMap.get(
      Array.from(conversationMap.entries()).find(([_, c]) => c._id === conversationId)![0]
    );

    await ctx.db.patch(conversationId, {
      unread_count: (conversation?.unread_count || 0) + update.count,
      last_message_at: Date.now(),
      last_message_preview: update.lastPreview,
      updated_at: Date.now(),
    });
  }

  console.log(
    `[Kapso] Saved ${newMessages.length} messages, updated ${conversationUpdates.size} conversations`
  );
}
