/**
 * Convex mutation functions for CRUD operations.
 *
 * These mutations replace Supabase direct table access with type-safe
 * Convex operations. All mutations include workspace authorization via
 * requireWorkspaceMembership().
 *
 * Mutations include:
 * - Contact operations: create, update, delete
 * - Message operations: create inbound/outbound, mark read
 * - Conversation operations: create, update status, assign, mark read
 * - Webhook helpers: upsertContact, upsertConversation (for Kapso integration)
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireWorkspaceMembership } from "./lib/auth";

// ============================================
// CONTACT MUTATIONS
// ============================================

/**
 * Normalize phone number by removing non-digit characters.
 * This ensures consistent phone matching across Kapso and database.
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Create a new contact in the workspace.
 *
 * @param workspace_id - The workspace to create the contact in
 * @param phone - The contact's phone number
 * @param name - Optional contact name
 * @param email - Optional email address
 * @param tags - Optional tags array
 * @param metadata - Optional flexible data (ARI scores, etc.)
 * @param source - Lead source (webinar, referral, website, whatsapp, etc.)
 * @returns The created contact document with its ID
 */
export const createContact = mutation({
  args: {
    workspace_id: v.string(),
    phone: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
    source: v.optional(v.string()),
    supabaseId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireWorkspaceMembership(ctx, args.workspace_id);

    const now = Date.now();
    const phoneNormalized = normalizePhone(args.phone);

    const contactId = await ctx.db.insert("contacts", {
      workspace_id: args.workspace_id as any,
      phone: args.phone,
      phone_normalized: phoneNormalized,
      name: args.name,
      kapso_name: null, // Will be updated when first message arrives
      email: args.email,
      lead_score: 0,
      lead_status: "new",
      tags: args.tags || [],
      assigned_to: null,
      source: args.source || "manual",
      metadata: args.metadata || {},
      cache_updated_at: null,
      created_at: now,
      updated_at: now,
      supabaseId: args.supabaseId || "",
    });

    const contact = await ctx.db.get(contactId);
    return contact;
  },
});

/**
 * Update an existing contact.
 *
 * @param contact_id - The contact to update
 * @param workspace_id - Workspace for authorization
 * @param name - Optional new name
 * @param email - Optional new email
 * @param lead_status - Optional lead status
 * @param lead_score - Optional lead score
 * @param tags - Optional tags array
 * @param assigned_to - Optional assigned user ID
 * @param metadata - Optional metadata updates
 * @param kapso_name - Optional WhatsApp profile name from Kapso
 * @returns The updated contact document
 */
export const updateContact = mutation({
  args: {
    contact_id: v.string(),
    workspace_id: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    lead_status: v.optional(v.string()),
    lead_score: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    assigned_to: v.optional(v.string()),
    metadata: v.optional(v.any()),
    kapso_name: v.optional(v.string()),
    cache_updated_at: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireWorkspaceMembership(ctx, args.workspace_id);

    const contact = await ctx.db.get(args.contact_id as any);
    if (!contact) {
      throw new Error("Contact not found");
    }

    if (contact.workspace_id !== args.workspace_id) {
      throw new Error("Contact not in this workspace");
    }

    const now = Date.now();
    const updates: any = { updated_at: now };

    if (args.name !== undefined) updates.name = args.name;
    if (args.email !== undefined) updates.email = args.email;
    if (args.lead_status !== undefined) updates.lead_status = args.lead_status;
    if (args.lead_score !== undefined) updates.lead_score = args.lead_score;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.assigned_to !== undefined) updates.assigned_to = args.assigned_to;
    if (args.metadata !== undefined) updates.metadata = args.metadata;
    if (args.kapso_name !== undefined) updates.kapso_name = args.kapso_name;
    if (args.cache_updated_at !== undefined) updates.cache_updated_at = args.cache_updated_at;

    await ctx.db.patch(args.contact_id as any, updates);

    const updated = await ctx.db.get(args.contact_id as any);
    return updated;
  },
});

/**
 * Delete a contact from the workspace.
 *
 * This is a hard delete - in Convex we're starting fresh without
 * soft delete complexity that Supabase had.
 *
 * @param contact_id - The contact to delete
 * @param workspace_id - Workspace for authorization
 */
export const deleteContact = mutation({
  args: {
    contact_id: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    const { membership } = await requireWorkspaceMembership(ctx, args.workspace_id);

    const contact = await ctx.db.get(args.contact_id as any);
    if (!contact) {
      throw new Error("Contact not found");
    }

    if (contact.workspace_id !== args.workspace_id) {
      throw new Error("Contact not in this workspace");
    }

    await ctx.db.delete(args.contact_id as any);
  },
});

/**
 * Get or create a contact by phone number.
 *
 * Used by Kapso webhooks for inbound messages. If the contact exists,
 * it updates the kapso_name and cache_updated_at fields. If not,
 * it creates a new contact with status 'new'.
 *
 * @param workspace_id - The workspace
 * @param phone - The phone number
 * @param name - Optional name from WhatsApp profile
 * @returns The contact document (existing or newly created)
 */
export const upsertContact = mutation({
  args: {
    workspace_id: v.string(),
    phone: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    kapso_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // First try to find existing contact by phone
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_workspace_phone", (q) =>
        q.eq("workspace_id", args.workspace_id as any).eq("phone", args.phone)
      )
      .first();

    const now = Date.now();
    const phoneNormalized = normalizePhone(args.phone);

    if (existing) {
      // Update with latest Kapso info
      const updates: any = {
        updated_at: now,
        phone_normalized,
        cache_updated_at: now,
      };

      if (args.kapso_name) updates.kapso_name = args.kapso_name;
      if (args.name && !existing.name) updates.name = args.name;
      if (args.email && !existing.email) updates.email = args.email;

      await ctx.db.patch(existing._id, updates);
      return await ctx.db.get(existing._id);
    }

    // Create new contact
    const contactId = await ctx.db.insert("contacts", {
      workspace_id: args.workspace_id as any,
      phone: args.phone,
      phone_normalized,
      name: args.name,
      kapso_name: args.kapso_name || null,
      email: args.email,
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

    return await ctx.db.get(contactId);
  },
});

// ============================================
// CONVERSATION MUTATIONS
// ============================================

/**
 * Create a new conversation for a contact.
 *
 * @param workspace_id - The workspace
 * @param contact_id - The contact
 * @param status - Initial status (default: 'open')
 * @param assigned_to - Optional assigned user ID
 * @returns The created conversation document
 */
export const createConversation = mutation({
  args: {
    workspace_id: v.string(),
    contact_id: v.string(),
    status: v.optional(v.string()),
    assigned_to: v.optional(v.string()),
    supabaseId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      workspace_id: args.workspace_id as any,
      contact_id: args.contact_id as any,
      status: args.status || "open",
      assigned_to: args.assigned_to || null,
      unread_count: 0,
      last_message_at: null,
      last_message_preview: null,
      created_at: now,
      updated_at: now,
      supabaseId: args.supabaseId || "",
    });

    return await ctx.db.get(conversationId);
  },
});

/**
 * Get or create a conversation for a contact.
 *
 * Used by Kapso webhooks. If conversation exists, returns it.
 * If not, creates a new open conversation.
 *
 * @param workspace_id - The workspace
 * @param contact_id - The contact
 * @returns The conversation document
 */
export const upsertConversation = mutation({
  args: {
    workspace_id: v.string(),
    contact_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_contact", (q) => q.eq("contact_id", args.contact_id as any))
      .first();

    if (existing) {
      return existing;
    }

    // Create new conversation
    const now = Date.now();
    const conversationId = await ctx.db.insert("conversations", {
      workspace_id: args.workspace_id as any,
      contact_id: args.contact_id as any,
      status: "open",
      assigned_to: null,
      unread_count: 0,
      last_message_at: null,
      last_message_preview: null,
      created_at: now,
      updated_at: now,
      supabaseId: "",
    });

    return await ctx.db.get(conversationId);
  },
});

/**
 * Update conversation status.
 *
 * @param conversation_id - The conversation
 * @param workspace_id - Workspace for authorization
 * @param status - New status ('open', 'closed', 'snoozed')
 */
export const updateConversationStatus = mutation({
  args: {
    conversation_id: v.string(),
    workspace_id: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const conversation = await ctx.db.get(args.conversation_id as any);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.workspace_id !== args.workspace_id) {
      throw new Error("Conversation not in this workspace");
    }

    const now = Date.now();
    await ctx.db.patch(args.conversation_id as any, {
      status: args.status,
      updated_at: now,
    });

    return await ctx.db.get(args.conversation_id as any);
  },
});

/**
 * Assign a conversation to a user.
 *
 * @param conversation_id - The conversation
 * @param workspace_id - Workspace for authorization
 * @param assigned_to - User ID to assign (or null to unassign)
 */
export const assignConversation = mutation({
  args: {
    conversation_id: v.string(),
    workspace_id: v.string(),
    assigned_to: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const conversation = await ctx.db.get(args.conversation_id as any);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.workspace_id !== args.workspace_id) {
      throw new Error("Conversation not in this workspace");
    }

    const now = Date.now();
    await ctx.db.patch(args.conversation_id as any, {
      assigned_to: args.assigned_to || null,
      updated_at: now,
    });

    return await ctx.db.get(args.conversation_id as any);
  },
});

/**
 * Mark a conversation as read (clear unread count).
 *
 * @param conversation_id - The conversation
 * @param workspace_id - Workspace for authorization
 */
export const markConversationRead = mutation({
  args: {
    conversation_id: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const conversation = await ctx.db.get(args.conversation_id as any);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.workspace_id !== args.workspace_id) {
      throw new Error("Conversation not in this workspace");
    }

    const now = Date.now();
    await ctx.db.patch(args.conversation_id as any, {
      unread_count: 0,
      updated_at: now,
    });

    return await ctx.db.get(args.conversation_id as any);
  },
});

// ============================================
// MESSAGE MUTATIONS
// ============================================

/**
 * Create an outbound message (sent by user or bot).
 *
 * @param conversation_id - The conversation
 * @param workspace_id - Workspace for authorization
 * @param content - Message content
 * @param sender_type - 'user' or 'bot'
 * @param sender_id - User ID if sent by user
 * @param message_type - Type of message (text, image, etc.)
 * @param media_url - Optional media URL
 * @param kapso_message_id - Optional Kapso message ID
 * @param metadata - Optional metadata
 * @returns The created message document
 */
export const createMessage = mutation({
  args: {
    conversation_id: v.string(),
    workspace_id: v.string(),
    content: v.optional(v.string()),
    sender_type: v.string(),
    sender_id: v.optional(v.string()),
    message_type: v.string(),
    media_url: v.optional(v.string()),
    kapso_message_id: v.optional(v.string()),
    metadata: v.optional(v.any()),
    supabaseId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireWorkspaceMembership(ctx, args.workspace_id);

    const conversation = await ctx.db.get(args.conversation_id as any);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.workspace_id !== args.workspace_id) {
      throw new Error("Conversation not in this workspace");
    }

    const now = Date.now();
    const preview = args.content || (args.message_type !== "text" ? `[${args.message_type}]` : "");

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversation_id: args.conversation_id as any,
      workspace_id: args.workspace_id as any,
      direction: "outbound",
      sender_type: args.sender_type,
      sender_id: args.sender_id || null,
      content: args.content,
      message_type: args.message_type,
      media_url: args.media_url,
      kapso_message_id: args.kapso_message_id,
      metadata: args.metadata || {},
      created_at: now,
      supabaseId: args.supabaseId || "",
    });

    // Update conversation with last message info
    await ctx.db.patch(args.conversation_id as any, {
      last_message_at: now,
      last_message_preview: preview.substring(0, 200),
      updated_at: now,
    });

    return await ctx.db.get(messageId);
  },
});

/**
 * Create an inbound message (from contact via WhatsApp).
 *
 * Used by Kapso webhooks. Increments conversation unread count.
 *
 * @param conversation_id - The conversation
 * @param workspace_id - Workspace for authorization
 * @param phone - Contact's phone number
 * @param message - Message object from Kapso
 * @returns The created message document
 */
export const createInboundMessage = mutation({
  args: {
    conversation_id: v.string(),
    workspace_id: v.string(),
    phone: v.string(),
    message: v.object({
      id: v.optional(v.string()),
      type: v.string(),
      text: v.object({ body: v.string() }),
      image: v.optional(v.object({ link: v.string() })),
      document: v.optional(v.object({ link: v.string() })),
      audio: v.optional(v.object({ link: v.string() })),
      video: v.optional(v.object({ link: v.string() })),
      reply_to_kapso_id: v.optional(v.string()),
      reply_to_from: v.optional(v.string()),
    }),
    kapso_message_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const conversation = await ctx.db.get(args.conversation_id as any);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    if (conversation.workspace_id !== args.workspace_id) {
      throw new Error("Conversation not in this workspace");
    }

    const now = Date.now();
    const msg = args.message;

    // Determine content and media URL based on message type
    let content: string | undefined;
    let mediaUrl: string | undefined;
    let messageType = msg.type;

    if (msg.type === "text" && msg.text?.body) {
      content = msg.text.body;
    } else if (msg.type === "image" && msg.image?.link) {
      mediaUrl = msg.image.link;
    } else if (msg.type === "document" && msg.document?.link) {
      mediaUrl = msg.document.link;
    } else if (msg.type === "audio" && msg.audio?.link) {
      mediaUrl = msg.audio.link;
    } else if (msg.type === "video" && msg.video?.link) {
      mediaUrl = msg.video.link;
    }

    const preview = content || (messageType !== "text" ? `[${messageType}]` : "");

    // Build metadata for reply context
    const metadata: any = {};
    if (msg.reply_to_kapso_id) {
      metadata.reply_to_kapso_id = msg.reply_to_kapso_id;
    }
    if (msg.reply_to_from) {
      metadata.reply_to_from = msg.reply_to_from;
    }

    // Create message
    const messageId = await ctx.db.insert("messages", {
      conversation_id: args.conversation_id as any,
      workspace_id: args.workspace_id as any,
      direction: "inbound",
      sender_type: "contact",
      sender_id: args.phone,
      content,
      message_type: messageType,
      media_url: mediaUrl,
      kapso_message_id: args.kapso_message_id || msg.id,
      metadata,
      created_at: now,
      supabaseId: "",
    });

    // Update conversation
    await ctx.db.patch(args.conversation_id as any, {
      unread_count: conversation.unread_count + 1,
      last_message_at: now,
      last_message_preview: preview.substring(0, 200),
      updated_at: now,
    });

    return await ctx.db.get(messageId);
  },
});

/**
 * Mark a specific message as read (if needed for message-level read status).
 *
 * Currently, read tracking is done at the conversation level (unread_count).
 * This function is reserved for future message-level read receipts.
 */
export const markMessageRead = mutation({
  args: {
    message_id: v.string(),
    workspace_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const message = await ctx.db.get(args.message_id as any);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.workspace_id !== args.workspace_id) {
      throw new Error("Message not in this workspace");
    }

    // Message-level read tracking can be added here in the future
    // Currently, we track reads at conversation level
    return message;
  },
});

// ============================================
// CONTACT NOTE MUTATIONS
// ============================================

/**
 * Create a contact note.
 *
 * @param workspace_id - The workspace
 * @param contact_id - The contact
 * @param user_id - The user creating the note
 * @param content - Note content
 * @returns The created note document
 */
export const createContactNote = mutation({
  args: {
    workspace_id: v.string(),
    contact_id: v.string(),
    user_id: v.string(),
    content: v.string(),
    supabaseId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireWorkspaceMembership(ctx, args.workspace_id);

    const contact = await ctx.db.get(args.contact_id as any);
    if (!contact) {
      throw new Error("Contact not found");
    }

    if (contact.workspace_id !== args.workspace_id) {
      throw new Error("Contact not in this workspace");
    }

    const now = Date.now();
    const noteId = await ctx.db.insert("contactNotes", {
      workspace_id: args.workspace_id as any,
      contact_id: args.contact_id as any,
      user_id: args.user_id,
      content: args.content,
      created_at: now,
      supabaseId: args.supabaseId || "",
    });

    return await ctx.db.get(noteId);
  },
});

/**
 * Delete a contact note.
 *
 * @param workspace_id - The workspace
 * @param note_id - The note to delete
 */
export const deleteContactNote = mutation({
  args: {
    workspace_id: v.string(),
    note_id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMembership(ctx, args.workspace_id);

    const note = await ctx.db.get(args.note_id as any);
    if (!note) {
      throw new Error("Note not found");
    }

    if (note.workspace_id !== args.workspace_id) {
      throw new Error("Note not in this workspace");
    }

    await ctx.db.delete(args.note_id as any);
  },
});
