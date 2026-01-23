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
    meta_access_token: v.optional(v.string()), // Encrypted Meta/Kapso API access token
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

  // ============================================
  // ARI CONFIG (AI Response Intelligence)
  // ============================================
  ariConfig: defineTable({
    workspace_id: v.id("workspaces"),
    bot_name: v.string(),
    greeting_style: v.string(), // 'professional', 'friendly', 'casual'
    language: v.string(), // 'id', 'en'
    tone: v.optional(v.any()), // { supportive: boolean, clear: boolean, encouraging: boolean }
    community_link: v.optional(v.string()), // Telegram/WhatsApp community link
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"]),

  // ============================================
  // ARI CONVERSATIONS (AI bot state per contact)
  // ============================================
  ariConversations: defineTable({
    workspace_id: v.id("workspaces"),
    contact_id: v.id("contacts"),
    state: v.string(), // 'greeting', 'qualifying', 'scheduling', 'handoff', 'ended'
    lead_score: v.number(),
    lead_temperature: v.optional(v.string()), // 'hot', 'warm', 'cold'
    context: v.optional(v.any()), // Form answers, document status, scheduling state
    ai_model: v.optional(v.string()), // 'sea-lion', 'grok', 'gpt-4'
    handoff_at: v.optional(v.number()),
    handoff_reason: v.optional(v.string()),
    last_ai_message_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
    supabaseId: v.string(),
  })
    .index("by_workspace_contact", ["workspace_id", "contact_id"])
    .index("by_workspace", ["workspace_id"]),

  // ============================================
  // ARI MESSAGES (AI conversation history)
  // ============================================
  ariMessages: defineTable({
    ari_conversation_id: v.id("ariConversations"),
    workspace_id: v.id("workspaces"),
    role: v.string(), // 'user', 'assistant', 'system'
    content: v.string(),
    ai_model: v.optional(v.string()),
    tokens_used: v.optional(v.number()),
    response_time_ms: v.optional(v.number()),
    metadata: v.optional(v.any()),
    created_at: v.number(),
  })
    .index("by_conversation_time", ["ari_conversation_id", "created_at"])
    .index("by_workspace", ["workspace_id"]),

  // ============================================
  // TICKETS (Support ticketing system)
  // ============================================
  tickets: defineTable({
    workspace_id: v.id("workspaces"),
    requester_id: v.string(), // Supabase user UUID
    assigned_to: v.optional(v.string()), // Supabase user UUID of assigned member
    title: v.string(),
    description: v.string(),
    category: v.string(), // 'bug', 'feature', 'question'
    priority: v.string(), // 'low', 'medium', 'high'
    stage: v.string(), // 'report', 'discuss', 'outcome', 'implementation', 'closed'
    pending_approval: v.optional(v.boolean()), // For stage skip approval flow
    pending_stage: v.optional(v.string()), // The stage awaiting approval
    approval_requested_at: v.optional(v.number()),
    reopen_token: v.optional(v.string()), // Token for anonymous reopen via email
    closed_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
    supabaseId: v.string(),
  })
    .index("by_workspace_stage", ["workspace_id", "stage"])
    .index("by_workspace", ["workspace_id"])
    .index("by_requester", ["requester_id"])
    .index("by_assigned", ["assigned_to"]),

  // ============================================
  // TICKET COMMENTS (Discussion on tickets)
  // ============================================
  ticketComments: defineTable({
    ticket_id: v.id("tickets"),
    author_id: v.string(), // Supabase user UUID
    content: v.string(),
    is_stage_change: v.optional(v.boolean()), // True if comment is auto-generated for stage change
    created_at: v.number(),
  })
    .index("by_ticket_time", ["ticket_id", "created_at"]),

  // ============================================
  // TICKET STATUS HISTORY (Audit trail)
  // ============================================
  ticketStatusHistory: defineTable({
    ticket_id: v.id("tickets"),
    changed_by: v.string(), // Supabase user UUID
    from_stage: v.optional(v.string()),
    to_stage: v.string(),
    reason: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_ticket_time", ["ticket_id", "created_at"]),
});
