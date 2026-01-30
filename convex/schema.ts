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
    last_settings_sync: v.optional(v.number()), // Timestamp of last settings backup
    settings_sync_status: v.optional(v.string()), // 'synced' | 'pending' | 'error'
    settings_sync_error: v.optional(v.string()), // Error message if sync failed
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
    .index("by_workspace", ["workspace_id"])
    .index("by_kapso_message_id", ["kapso_message_id"]),

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
    workspace_id: v.string(), // Using string to match query args type
    enabled: v.optional(v.boolean()), // AI toggle - true by default if not set
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
    workspace_id: v.string(),
    contact_id: v.string(),
    state: v.string(), // 'greeting', 'qualifying', 'scheduling', 'handoff', 'ended'
    lead_score: v.number(),
    lead_temperature: v.optional(v.string()), // 'hot', 'warm', 'cold'
    context: v.optional(v.any()), // Form answers, document status, scheduling state
    ai_model: v.optional(v.string()), // 'sea-lion', 'grok', 'gpt-4'
    next_action: v.optional(v.string()), // Human-readable next step (e.g., "Ask about passport", "Offer routing options")
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
    ari_conversation_id: v.string(),
    workspace_id: v.string(),
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
  // AI USAGE (Cost tracking for Mouth and Brain)
  // ============================================
  aiUsage: defineTable({
    workspace_id: v.id("workspaces"),
    conversation_id: v.optional(v.id("ariConversations")),
    model: v.string(),  // "sea-lion", "grok-3"
    ai_type: v.string(),  // "mouth" or "brain"
    input_tokens: v.number(),
    output_tokens: v.number(),
    cost_usd: v.number(),
    created_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_workspace_type", ["workspace_id", "ai_type"])
    .index("by_conversation", ["conversation_id"]),

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

  // ============================================
  // USERS (Clerk-synced user data)
  // ============================================
  users: defineTable({
    clerk_id: v.string(),           // Primary identifier from Clerk
    workspace_id: v.optional(v.id("workspaces")), // Single workspace (optional for initial sync)
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_clerk_id", ["clerk_id"])
    .index("by_workspace", ["workspace_id"]),

  // ============================================
  // WEBHOOK AUDIT (Debugging webhook events)
  // ============================================
  webhookAudit: defineTable({
    event_type: v.string(),         // 'user.created', 'user.updated', 'user.deleted', 'organization.*'
    clerk_id: v.optional(v.string()),
    payload: v.any(),               // Raw webhook payload (for debugging)
    status: v.string(),             // 'success', 'error'
    error_message: v.optional(v.string()),
    processed_at: v.number(),
  })
    .index("by_event_type", ["event_type"])
    .index("by_clerk_id", ["clerk_id"])
    .index("by_processed_at", ["processed_at"]),

  // ============================================
  // ORGANIZATIONS (Clerk-synced organizations)
  // ============================================
  organizations: defineTable({
    clerk_org_id: v.string(),          // Clerk organization ID
    workspace_id: v.optional(v.id("workspaces")),   // Link to existing workspace (from migration)
    name: v.string(),
    slug: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_clerk_org_id", ["clerk_org_id"])
    .index("by_workspace", ["workspace_id"]),

  // ============================================
  // ORGANIZATION MEMBERS (Clerk-synced membership)
  // ============================================
  organizationMembers: defineTable({
    organization_id: v.id("organizations"),
    clerk_user_id: v.string(),          // Clerk user ID
    role: v.string(),                   // 'org:admin', 'org:member' (Clerk roles)
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_org_user", ["organization_id", "clerk_user_id"])
    .index("by_user", ["clerk_user_id"]),

  // ============================================
  // ARI DESTINATIONS (University knowledge base)
  // ============================================
  ariDestinations: defineTable({
    workspace_id: v.string(),
    country: v.string(),
    city: v.optional(v.string()),
    university_name: v.string(),
    requirements: v.optional(v.any()), // JSONB: { ielts_min, gpa_min, budget_min, budget_max, deadline }
    programs: v.optional(v.array(v.string())),
    is_promoted: v.boolean(),
    priority: v.number(),
    notes: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_workspace_country", ["workspace_id", "country"]),

  // ============================================
  // ARI PAYMENTS (Payment records)
  // ============================================
  ariPayments: defineTable({
    ari_conversation_id: v.id("ariConversations"),
    workspace_id: v.id("workspaces"),
    amount: v.number(),
    currency: v.string(), // Default: 'IDR'
    payment_method: v.optional(v.string()),
    gateway: v.string(), // Default: 'midtrans'
    gateway_transaction_id: v.optional(v.string()),
    gateway_response: v.optional(v.any()),
    status: v.string(), // 'pending', 'success', 'failed', 'expired', 'refunded'
    expires_at: v.optional(v.number()),
    paid_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_conversation", ["ari_conversation_id"])
    .index("by_status", ["workspace_id", "status"]),

  // ============================================
  // ARI APPOINTMENTS (Consultation scheduling)
  // ============================================
  ariAppointments: defineTable({
    ari_conversation_id: v.string(),
    workspace_id: v.string(),
    payment_id: v.optional(v.string()),
    consultant_id: v.optional(v.string()), // Clerk user ID
    scheduled_at: v.number(),
    duration_minutes: v.number(), // Default: 60
    meeting_link: v.optional(v.string()),
    status: v.string(), // 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'
    reminder_sent_at: v.optional(v.number()),
    notes: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_conversation", ["ari_conversation_id"])
    .index("by_consultant", ["workspace_id", "consultant_id"]),

  // ============================================
  // ARI AI COMPARISON (A/B testing metrics)
  // ============================================
  ariAiComparison: defineTable({
    workspace_id: v.id("workspaces"),
    ai_model: v.string(),
    conversation_count: v.number(),
    avg_response_time_ms: v.optional(v.number()),
    total_tokens_used: v.number(),
    conversion_count: v.number(),
    satisfaction_score: v.optional(v.number()),
    period_start: v.optional(v.number()),
    period_end: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace_model", ["workspace_id", "ai_model"]),

  // ============================================
  // ARI FLOW STAGES (Custom conversation stages)
  // ============================================
  ariFlowStages: defineTable({
    workspace_id: v.string(),
    name: v.string(),
    goal: v.string(),
    sample_script: v.optional(v.string()),
    exit_criteria: v.optional(v.string()),
    stage_order: v.number(),
    is_active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_workspace_order", ["workspace_id", "stage_order"]),

  // ============================================
  // ARI FLOW STAGE OUTCOMES (Scoring outcomes per stage)
  // ============================================
  ariFlowStageOutcomes: defineTable({
    stage_id: v.string(),
    workspace_id: v.string(),
    description: v.string(),
    points: v.number(),
    keywords: v.optional(v.string()),
    outcome_order: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_stage", ["stage_id"])
    .index("by_stage_order", ["stage_id", "outcome_order"]),

  // ============================================
  // ARI KNOWLEDGE CATEGORIES (Knowledge base categories)
  // ============================================
  ariKnowledgeCategories: defineTable({
    workspace_id: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    display_order: v.number(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_workspace_order", ["workspace_id", "display_order"]),

  // ============================================
  // ARI KNOWLEDGE ENTRIES (Knowledge base entries)
  // ============================================
  ariKnowledgeEntries: defineTable({
    workspace_id: v.string(),
    category_id: v.optional(v.string()),
    title: v.string(),
    content: v.string(),
    is_active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_category", ["category_id"]),

  // ============================================
  // ARI SCORING CONFIG (Scoring thresholds)
  // ============================================
  ariScoringConfig: defineTable({
    workspace_id: v.string(),
    hot_threshold: v.number(), // Default: 70
    warm_threshold: v.number(), // Default: 40
    weight_basic: v.number(), // Default: 25
    weight_qualification: v.number(), // Default: 35
    weight_document: v.number(), // Default: 30
    weight_engagement: v.number(), // Default: 10
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"]),

  // ============================================
  // CONSULTANT SLOTS (Booking availability)
  // ============================================
  consultantSlots: defineTable({
    workspace_id: v.string(),
    consultant_id: v.optional(v.string()), // Clerk user ID
    day_of_week: v.number(), // 0-6 (Sunday-Saturday)
    start_time: v.string(), // HH:MM format
    end_time: v.string(), // HH:MM format
    duration_minutes: v.number(), // Default: 60
    booking_window_days: v.number(), // Default: 14
    max_bookings_per_slot: v.number(), // Default: 1
    is_active: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_workspace_day", ["workspace_id", "day_of_week"]),

  // ============================================
  // ARTICLES (CMS articles)
  // ============================================
  articles: defineTable({
    workspace_id: v.id("workspaces"),
    title: v.string(),
    slug: v.string(),
    excerpt: v.optional(v.string()),
    content: v.optional(v.string()),
    cover_image_url: v.optional(v.string()),
    status: v.string(), // 'draft', 'published'
    published_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
    supabaseId: v.optional(v.string()), // For migration reference
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_workspace_slug", ["workspace_id", "slug"])
    .index("by_status", ["workspace_id", "status"]),

  // ============================================
  // WEBINARS (CMS webinars)
  // ============================================
  webinars: defineTable({
    workspace_id: v.id("workspaces"),
    title: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    cover_image_url: v.optional(v.string()),
    scheduled_at: v.number(),
    duration_minutes: v.number(), // Default: 60
    meeting_url: v.optional(v.string()),
    max_registrations: v.optional(v.number()),
    status: v.string(), // 'draft', 'published', 'completed', 'cancelled'
    published_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
    supabaseId: v.optional(v.string()), // For migration reference
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_workspace_slug", ["workspace_id", "slug"])
    .index("by_status", ["workspace_id", "status"])
    .index("by_scheduled", ["workspace_id", "scheduled_at"]),

  // ============================================
  // WEBINAR REGISTRATIONS (Registration records)
  // ============================================
  webinarRegistrations: defineTable({
    webinar_id: v.id("webinars"),
    contact_id: v.id("contacts"),
    workspace_id: v.id("workspaces"),
    registered_at: v.number(),
    attended: v.boolean(),
  })
    .index("by_webinar", ["webinar_id"])
    .index("by_contact", ["contact_id"])
    .index("by_workspace", ["workspace_id"]),

  // ============================================
  // WORKFLOW CONFIG (Rules engine configuration per workspace)
  // ============================================
  workflow_configs: defineTable({
    workspace_id: v.id("workspaces"),
    keyword_triggers: v.array(
      v.object({
        id: v.string(),
        keywords: v.array(v.string()),
        action: v.union(
          v.literal("handoff"),
          v.literal("manager_bot"),
          v.literal("faq_response"),
          v.literal("pass_through")
        ),
        response_template: v.optional(v.string()),
        case_sensitive: v.boolean(),
        match_mode: v.union(
          v.literal("exact"),
          v.literal("contains"),
          v.literal("starts_with")
        ),
        enabled: v.boolean(),
      })
    ),
    faq_templates: v.array(
      v.object({
        id: v.string(),
        trigger_keywords: v.array(v.string()),
        response: v.string(),
        enabled: v.boolean(),
      })
    ),
    lead_routing: v.object({
      new_lead_greeting: v.string(),
      returning_lead_greeting: v.string(),
      detection_window_hours: v.number(),
    }),
    ai_fallback_enabled: v.boolean(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"]),

  // ============================================
  // WORKFLOW EXECUTIONS (Execution logs for analytics and debugging)
  // ============================================
  workflow_executions: defineTable({
    workspace_id: v.id("workspaces"),
    contact_id: v.id("contacts"),
    conversation_id: v.optional(v.id("conversations")),
    message_content: v.string(),
    rule_matched: v.optional(v.string()),
    action_taken: v.union(
      v.literal("handoff"),
      v.literal("manager_bot"),
      v.literal("faq_response"),
      v.literal("pass_through"),
      v.literal("ai_fallback")
    ),
    lead_type: v.union(v.literal("new"), v.literal("returning")),
    response_sent: v.optional(v.string()),
    processing_time_ms: v.number(),
    created_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_contact", ["contact_id"])
    .index("by_created", ["created_at"]),

  // ============================================
  // QUICK REPLIES (Message templates)
  // ============================================
  quickReplies: defineTable({
    workspace_id: v.string(),
    shortcut: v.string(),      // e.g., "/greeting"
    message: v.string(),        // e.g., "Hello! How can I help?"
    created_by: v.string(),     // Clerk user ID
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_shortcut", ["workspace_id", "shortcut"]),

  // ============================================
  // BOT CONFIG (Intern and Brain bot names per workspace)
  // ============================================
  botConfig: defineTable({
    workspace_id: v.id("workspaces"),
    intern_name: v.string(),      // Default: "Sarah"
    brain_name: v.string(),       // Default: "Grok"
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_workspace", ["workspace_id"]),

  // ============================================
  // SARAH CONVERSATIONS (Sarah bot state per contact)
  // ============================================
  sarahConversations: defineTable({
    contact_phone: v.string(), // Primary identifier (normalized phone number)
    workspace_id: v.optional(v.string()), // Optional since phone is primary

    // State machine
    state: v.string(), // 'greeting' | 'qualifying' | 'scoring' | 'handoff' | 'completed'

    // Scoring
    lead_score: v.number(), // 0-100
    lead_temperature: v.string(), // 'hot' | 'warm' | 'cold'

    // Extracted data (4-slot extraction for SME qualification)
    extracted_data: v.object({
      name: v.optional(v.string()),
      business_type: v.optional(v.string()),
      team_size: v.optional(v.number()),
      pain_points: v.optional(v.array(v.string())),
      goals: v.optional(v.string()),
    }),

    // Metadata
    language: v.string(), // 'id' | 'en'
    message_count: v.number(),

    // Timestamps
    created_at: v.number(),
    updated_at: v.number(),
    last_message_at: v.number(),
  })
    .index("by_phone", ["contact_phone"])
    .index("by_temperature", ["lead_temperature"])
    .index("by_score", ["lead_score"]),

  // ============================================
  // SETTINGS BACKUP (Configuration snapshots)
  // ============================================
  settingsBackup: defineTable({
    workspace_id: v.id("workspaces"),
    backup_type: v.string(), // 'intern_config', 'brain_config', 'bot_names', 'full'
    config_data: v.any(), // JSON of configuration
    source: v.string(), // 'user_save', 'auto_backup', 'import'
    created_at: v.number(),
    created_by: v.optional(v.string()), // Clerk user ID
  })
    .index("by_workspace", ["workspace_id"])
    .index("by_workspace_type", ["workspace_id", "backup_type"]),
});
