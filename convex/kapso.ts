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
import { api } from "./_generated/api";
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
      console.log(`[Kapso] ARI not enabled for workspace ${workspaceId}`);
      continue;
    }

    // Check if workspace has Kapso credentials
    const workspace = await ctx.db.get(workspaceId);
    if (!workspace?.meta_access_token) {
      console.log(`[Kapso] No Kapso credentials for workspace ${workspaceId}`);
      continue;
    }

    // Schedule ARI processing
    // @ts-ignore - processARI exists but types aren't synced
    await ctx.scheduler.runAfter(0, api.kapso.processARI as any, {
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
 * This is a scheduled action that can make external API calls
 * to Kapso and AI models. It:
 * 1. Gets workspace and contact info
 * 2. Gets ARI configuration
 * 3. Builds context from recent messages
 * 4. Calls AI to generate response
 * 5. Sends response via Kapso API
 * 6. Logs both user message and AI response
 *
 * @param workspace_id - The workspace ID
 * @param contact_id - The contact ID
 * @param contact_phone - Contact's phone number
 * @param user_message - The user's text message
 * @param kapso_message_id - Original Kapso message ID
 */
export const processARI = internalMutation({
  args: {
    workspace_id: v.string(),
    contact_id: v.string(),
    contact_phone: v.string(),
    user_message: v.string(),
    kapso_message_id: v.string(),
  },
  handler: async (ctx, args) => {
    const {
      workspace_id,
      contact_id,
      contact_phone,
      user_message,
      kapso_message_id,
    } = args;
    const startTime = Date.now();

    console.log(
      `[ARI] Processing message for contact ${contact_id} in workspace ${workspace_id}`
    );

    // Get workspace (for Kapso credentials)
    const workspace = await ctx.db.get(workspace_id as any);
    if (!workspace) {
      console.error(`[ARI] Workspace not found: ${workspace_id}`);
      return;
    }

    // @ts-ignore - workspace may be different type in union
    if (!workspace || !(workspace as any).meta_access_token || !(workspace as any).kapso_phone_id) {
      console.log(`[ARI] No Kapso credentials configured for workspace`);
      return;
    }

    // Get ARI configuration
    // @ts-ignore - workspace_id type
    const ariConfig = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q: any) => q.eq("workspace_id", workspace_id))
      .first();

    if (!ariConfig) {
      console.log(`[ARI] ARI not enabled for workspace ${workspace_id}`);
      return;
    }

    // Get contact information
    const contact = await ctx.db.get(contact_id as any);
    if (!contact) {
      console.error(`[ARI] Contact not found: ${contact_id}`);
      return;
    }

    // Get or create ARI conversation
    // @ts-ignore - ariConversations types not synced
    let ariConversation = await ctx.db
      .query("ariConversations" as any)
      .withIndex("by_workspace_contact", (q: any) =>
        q.eq("workspace_id", workspace_id).eq("contact_id", contact_id)
      )
      .first();

    if (!ariConversation) {
      const now = Date.now();
      // @ts-ignore - ariConversations types not synced
      const ariConvId = await ctx.db.insert("ariConversations" as any, {
        workspace_id,
        contact_id,
        state: "greeting",
        lead_score: 0,
        created_at: now,
        updated_at: now,
        supabaseId: "",
      });
      ariConversation = await ctx.db.get(ariConvId as any);
    }

    if (!ariConversation) {
      console.error("[ARI] Failed to create ARI conversation");
      return;
    }

    // Get recent ARI messages for context
    // @ts-ignore - ariMessages and q types not synced
    const recentMessages = await ctx.db
      .query("ariMessages" as any)
      .withIndex("by_conversation_time", (q: any) =>
        q.eq("ari_conversation_id", (ariConversation as any)._id)
      )
      .order("desc")
      .take(20);

    // Reverse to get chronological order
    const messageHistory = recentMessages.reverse();

    // Build system prompt
    const systemPrompt = buildSystemPrompt(ariConfig, contact);

    // Build message history array
    const messages = [
      { role: "system", content: systemPrompt },
      ...messageHistory.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: user_message },
    ];

    // Generate AI response
    const aiResponse = await generateAIResponse(
      ariConversation.ai_model || "sea-lion",
      messages
    );

    const responseTime = Date.now() - startTime;

    // Log user message
    // @ts-ignore - ariMessages types not synced
    await ctx.db.insert("ariMessages" as any, {
      ari_conversation_id: (ariConversation as any)._id,
      workspace_id,
      role: "user",
      content: user_message,
      created_at: Date.now(),
    });

    // Log AI response
    // @ts-ignore - ariMessages types not synced
    await ctx.db.insert("ariMessages" as any, {
      ari_conversation_id: (ariConversation as any)._id,
      workspace_id: workspace_id as any,
      role: "assistant",
      content: aiResponse.content,
      ai_model: aiResponse.model,
      tokens_used: aiResponse.tokens,
      response_time_ms: responseTime,
      created_at: Date.now(),
    });

    // Update ARI conversation
    await ctx.db.patch(ariConversation._id, {
      last_ai_message_at: Date.now(),
      updated_at: Date.now(),
    });

    // Send response via Kapso API
    // @ts-ignore - workspace optional access
    await sendKapsoMessage(
      (workspace as any).meta_access_token,
      (workspace as any).kapso_phone_id,
      contact_phone,
      aiResponse.content
    );

    // Create outbound message record
    // @ts-ignore - conversation optional access
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q: any) => q.eq("contact_id", contact_id))
      .first();

    if (conversation) {
      // @ts-ignore - messages types not synced
      await ctx.db.insert("messages" as any, {
        conversation_id: (conversation as any)._id,
        workspace_id,
        direction: "outbound",
        sender_type: "bot",
        sender_id: "ari",
        content: aiResponse.content,
        message_type: "text",
        kapso_message_id: aiResponse.kapso_message_id,
        metadata: {
          ari_model: aiResponse.model,
          response_time_ms: responseTime,
        },
        created_at: Date.now(),
        supabaseId: "",
      });

      // Update conversation last message
      // @ts-ignore - conversation optional access
      await ctx.db.patch((conversation as any)._id, {
        last_message_at: Date.now(),
        last_message_preview: aiResponse.content.substring(0, 200),
        updated_at: Date.now(),
      });
    }

    console.log(
      `[ARI] Response sent in ${responseTime}ms (${aiResponse.model})`
    );
  },
});

// ============================================
// Helper: Build System Prompt
// ============================================

function buildSystemPrompt(ariConfig: any, contact: any): string {
  const { bot_name = "ARI", greeting_style = "professional", language = "id" } =
    ariConfig;

  const greetingStyles: Record<string, string> = {
    professional: "formal dan profesional",
    friendly: "ramah dan hangat",
    casual: "santai dan tidak formal",
  };

  const style = greetingStyles[greeting_style] || "profesional";

  const contactName = contact?.name || contact?.kapso_name || "kakak";

  return `Kamu adalah ${bot_name}, asisten AI dari my21staff.

Bahasa: ${language === "id" ? "Bahasa Indonesia" : "English"}
Gaya: ${style}

Kamu sedang berbicara dengan ${contactName}.

Tugasmu:
1. Sapa pelanggan dengan ramah
2. Bantu menjawab pertanyaan tentang produk/jasa
3. Jika pelanggan tertarik, kumpulkan info (nama, email, kebutuhan)
4. Beri informasi cara memesan atau konsultasi

Jangan:
- Membuat janji yang tidak bisa dipenuhi
- Mengatakan hal-hal yang tidak kamu ketahui
- Terlalu formal atau robotik

Jawab dengan singkat dan langsung ke inti.`;
}

// ============================================
// Helper: Generate AI Response
// ============================================

interface AIResponse {
  content: string;
  model: string;
  tokens?: number;
  kapso_message_id?: string;
}

async function generateAIResponse(
  model: string,
  messages: { role: string; content: string }[]
): Promise<AIResponse> {
  // Try Sea-Lion first (local Ollama via Tailscale)
  if (model === "sea-lion" || model === "default") {
    try {
      const seaLionUrl = process.env.SEALION_URL || "http://100.113.96.25:11434";
      const response = await fetch(`${seaLionUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "sea-lion",
          prompt: formatMessages(messages),
          stream: false,
          options: {
            num_ctx: 2048,
            temperature: 0.8,
            top_p: 0.9,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          content: data.response || data.message?.content || "",
          model: "sea-lion",
          tokens: data.eval_count,
        };
      }
    } catch (error) {
      console.error("[ARI] Sea-Lion error, falling back to Grok:", error);
    }
  }

  // Fall back to Grok
  if (model === "grok" || true) {
    const grokApiKey = process.env.GROK_API_KEY;
    if (!grokApiKey) {
      console.warn("[ARI] No GROK_API_KEY configured, using fallback");
      return {
        content: "Terima kasih sudah menghubungi kami. Konsultan kami akan segera membantu.",
        model: "fallback",
      };
    }

    try {
      const response = await fetch(
        "https://api.x.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${grokApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "grok-beta",
            messages,
            max_tokens: 150,
            temperature: 0.8,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          content: data.choices?.[0]?.message?.content || "",
          model: "grok-beta",
          tokens: data.usage?.total_tokens,
        };
      }
    } catch (error) {
      console.error("[ARI] Grok error:", error);
    }
  }

  // Final fallback
  return {
    content: "Terima kasih sudah menghubungi kami. Konsultan kami akan segera membantu.",
    model: "fallback",
  };
}

function formatMessages(
  messages: { role: string; content: string }[]
): string {
  return messages
    .map((m) => {
      if (m.role === "system") return `${m.content}\n\n`;
      if (m.role === "user") return `User: ${m.content}\n`;
      if (m.role === "assistant") return `Assistant: ${m.content}\n`;
      return `${m.content}\n`;
    })
    .join("") + "Assistant:";
}

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
