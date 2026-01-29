/**
 * Admin utilities for one-off operations.
 */

import { mutation, query, internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Create ariConfig for a workspace.
 */
export const createAriConfig = mutation({
  args: {
    workspaceId: v.string(),
    botName: v.string(),
    greetingStyle: v.string(),
    language: v.string(),
    communityLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const id = await ctx.db.insert("ariConfig", {
      workspace_id: args.workspaceId as any,
      bot_name: args.botName,
      greeting_style: args.greetingStyle,
      language: args.language,
      community_link: args.communityLink,
      created_at: now,
      updated_at: now,
    });

    return { id, message: "ariConfig created successfully" };
  },
});

/**
 * Toggle ARI on/off for a workspace.
 * Deletes ariConfig to disable, recreates to enable.
 */
export const toggleAri = mutation({
  args: {
    workspaceId: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existingConfig = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspaceId as any))
      .first();

    if (args.enabled) {
      // Enable ARI - create config if not exists
      if (existingConfig) {
        return { enabled: true, message: "ARI already enabled" };
      }
      const now = Date.now();
      await ctx.db.insert("ariConfig", {
        workspace_id: args.workspaceId as any,
        bot_name: "Ari",
        greeting_style: "friendly",
        language: "id",
        created_at: now,
        updated_at: now,
      });
      return { enabled: true, message: "ARI enabled" };
    } else {
      // Disable ARI - delete config if exists
      if (!existingConfig) {
        return { enabled: false, message: "ARI already disabled" };
      }
      await ctx.db.delete(existingConfig._id);
      return { enabled: false, message: "ARI disabled" };
    }
  },
});

// ============================================
// DIAGNOSTIC QUERIES
// ============================================

/**
 * Set default contact tags for a workspace.
 * Used to initialize tags for production workspaces.
 */
export const setDefaultContactTags = mutation({
  args: {
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId as any);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const defaultTags = ['Hot Lead', 'Warm Lead', 'Cold Lead', 'Student', 'Parent', 'Follow Up', 'Community', '1on1'];

    // Type cast needed because ctx.db.get returns union of all table types
    const existingSettings = ((workspace as any).settings as Record<string, unknown>) || {};

    await ctx.db.patch(workspace._id, {
      settings: {
        ...existingSettings,
        contact_tags: defaultTags,
      },
    });

    return { success: true, tags: defaultTags };
  },
});

/**
 * Set custom contact tags for a workspace.
 * Used by Settings page to update tags.
 */
export const setContactTags = mutation({
  args: {
    workspaceId: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const workspace = await ctx.db.get(args.workspaceId as any);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Type cast needed because ctx.db.get returns union of all table types
    const existingSettings = ((workspace as any).settings as Record<string, unknown>) || {};

    await ctx.db.patch(workspace._id, {
      settings: {
        ...existingSettings,
        contact_tags: args.tags,
      },
    });

    return { success: true, tags: args.tags };
  },
});

/**
 * Remove "google-form" tag from all contacts in a workspace.
 * One-time cleanup operation.
 */
export const removeGoogleFormTags = mutation({
  args: {
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspaceId as any))
      .collect();

    let updatedCount = 0;
    for (const contact of contacts) {
      if (contact.tags && contact.tags.includes("google-form")) {
        const newTags = contact.tags.filter(t => t !== "google-form");
        await ctx.db.patch(contact._id, { tags: newTags });
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  },
});

/**
 * Clear ALL tags from all contacts in a workspace.
 * One-time cleanup operation.
 */
export const clearAllTags = mutation({
  args: {
    workspaceId: v.string(),
  },
  handler: async (ctx, args) => {
    const contacts = await ctx.db
      .query("contacts")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", args.workspaceId as any))
      .collect();

    let updatedCount = 0;
    for (const contact of contacts) {
      if (contact.tags && contact.tags.length > 0) {
        await ctx.db.patch(contact._id, { tags: [] });
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  },
});

/**
 * List all workspaces with their Kapso config.
 */
export const listWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const workspaces = await ctx.db.query("workspaces").collect();
    return workspaces.map((w) => ({
      _id: w._id,
      name: w.name,
      kapso_phone_id: w.kapso_phone_id,
      has_meta_token: !!w.meta_access_token,
    }));
  },
});

/**
 * List all ariConfigs with their workspace linkage.
 */
export const listAriConfigs = query({
  args: {},
  handler: async (ctx) => {
    const configs = await ctx.db.query("ariConfig").collect();
    const results = [];

    for (const config of configs) {
      const workspace = await ctx.db.get(config.workspace_id as any) as any;
      results.push({
        _id: config._id,
        workspace_id: config.workspace_id,
        workspace_name: workspace?.name || "NOT FOUND",
        workspace_has_kapso: workspace ? !!workspace.kapso_phone_id : false,
        bot_name: config.bot_name,
        language: config.language,
      });
    }

    return results;
  },
});

/**
 * Fix ariConfig workspace linkage.
 * Updates the workspace_id to the correct workspace (the one with Kapso credentials).
 */
export const fixAriConfigWorkspace = mutation({
  args: {
    ariConfigId: v.id("ariConfig"),
    correctWorkspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    // Verify workspace exists and has Kapso
    const workspace = await ctx.db.get(args.correctWorkspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${args.correctWorkspaceId} not found`);
    }
    if (!workspace.kapso_phone_id) {
      throw new Error(`Workspace ${args.correctWorkspaceId} has no kapso_phone_id`);
    }

    // Update ariConfig
    await ctx.db.patch(args.ariConfigId, {
      workspace_id: args.correctWorkspaceId,
      updated_at: Date.now(),
    });

    return {
      message: "ariConfig workspace_id updated successfully",
      workspace_name: workspace.name,
      kapso_phone_id: workspace.kapso_phone_id,
    };
  },
});

/**
 * Prepare test data for ARI processing.
 * Returns workspace and contact IDs for the test action.
 */
export const prepareAriTest = internalMutation({
  args: {
    testMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Find workspace with Kapso
    const workspace = await ctx.db
      .query("workspaces")
      .filter((q) => q.neq(q.field("kapso_phone_id"), undefined))
      .first();

    if (!workspace) {
      return { error: "No workspace with kapso_phone_id found" };
    }

    // 2. Check ariConfig
    const ariConfig = await ctx.db
      .query("ariConfig")
      .withIndex("by_workspace", (q) => q.eq("workspace_id", workspace._id))
      .first();

    if (!ariConfig) {
      return { error: "No ariConfig found for workspace" };
    }

    // 3. Find or create a test contact
    let contact = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", workspace._id).eq("phone", "6281234567890")
      )
      .first();

    if (!contact) {
      const now = Date.now();
      const contactId = await ctx.db.insert("contacts", {
        workspace_id: workspace._id,
        phone: "6281234567890",
        phone_normalized: "6281234567890",
        name: "Test User",
        lead_score: 0,
        lead_status: "new",
        tags: [],
        source: "test",
        metadata: {},
        cache_updated_at: now,
        created_at: now,
        updated_at: now,
        supabaseId: "",
      });
      contact = await ctx.db.get(contactId);
    }

    if (!contact) {
      return { error: "Failed to create test contact" };
    }

    return {
      workspace_id: workspace._id,
      workspace_name: workspace.name,
      contact_id: contact._id,
      contact_phone: contact.phone,
      contact_name: contact.name,
      has_meta_token: !!workspace.meta_access_token,
    };
  },
});

/**
 * Test ARI processing manually (action version).
 * This simulates what happens when a WhatsApp message arrives.
 */
export const testAriProcessing = internalAction({
  args: {
    testMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const testMsg = args.testMessage || "Halo, saya mau tanya tentang kuliah di Australia";

    // 1. Prepare test data via mutation
    const testData = await ctx.runMutation(internal.admin.prepareAriTest, {
      testMessage: testMsg,
    });

    if ("error" in testData) {
      return testData;
    }

    // 2. Run ARI processing
    try {
      await ctx.runAction(internal.kapso.processARI, {
        workspace_id: testData.workspace_id,
        contact_id: testData.contact_id,
        contact_phone: testData.contact_phone,
        user_message: testMsg,
        kapso_message_id: `test_${Date.now()}`,
      });
      return {
        success: true,
        message: "ARI processing completed",
        workspace: testData.workspace_name,
        contact: testData.contact_name,
        test_message: testMsg,
        has_meta_token: testData.has_meta_token,
      };
    } catch (error) {
      return {
        success: false,
        error: String(error),
        workspace: testData.workspace_name,
        contact: testData.contact_name,
      };
    }
  },
});

/**
 * Public wrapper to run ARI test (schedules the internal action).
 */
export const runAriTest = mutation({
  args: {
    testMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Schedule the internal action
    await ctx.scheduler.runAfter(0, internal.admin.testAriProcessing, {
      testMessage: args.testMessage,
    });
    return { scheduled: true, message: "ARI test scheduled. Check activity in 10 seconds." };
  },
});

/**
 * Test Grok API directly.
 */
export const testGrokApi = internalAction({
  args: {},
  handler: async () => {
    const grokApiKey = process.env.GROK_API_KEY;

    if (!grokApiKey) {
      return { error: "GROK_API_KEY not found in environment" };
    }

    console.log(`[Test] GROK_API_KEY present: ${grokApiKey.substring(0, 10)}...`);

    try {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${grokApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-3",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Say hello in Indonesian." },
          ],
          max_tokens: 50,
          temperature: 0.5,
        }),
      });

      const responseText = await response.text();
      console.log(`[Test] Grok response status: ${response.status}`);
      console.log(`[Test] Grok response body: ${responseText.substring(0, 200)}`);

      if (!response.ok) {
        return {
          error: `Grok API error: ${response.status}`,
          body: responseText.substring(0, 500),
        };
      }

      const data = JSON.parse(responseText);
      return {
        success: true,
        model: data.model,
        content: data.choices?.[0]?.message?.content || "No content",
        tokens: data.usage?.total_tokens || 0,
      };
    } catch (error) {
      return { error: `Fetch error: ${error}` };
    }
  },
});

/**
 * Public wrapper for Grok test.
 */
export const runGrokTest = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.admin.testGrokApi, {});
    return { scheduled: true };
  },
});

/**
 * Test Brain analysis directly.
 * This helps diagnose if Brain works when called directly vs scheduled.
 */
export const testBrainAnalysis = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("[Test Brain] Starting direct Brain test...");

    // 1. Find workspace with Kapso
    const testData = await ctx.runMutation(internal.admin.prepareAriTest, {});

    if ("error" in testData) {
      return { error: testData.error };
    }

    // 2. Find ariConversation
    const ariConv = await ctx.runMutation(internal.admin.getFirstAriConversation, {});

    if (!ariConv) {
      return { error: "No ariConversation found. Run testAriProcessing first." };
    }

    // 3. Get recent messages from ariMessages
    const recentMsgs = await ctx.runMutation(internal.admin.getRecentAriMessages, {
      ariConversationId: ariConv._id,
    });

    console.log(`[Test Brain] Found ${recentMsgs.length} messages for conversation`);

    // 4. Call Brain directly
    try {
      const brainResult = await ctx.runAction(internal.ai.brain.analyzeConversation, {
        workspaceId: testData.workspace_id,
        contactId: testData.contact_id,
        ariConversationId: ariConv._id,
        recentMessages: recentMsgs,
        contactName: testData.contact_name,
        currentScore: 0,
      });

      return {
        success: true,
        brainResult,
      };
    } catch (error) {
      console.error("[Test Brain] Error:", error);
      return {
        success: false,
        error: String(error),
      };
    }
  },
});

/**
 * Helper: Get first ariConversation.
 */
export const getFirstAriConversation = internalMutation({
  args: {},
  handler: async (ctx) => {
    const conv = await ctx.db.query("ariConversations").first();
    return conv;
  },
});

/**
 * Helper: Get recent ariMessages for a conversation.
 */
export const getRecentAriMessages = internalMutation({
  args: {
    ariConversationId: v.id("ariConversations"),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("ariMessages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("ari_conversation_id", args.ariConversationId)
      )
      .order("desc")
      .take(10);

    return messages.reverse().map((m: any) => ({
      role: m.role,
      content: m.content,
    }));
  },
});

/**
 * Public wrapper to run Brain test.
 */
export const runBrainTest = mutation({
  args: {},
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, internal.admin.testBrainAnalysis, {});
    return { scheduled: true, message: "Brain test scheduled. Check activity in 10 seconds." };
  },
});

/**
 * Diagnostic: Check recent messages and ARI state.
 */
export const checkRecentActivity = query({
  args: {},
  handler: async (ctx) => {
    // Get recent messages (last 10)
    const messages = await ctx.db
      .query("messages")
      .order("desc")
      .take(10);

    // Get recent ariMessages (last 10)
    const ariMessages = await ctx.db
      .query("ariMessages")
      .order("desc")
      .take(10);

    // Get ariConversations
    const ariConversations = await ctx.db
      .query("ariConversations")
      .collect();

    // Get aiUsage (last 10)
    const aiUsage = await ctx.db
      .query("aiUsage")
      .order("desc")
      .take(10);

    // Get contacts with lead scores
    const contacts = await ctx.db
      .query("contacts")
      .order("desc")
      .take(5);

    return {
      messages_count: messages.length,
      ari_messages_count: ariMessages.length,
      ari_latest: ariMessages.length > 0 ? {
        role: (ariMessages[0] as any).role,
        content: (ariMessages[0] as any).content?.substring(0, 80),
        ai_model: (ariMessages[0] as any).ai_model,
      } : null,
      ari_conversations: ariConversations.map((c: any) => ({
        state: c.state,
        lead_score: c.lead_score,
        lead_temperature: c.lead_temperature,
      })),
      ai_usage_count: aiUsage.length,
      ai_usage_by_type: {
        mouth: aiUsage.filter((u: any) => u.ai_type === "mouth").length,
        brain: aiUsage.filter((u: any) => u.ai_type === "brain").length,
      },
      contacts_with_scores: contacts.map((c: any) => ({
        name: c.name,
        lead_score: c.lead_score,
        lead_status: c.lead_status,
      })),
    };
  },
});

/**
 * Clean up test data created by admin utilities.
 * Deletes contacts with phone 6281234567890 and their related data.
 */
export const cleanupTestData = mutation({
  args: {},
  handler: async (ctx) => {
    const deleted = {
      contacts: 0,
      conversations: 0,
      messages: 0,
      ariConversations: 0,
      ariMessages: 0,
    };

    // Find test contacts (phone 6281234567890)
    const testContacts = await ctx.db
      .query("contacts")
      .filter((q) => q.eq(q.field("phone"), "6281234567890"))
      .collect();

    for (const contact of testContacts) {
      // Delete related conversations and messages
      const conversations = await ctx.db
        .query("conversations")
        .filter((q) => q.eq(q.field("contact_id"), contact._id))
        .collect();

      for (const conv of conversations) {
        // Delete messages
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation_time", (q) =>
            q.eq("conversation_id", conv._id)
          )
          .collect();
        for (const msg of messages) {
          await ctx.db.delete(msg._id);
          deleted.messages++;
        }
        await ctx.db.delete(conv._id);
        deleted.conversations++;
      }

      // Delete ARI conversations and messages
      const ariConvs = await ctx.db
        .query("ariConversations")
        .filter((q) => q.eq(q.field("contact_id"), contact._id))
        .collect();

      for (const ariConv of ariConvs) {
        const ariMsgs = await ctx.db
          .query("ariMessages")
          .withIndex("by_conversation_time", (q) =>
            q.eq("ari_conversation_id", ariConv._id)
          )
          .collect();
        for (const msg of ariMsgs) {
          await ctx.db.delete(msg._id);
          deleted.ariMessages++;
        }
        await ctx.db.delete(ariConv._id);
        deleted.ariConversations++;
      }

      // Delete the contact
      await ctx.db.delete(contact._id);
      deleted.contacts++;
    }

    return {
      success: true,
      deleted,
      message: `Cleaned up test data: ${deleted.contacts} contacts, ${deleted.conversations} conversations, ${deleted.messages} messages`,
    };
  },
});

/**
 * Verify contact data by phone number.
 * Used for testing n8n webhook lead creation.
 *
 * @param phone - Phone number to look up (normalized format)
 * @returns Contact data or error message
 */
export const verifyContactByPhone = query({
  args: {
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    // Find contact by phone across all workspaces
    const contacts = await ctx.db
      .query("contacts")
      .filter((q) => q.eq(q.field("phone"), args.phone))
      .collect();

    if (contacts.length === 0) {
      return { found: false, message: `No contact found with phone ${args.phone}` };
    }

    const contact = contacts[0];
    const workspace = await ctx.db.get(contact.workspace_id);

    return {
      found: true,
      contact: {
        _id: contact._id,
        workspace_id: contact.workspace_id,
        workspace_name: workspace?.name || "Unknown",
        name: contact.name,
        phone: contact.phone,
        phone_normalized: contact.phone_normalized,
        email: contact.email,
        lead_score: contact.lead_score,
        lead_status: contact.lead_status,
        tags: contact.tags,
        source: contact.source,
        metadata: contact.metadata,
        created_at: contact.created_at,
        updated_at: contact.updated_at,
      },
    };
  },
});

// ============================================
// KAPSO HISTORICAL DATA SYNC
// ============================================

/**
 * Normalize phone number (remove all non-digit characters)
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Sync a single Kapso conversation with its messages to Convex.
 * Called by the sync-kapso-mcp.js script.
 *
 * This mutation:
 * 1. Creates/updates the contact with kapso_name
 * 2. Creates the conversation if it doesn't exist
 * 3. Inserts messages (deduplicates by kapso_message_id)
 * 4. Updates conversation metadata (last_message_at, unread_count)
 *
 * @param workspace_id - The workspace ID
 * @param conversation - Kapso conversation object
 * @param messages - Array of Kapso message objects
 */
export const syncKapsoConversation = mutation({
  args: {
    workspace_id: v.id("workspaces"),
    conversation: v.any(),
    messages: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const { workspace_id, conversation, messages } = args;
    const now = Date.now();

    // Extract phone number from conversation
    const phone = normalizePhone(conversation.phone_number || conversation.from || "");
    if (!phone) {
      return { success: false, error: "No phone number in conversation" };
    }

    // Extract contact name from Kapso data
    const contactName = conversation.kapso?.contact_name || conversation.name || undefined;

    // Step 1: Create/update contact
    let contact = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", workspace_id).eq("phone", phone)
      )
      .first();

    let contactCreated = false;

    if (contact) {
      // Update existing contact with kapso_name if available
      const updates: any = {
        updated_at: now,
        phone_normalized: phone,
        cache_updated_at: now,
      };

      if (contactName && contactName !== contact.kapso_name) {
        updates.kapso_name = contactName;
        if (!contact.name) {
          updates.name = contactName;
        }
      }

      await ctx.db.patch(contact._id, updates);
    } else {
      // Create new contact
      const contactId = await ctx.db.insert("contacts", {
        workspace_id,
        phone,
        phone_normalized: phone,
        name: contactName,
        kapso_name: contactName,
        lead_score: 0,
        lead_status: "new",
        tags: [],
        source: "whatsapp",
        metadata: {},
        cache_updated_at: now,
        created_at: now,
        updated_at: now,
        supabaseId: "",
      });
      contact = await ctx.db.get(contactId);
      contactCreated = true;
    }

    if (!contact) {
      return { success: false, error: "Failed to create/update contact" };
    }

    // Step 2: Create/get conversation
    let conv = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contact_id", contact._id))
      .first();

    let conversationCreated = false;

    if (!conv) {
      const convId = await ctx.db.insert("conversations", {
        workspace_id,
        contact_id: contact._id,
        status: "open",
        unread_count: 0,
        created_at: now,
        updated_at: now,
        supabaseId: "",
      });
      conv = await ctx.db.get(convId);
      conversationCreated = true;
    }

    if (!conv) {
      return { success: false, error: "Failed to create conversation" };
    }

    // Step 3: Import messages (deduplicate by kapso_message_id)
    const existingMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversation_id", conv._id)
      )
      .collect();

    const existingIds = new Set(
      existingMessages
        .filter((m) => m.kapso_message_id)
        .map((m) => m.kapso_message_id)
    );

    const newMessages = messages.filter(
      (msg) => msg.id && !existingIds.has(msg.id)
    );

    let messagesImported = 0;
    let lastMessageAt = conv.last_message_at || now;
    let lastMessagePreview = conv.last_message_preview || "";

    for (const msg of newMessages) {
      // Determine message direction
      const direction = msg.from === phone ? "inbound" : "outbound";
      const senderType = direction === "inbound" ? "contact" : "bot";

      // Extract content based on message type
      let content: string | undefined;
      let mediaUrl: string | undefined;
      const messageType = msg.type || "text";

      switch (messageType) {
        case "text":
          content = msg.text?.body;
          break;
        case "image":
          mediaUrl = msg.image?.url || msg.image?.id;
          content = msg.image?.caption || null;
          break;
        case "audio":
          mediaUrl = msg.audio?.url || msg.audio?.id;
          content = "[Audio message]";
          break;
        case "video":
          mediaUrl = msg.video?.url || msg.video?.id;
          content = msg.video?.caption || "[Video]";
          break;
        case "document":
          mediaUrl = msg.document?.url || msg.document?.id;
          content = msg.document?.caption || `[Document: ${msg.document?.filename || "file"}]`;
          break;
        default:
          content = `[${messageType}]`;
      }

      // Parse timestamp (Kapso sends Unix timestamp in seconds)
      const messageTimestamp = msg.timestamp
        ? parseInt(msg.timestamp) * 1000
        : now;

      // Build metadata for reply context
      const metadata: any = {};
      if (msg.context) {
        metadata.reply_to_kapso_id = msg.context.id;
        metadata.reply_to_from = msg.context.from;
      }

      // Insert message
      await ctx.db.insert("messages", {
        conversation_id: conv._id,
        workspace_id,
        direction,
        sender_type: senderType,
        sender_id: msg.from || phone,
        content,
        message_type: messageType,
        media_url: mediaUrl,
        kapso_message_id: msg.id,
        metadata,
        created_at: messageTimestamp,
        supabaseId: "",
      });

      messagesImported++;

      // Track latest message for conversation update
      if (messageTimestamp > lastMessageAt) {
        lastMessageAt = messageTimestamp;
        lastMessagePreview = content?.substring(0, 200) || "[media]";
      }
    }

    // Step 4: Update conversation metadata
    if (messagesImported > 0) {
      await ctx.db.patch(conv._id, {
        last_message_at: lastMessageAt,
        last_message_preview: lastMessagePreview,
        updated_at: now,
      });
    }

    return {
      success: true,
      contactCreated,
      conversationCreated,
      messagesImported,
      contactName,
      phone,
    };
  },
});
