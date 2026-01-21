import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ============================================
  // WORKSPACES (Tenants)
  // ============================================
  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    owner_id: v.string(), // Supabase user UUID
    kapso_phone_id: v.optional(v.string()), // The phone_number_id from Kapso
    settings: v.optional(v.any()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_kapso_phone", ["kapso_phone_id"]),

  // ============================================
  // WORKSPACE MEMBERS
  // ============================================
  workspaceMembers: defineTable({
    workspace_id: v.id("workspaces"),
    user_id: v.string(), // Supabase user UUID
    role: v.string(), // 'owner', 'admin', 'member'
    settings: v.optional(v.any()), // User preferences: { filterPresets, ... }
    created_at: v.number(),
  })
    .index("by_user_workspace", ["user_id", "workspace_id"])
    .index("by_workspace", ["workspace_id"]),

  // ============================================
  // CONTACTS (Leads)
  // ============================================
  contacts: defineTable({
    workspace_id: v.id("workspaces"),
    phone: v.string(),
    phone_normalized: v.optional(v.string()), // For normalized phone matching (e.g., +6281234567890)
    name: v.optional(v.string()),
    kapso_name: v.optional(v.string()), // Name from WhatsApp profile (Kapso)
    email: v.optional(v.string()),
    lead_score: v.number(), // 0-100 ARI lead score
    lead_status: v.string(), // 'new', 'hot', 'warm', 'cold', 'converted', 'lost'
    tags: v.optional(v.array(v.string())),
    assigned_to: v.optional(v.string()), // Supabase user UUID of assigned member
    source: v.optional(v.string()), // Lead source: 'webinar', 'referral', 'website', 'whatsapp', etc.
    metadata: v.optional(v.any()), // Additional flexible data (ARI scores, engagement metrics)
    cache_updated_at: v.optional(v.number()), // Timestamp of last cache refresh
    created_at: v.number(),
    updated_at: v.number(),
    supabaseId: v.string(), // For migration reference
  })
    .index("by_workspace_phone", ["workspace_id", "phone"])
    .index("by_workspace", ["workspace_id"])
    .index("by_assigned", ["workspace_id", "assigned_to"]),

  // ============================================
  // CONVERSATIONS
  // ============================================
  conversations: defineTable({
    workspace_id: v.id("workspaces"),
    contact_id: v.id("contacts"),
    status: v.string(), // 'open', 'closed', 'snoozed'
    assigned_to: v.optional(v.string()), // Supabase user UUID
    unread_count: v.number(),
    last_message_at: v.optional(v.number()),
    last_message_preview: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
    supabaseId: v.string(),
  })
    .index("by_workspace_time", ["workspace_id", "last_message_at"])
    .index("by_contact", ["contact_id"])
    .index("by_workspace", ["workspace_id"]),

  // ============================================
  // MESSAGES
  // ============================================
  messages: defineTable({
    conversation_id: v.id("conversations"),
    workspace_id: v.id("workspaces"),
    direction: v.string(), // 'inbound', 'outbound'
    sender_type: v.string(), // 'contact', 'user', 'bot'
    sender_id: v.optional(v.string()), // user_id if sent by user
    content: v.optional(v.string()),
    message_type: v.string(), // 'text', 'image', 'document', 'audio', 'video', 'interactive'
    media_url: v.optional(v.string()),
    kapso_message_id: v.optional(v.string()),
    metadata: v.optional(v.any()), // Stores reply context: { reply_to_kapso_id, reply_to_from, ... }
    created_at: v.number(),
    supabaseId: v.string(),
  })
    .index("by_conversation_time", ["conversation_id", "created_at"])
    .index("by_workspace", ["workspace_id"]),

  // ============================================
  // CONTACT NOTES
  // ============================================
  contactNotes: defineTable({
    workspace_id: v.id("workspaces"),
    contact_id: v.id("contacts"),
    user_id: v.string(),
    content: v.string(),
    created_at: v.number(),
    supabaseId: v.string(),
  })
    .index("by_contact", ["contact_id"])
    .index("by_workspace", ["workspace_id"]),
});
