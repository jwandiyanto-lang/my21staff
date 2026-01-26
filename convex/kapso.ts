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

// @ts-nocheck - Schema types mismatch with generated Convex types
import { mutation, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
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
        name: contactInfo?.profile?.name || undefined,
        kapso_name: contactInfo?.profile?.name || undefined,
        email: undefined,
        lead_score: 0,
        lead_status: "new",
        tags: [],
        assigned_to: undefined,
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
      .withIndex("by_contact", (q: any) => q.eq("contact_id", contact._id))
      .first();

    if (existing) {
      conversationMap.set(phone, existing);
    } else {
      const now = Date.now();
      const convId = await ctx.db.insert("conversations", {
        workspace_id: workspaceId,
        contact_id: contact._id,
        status: "open",
        assigned_to: undefined,
        unread_count: 0,
        last_message_at: undefined,
        last_message_preview: undefined,
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
    .withIndex("by_workspace", (q: any) => q.eq("workspace_id", workspaceId))
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

  // Batch 5: Schedule ARI processing for text messages
  for (const { phone, message } of newMessages) {
    const contact = contactMap.get(phone);
    const conversation = conversationMap.get(phone);

    // Only process text messages for ARI
    if (!contact || !conversation || message.type !== "text") {
      continue;
    }

    const textContent = message.text?.body;
    if (!textContent) continue;

    // Check if ARI is enabled for this workspace
    const ariConfig = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", workspaceId))
      .first();

    if (!ariConfig) {
      console.log(`[Kapso] ARI not configured for workspace ${workspaceId}`);
      continue;
    }

    // Check if AI is explicitly disabled (enabled defaults to true if not set)
    if (ariConfig.enabled === false) {
      console.log(`[Kapso] AI is disabled for workspace ${workspaceId}`);
      continue;
    }

    // Check if workspace has Kapso credentials
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace?.meta_access_token) {
      console.log(`[Kapso] No Kapso credentials for workspace ${workspaceId}`);
      continue;
    }

    // Schedule ARI processing (processARI is an internalMutation)
    await ctx.scheduler.runAfter(0, internal.kapso.processARI, {
      workspace_id: workspaceId,
      contact_id: contact._id,
      contact_phone: phone,
      user_message: textContent,
      kapso_message_id: message.id,
    });
  }

  if (contactMap.size > 0) {
    console.log(
      `[Kapso] Scheduled ARI processing for eligible text messages`
    );
  }
}

// ============================================
// Scheduled Action: Process ARI
// ============================================

/**
 * Process ARI for a single message.
 *
 * This is an internalAction that can make external API calls
 * to Kapso and AI models. It uses helper mutations for database operations.
 *
 * Flow:
 * 1. Get context (workspace, config, contact, conversation, messages) via mutation
 * 2. Call The Mouth (action) for AI response
 * 3. Save response (messages, usage) via mutation
 * 4. Send via Kapso API (HTTP call)
 * 5. Log outbound message via mutation
 * 6. Schedule The Brain (action) for async analysis
 */
export const processARI = internalAction({
  args: {
    workspace_id: v.id("workspaces"),
    contact_id: v.id("contacts"),
    contact_phone: v.string(),
    user_message: v.string(),
    kapso_message_id: v.string(),
  },
  handler: async (ctx, args) => {
    const { workspace_id, contact_id, contact_phone, user_message } = args;
    const startTime = Date.now();

    console.log(`[ARI] Processing message for contact ${contact_id} in workspace ${workspace_id}`);

    // 1. Get context from database
    console.log(`[ARI] Step 1: Getting context...`);
    const context = await ctx.runMutation(internal.kapso.getAriContext, {
      workspace_id,
      contact_id,
    });

    if ("error" in context) {
      console.log(`[ARI] Context error: ${context.error}`);
      return;
    }
    console.log(`[ARI] Context loaded: conversation=${context.ariConversationId}, ${context.messageHistory.length} messages`);

    // 2. Call The Mouth for AI response
    console.log(`[ARI] Step 2: Calling The Mouth (state=${context.ariState})...`);
    let mouthResponse;
    try {
      mouthResponse = await ctx.runAction(internal.ai.mouth.generateMouthResponse, {
        conversationHistory: context.messageHistory,
        userMessage: user_message,
        botName: context.ariConfig.bot_name,
        contactName: context.contact.name || context.contact.kapso_name || undefined,
        language: context.ariConfig.language,
        state: context.ariState,
        context: context.ariContext,
        communityLink: context.ariConfig.community_link,
      });
    } catch (mouthError) {
      console.error(`[ARI] Mouth error: ${mouthError}`);
      // Use fallback response
      mouthResponse = {
        content: context.ariConfig.language === "en"
          ? "Thank you for contacting us. Our consultant will help you shortly."
          : "Terima kasih sudah menghubungi kami. Konsultan kami akan segera membantu.",
        model: "fallback" as const,
        tokens: 0,
        responseTimeMs: 0,
      };
    }

    const responseTime = Date.now() - startTime;
    console.log(`[ARI] Mouth response: model=${mouthResponse.model}, tokens=${mouthResponse.tokens}, content="${mouthResponse.content.substring(0, 50)}..."`);

    // 3. Save response to database
    console.log(`[ARI] Step 3: Saving response...`);
    await ctx.runMutation(internal.kapso.saveAriResponse, {
      workspace_id,
      contact_id,
      ariConversationId: context.ariConversationId,
      user_message,
      ai_response: mouthResponse.content,
      ai_model: mouthResponse.model,
      tokens: mouthResponse.tokens,
      response_time_ms: responseTime,
    });

    // 4. Send response via Kapso API
    const kapsoMessageId = await sendKapsoMessage(
      context.workspace.meta_access_token,
      context.workspace.kapso_phone_id,
      contact_phone,
      mouthResponse.content
    );

    // 5. Log outbound message
    await ctx.runMutation(internal.kapso.logOutboundMessage, {
      workspace_id,
      contact_id,
      content: mouthResponse.content,
      ai_model: mouthResponse.model,
      response_time_ms: responseTime,
      kapso_message_id: kapsoMessageId,
    });

    console.log(`[ARI] Response sent in ${responseTime}ms (${mouthResponse.model})`);

    // 6. Call The Brain for analysis (directly, not scheduled)
    console.log("[ARI] Step 6: Calling The Brain for analysis...");
    let brainResponse;
    try {
      brainResponse = await ctx.runAction(internal.ai.brain.analyzeConversation, {
        workspaceId: workspace_id,
        contactId: contact_id,
        ariConversationId: context.ariConversationId,
        recentMessages: [
          ...context.messageHistory,
          { role: "user", content: user_message },
          { role: "assistant", content: mouthResponse.content },
        ],
        contactName: context.contact.name || context.contact.kapso_name || undefined,
        currentScore: context.contact.lead_score || 0,
      });
      console.log(`[ARI] Brain analysis complete: ${JSON.stringify(brainResponse?.analysis || {})}`);
    } catch (brainError) {
      console.error(`[ARI] Brain error: ${brainError}`);
    }

    // 7. Check Brain's next_action for consultation/handoff triggers
    if (brainResponse?.analysis?.next_action) {
      const nextAction = brainResponse.analysis.next_action;

      if (nextAction === "offer_consultation" || nextAction === "handoff_human") {
        console.log(`[ARI] Brain triggered ${nextAction} - calling handleConsultationRequest`);

        await handleConsultationRequest(
          ctx,
          context.workspace._id,
          context.contact._id,
          context.ariConversationId,
          nextAction === "handoff_human"
            ? "User explicitly requested human assistance"
            : "User interested in consultation"
        );
      }
    }
  },
});

// ============================================
// Helper: Send Kapso Message
// ============================================

async function sendKapsoMessage(
  metaAccessToken: string,
  phoneId: string,
  to: string,
  text: string
): Promise<string | undefined> {
  const cleanPhone = to.replace(/\D/g, "");
  const apiUrl = `https://api.kapso.ai/meta/whatsapp/v24.0/${phoneId}/messages`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "X-API-Key": metaAccessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: cleanPhone,
        type: "text",
        text: { body: text },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.messages?.[0]?.id;
    } else {
      const errorText = await response.text();
      console.error(`[ARI] Kapso API error: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error("[ARI] Kapso send failed:", error);
  }

  return undefined;
}

// ============================================
// Helper Mutations for ARI Processing
// (Used by processARI action for database operations)
// ============================================

/**
 * Get ARI context - workspace, config, contact, conversation, messages.
 */
export const getAriContext = internalMutation({
  args: {
    workspace_id: v.id("workspaces"),
    contact_id: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    // Get workspace
    const workspace = await ctx.db.get(args.workspace_id);
    if (!workspace || !workspace.meta_access_token || !workspace.kapso_phone_id) {
      return { error: "No Kapso credentials" };
    }

    // Get ARI config
    const ariConfig = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q: any) => q.eq("workspace_id", args.workspace_id))
      .first();
    if (!ariConfig) {
      return { error: "ARI not enabled" };
    }

    // Get contact
    const contact = await ctx.db.get(args.contact_id);
    if (!contact) {
      return { error: "Contact not found" };
    }

    // Get or create ARI conversation
    let ariConversation = await ctx.db
      .query("ariConversations" as any)
      .withIndex("by_workspace_contact", (q: any) =>
        q.eq("workspace_id", args.workspace_id).eq("contact_id", args.contact_id)
      )
      .first();

    if (!ariConversation) {
      const now = Date.now();
      const ariConvId = await ctx.db.insert("ariConversations" as any, {
        workspace_id: args.workspace_id,
        contact_id: args.contact_id,
        state: "greeting",
        lead_score: 0,
        created_at: now,
        updated_at: now,
        supabaseId: "",
      });
      ariConversation = await ctx.db.get(ariConvId as any);
    }

    if (!ariConversation) {
      return { error: "Failed to create ARI conversation" };
    }

    // Get recent messages
    const recentMessages = await ctx.db
      .query("ariMessages" as any)
      .withIndex("by_conversation_time", (q: any) =>
        q.eq("ari_conversation_id", ariConversation._id)
      )
      .order("desc")
      .take(20);

    return {
      workspace: {
        _id: workspace._id,
        meta_access_token: workspace.meta_access_token,
        kapso_phone_id: workspace.kapso_phone_id,
      },
      ariConfig: {
        bot_name: ariConfig.bot_name,
        language: ariConfig.language,
        community_link: ariConfig.community_link,
      },
      contact: {
        _id: contact._id,
        name: contact.name,
        kapso_name: contact.kapso_name,
        lead_score: contact.lead_score,
      },
      ariConversationId: ariConversation._id,
      ariState: ariConversation.state,
      ariContext: ariConversation.context,
      messageHistory: recentMessages.reverse().map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    };
  },
});

/**
 * Save ARI response - log messages and usage.
 */
export const saveAriResponse = internalMutation({
  args: {
    workspace_id: v.id("workspaces"),
    contact_id: v.id("contacts"),
    ariConversationId: v.id("ariConversations"),
    user_message: v.string(),
    ai_response: v.string(),
    ai_model: v.string(),
    tokens: v.number(),
    response_time_ms: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Log user message
    await ctx.db.insert("ariMessages" as any, {
      ari_conversation_id: args.ariConversationId,
      workspace_id: args.workspace_id,
      role: "user",
      content: args.user_message,
      created_at: now,
    });

    // Log AI response
    await ctx.db.insert("ariMessages" as any, {
      ari_conversation_id: args.ariConversationId,
      workspace_id: args.workspace_id,
      role: "assistant",
      content: args.ai_response,
      ai_model: args.ai_model,
      tokens_used: args.tokens,
      response_time_ms: args.response_time_ms,
      created_at: now,
    });

    // Log Mouth usage (skip for fallback)
    if (args.ai_model !== "fallback") {
      await ctx.db.insert("aiUsage", {
        workspace_id: args.workspace_id,
        conversation_id: args.ariConversationId,
        model: args.ai_model,
        ai_type: "mouth",
        input_tokens: args.tokens,
        output_tokens: 0,
        cost_usd: args.ai_model === "grok-3"
          ? args.tokens * (5 / 1_000_000)
          : 0,
        created_at: now,
      });
    }

    // Update ARI conversation
    await ctx.db.patch(args.ariConversationId, {
      last_ai_message_at: now,
      updated_at: now,
    });
  },
});

/**
 * Log outbound message to messages table.
 */
export const logOutboundMessage = internalMutation({
  args: {
    workspace_id: v.id("workspaces"),
    contact_id: v.id("contacts"),
    content: v.string(),
    ai_model: v.string(),
    response_time_ms: v.number(),
    kapso_message_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find conversation
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q: any) => q.eq("contact_id", args.contact_id))
      .first();

    if (!conversation) return;

    const now = Date.now();

    // Create outbound message
    await ctx.db.insert("messages" as any, {
      conversation_id: conversation._id,
      workspace_id: args.workspace_id,
      direction: "outbound",
      sender_type: "bot",
      sender_id: "ari",
      content: args.content,
      message_type: "text",
      kapso_message_id: args.kapso_message_id,
      metadata: {
        ari_model: args.ai_model,
        response_time_ms: args.response_time_ms,
      },
      created_at: now,
      supabaseId: "",
    });

    // Update conversation
    await ctx.db.patch(conversation._id, {
      last_message_at: now,
      last_message_preview: args.content.substring(0, 200),
      updated_at: now,
    });
  },
});

/**
 * Update ariConversation context with new data.
 * Merges new data with existing context.
 */
export const updateAriContext = internalMutation({
  args: {
    ariConversationId: v.id("ariConversations"),
    updates: v.any(), // Partial QualificationContext
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.ariConversationId);
    if (!conversation) return;

    const existingContext = conversation.context || {};
    const mergedContext = {
      ...existingContext,
      ...args.updates,
      // Deep merge for nested objects
      collected: {
        ...(existingContext.collected || {}),
        ...(args.updates.collected || {}),
      },
      documents: {
        ...(existingContext.documents || {}),
        ...(args.updates.documents || {}),
      },
      routing: {
        ...(existingContext.routing || {}),
        ...(args.updates.routing || {}),
      },
    };

    await ctx.db.patch(args.ariConversationId, {
      context: mergedContext,
      updated_at: Date.now(),
    });
  },
});

/**
 * Flag conversation for human attention.
 */
export const flagForHuman = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.conversationId, {
      status: "open",  // Ensure it's visible
      unread_count: 1, // Flag as needing attention
      updated_at: Date.now(),
    });
  },
});

/**
 * Find conversation by contact ID.
 */
export const findConversationByContact = internalQuery({
  args: {
    contactId: v.id("contacts"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contact_id", args.contactId))
      .first();
  },
});

/**
 * Handle consultation request - update state and notify human.
 * Called when Brain's next_action is "offer_consultation" or "handoff_human".
 * This function is CALLED by Plan 04-04 Task 4 in processARI.
 */
async function handleConsultationRequest(
  ctx: any,
  workspaceId: string,
  contactId: string,
  ariConversationId: string,
  reason: string
): Promise<void> {
  const now = Date.now();

  // Update context to mark consultation requested
  await ctx.runMutation(internal.kapso.updateAriContext, {
    ariConversationId,
    updates: {
      routing: {
        consultation_requested_at: now,
        choice: "consultation",
      },
    },
  });

  // Update conversation state to handoff
  await ctx.runMutation(internal.ai.brain.updateConversationState, {
    ariConversationId,
    state: "handoff",
    leadScore: 70, // Minimum hot lead score
    leadTemperature: "hot",
  });

  // Update conversation status to flag for human attention
  // Find the regular conversation and mark unread
  const conversation = await ctx.runQuery(internal.kapso.findConversationByContact, {
    contactId,
  });

  if (conversation) {
    await ctx.runMutation(internal.kapso.flagForHuman, {
      conversationId: conversation._id,
      reason,
    });
  }

  console.log(`[ARI] Consultation requested - flagged for human (${reason})`);
}
