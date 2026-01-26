// Mock data for development - bypasses Supabase when NEXT_PUBLIC_DEV_MODE=true

import type { Contact, Workspace, Conversation, Message, ConversationWithContact, Article, Webinar, WorkspaceMember, Profile } from '@/types/database'

export type MockTeamMember = WorkspaceMember & { profile: Profile | null }

// Mock team members for dev mode
export const MOCK_TEAM_MEMBERS: MockTeamMember[] = [
  {
    id: 'member-001',
    workspace_id: 'dev-workspace-001',
    user_id: 'dev-user-001',
    role: 'owner',
    must_change_password: false,
    settings: null,
    created_at: '2024-01-01T00:00:00Z',
    profile: {
      id: 'dev-user-001',
      email: 'jonathan@eagle.edu',
      full_name: 'Jonathan Wandiyanto',
      avatar_url: null,
      is_admin: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'member-002',
    workspace_id: 'dev-workspace-001',
    user_id: 'dev-user-002',
    role: 'admin',
    must_change_password: false,
    settings: null,
    created_at: '2024-01-01T00:00:00Z',
    profile: {
      id: 'dev-user-002',
      email: 'sarah@eagle.edu',
      full_name: 'Sarah Chen',
      avatar_url: null,
      is_admin: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
  {
    id: 'member-003',
    workspace_id: 'dev-workspace-001',
    user_id: 'dev-user-003',
    role: 'member',
    must_change_password: false,
    settings: null,
    created_at: '2024-01-01T00:00:00Z',
    profile: {
      id: 'dev-user-003',
      email: 'budi@eagle.edu',
      full_name: 'Budi Santoso',
      avatar_url: null,
      is_admin: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  },
]

export const MOCK_WORKSPACE: Workspace = {
  id: 'dev-workspace-001',
  name: 'Eagle Overseas Education',
  slug: 'demo',
  owner_id: 'dev-user-001',
  kapso_phone_id: '647015955153740',
  settings: {
    kapso_api_key: process.env.KAPSO_API_KEY || '',
    whatsapp_number: '+62 xxx xxxx xxxx',
    whatsapp_name: 'Jonathan Wandiyanto',
  },
  description: null,
  meta_access_token: null,
  meta_business_account_id: null,
  status: 'active',
  suspended_at: null,
  suspended_by: null,
  suspension_reason: null,
  wa_phone_number: null,
  workspace_type: 'client',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const MOCK_CONTACTS: Contact[] = [
  // Real contacts from Kapso
  {
    id: 'contact-kapso-001',
    workspace_id: 'dev-workspace-001',
    phone: '+6285693542822',
    phone_normalized: '+6285693542822',
    name: 'dap4_ratu_akhmar',
    email: null,
    lead_score: 50,
    lead_status: 'new',
    tags: [],
    assigned_to: 'dev-user-002', // Assigned to Sarah Chen
    metadata: {
      source: 'Facebook CTWA',
      interest: 'Family Immigration',
      kapso_conversation_id: '366a22b7-11d6-4b9f-b721-9ec21a7054f8'
    },
    created_at: '2026-01-14T05:18:00Z',
    updated_at: '2026-01-14T08:15:00Z',
    cache_updated_at: null,
    kapso_is_online: null,
    kapso_last_seen: null,
    kapso_name: null,
    kapso_profile_pic: null,
  },
  {
    id: 'contact-kapso-002',
    workspace_id: 'dev-workspace-001',
    phone: '+62unknown',
    phone_normalized: '+62unknown',
    name: 'A',
    email: null,
    lead_score: 30,
    lead_status: 'new',
    tags: [],
    assigned_to: null,
    metadata: { source: 'Referral Link' },
    created_at: '2026-01-14T08:00:00Z',
    updated_at: '2026-01-14T08:00:00Z',
    cache_updated_at: null,
    kapso_is_online: null,
    kapso_last_seen: null,
    kapso_name: null,
    kapso_profile_pic: null,
  },
]

export const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Real conversations from Kapso
export const MOCK_CONVERSATIONS_RAW: Conversation[] = [
  {
    id: 'conv-kapso-001',
    workspace_id: 'dev-workspace-001',
    contact_id: 'contact-kapso-001', // dap4_ratu_akhmar - student
    status: 'open',
    assigned_to: null,
    unread_count: 4,
    last_message_at: '2026-01-14T08:15:00Z',
    last_message_preview: 'saya apa aja bisa insyaallah',
    created_at: '2026-01-14T05:18:00Z',
    updated_at: '2026-01-14T08:15:00Z',
  },
  {
    id: 'conv-kapso-002',
    workspace_id: 'dev-workspace-001',
    contact_id: 'contact-kapso-002', // A - referral link
    status: 'open',
    assigned_to: null,
    unread_count: 1,
    last_message_at: '2026-01-14T08:00:00Z',
    last_message_preview: 'https://lynk.id/iutami',
    created_at: '2026-01-14T08:00:00Z',
    updated_at: '2026-01-14T08:00:00Z',
  },
]

// Join conversations with contacts for complete data
export const MOCK_CONVERSATIONS: ConversationWithContact[] = MOCK_CONVERSATIONS_RAW.map((conv) => ({
  ...conv,
  contact: MOCK_CONTACTS.find((c) => c.id === conv.contact_id)!,
}))

// Mock messages across conversations
export const MOCK_MESSAGES: Message[] = [
  // Real Conversation - dap4_ratu_akhmar (student from Kapso)
  {
    id: 'msg-kapso-001',
    conversation_id: 'conv-kapso-001',
    workspace_id: 'dev-workspace-001',
    direction: 'inbound',
    sender_type: 'contact',
    sender_id: 'contact-kapso-001',
    content: 'https://lynk.id/iutami?fbclid=IwY2xjawPTzftleHRuA2FlbQlx...',
    message_type: 'text',
    media_url: null,
    kapso_message_id: 'kapso-real-001',
    metadata: { source: 'Facebook CTWA' },
    created_at: '2026-01-14T05:18:00Z',
  },
  {
    id: 'msg-kapso-002',
    conversation_id: 'conv-kapso-001',
    workspace_id: 'dev-workspace-001',
    direction: 'inbound',
    sender_type: 'contact',
    sender_id: 'contact-kapso-001',
    content: 'mohon maaf kalau untuk imigrasi sekeluarga tapi disana bekerja. bisa atau tidak ya',
    message_type: 'text',
    media_url: null,
    kapso_message_id: 'kapso-real-002',
    metadata: {},
    created_at: '2026-01-14T08:13:00Z',
  },
  {
    id: 'msg-kapso-003',
    conversation_id: 'conv-kapso-001',
    workspace_id: 'dev-workspace-001',
    direction: 'inbound',
    sender_type: 'contact',
    sender_id: 'contact-kapso-001',
    content: 'suami saya sebagai supir',
    message_type: 'text',
    media_url: null,
    kapso_message_id: 'kapso-real-003',
    metadata: {},
    created_at: '2026-01-14T08:14:00Z',
  },
  {
    id: 'msg-kapso-004',
    conversation_id: 'conv-kapso-001',
    workspace_id: 'dev-workspace-001',
    direction: 'inbound',
    sender_type: 'contact',
    sender_id: 'contact-kapso-001',
    content: 'saya apa aja bisa insyaallah',
    message_type: 'text',
    media_url: null,
    kapso_message_id: 'kapso-real-004',
    metadata: {},
    created_at: '2026-01-14T08:15:00Z',
  },
  // Real Conversation - A (referral link)
  {
    id: 'msg-kapso-005',
    conversation_id: 'conv-kapso-002',
    workspace_id: 'dev-workspace-001',
    direction: 'inbound',
    sender_type: 'contact',
    sender_id: 'contact-kapso-002',
    content: 'https://lynk.id/iutami',
    message_type: 'text',
    media_url: null,
    kapso_message_id: 'kapso-real-005',
    metadata: {},
    created_at: '2026-01-14T08:00:00Z',
  },
]

// Website Manager mock data
export const mockArticles: Article[] = [
  {
    id: 'article-1',
    workspace_id: 'dev-workspace-001',
    title: 'How to Choose the Right University',
    slug: 'how-to-choose-university',
    excerpt: 'A comprehensive guide to selecting the perfect university for your education abroad journey.',
    content: '# How to Choose the Right University\n\nChoosing where to study is one of the most important decisions...',
    cover_image_url: null,
    status: 'published',
    published_at: '2026-01-10T10:00:00Z',
    created_at: '2026-01-08T10:00:00Z',
    updated_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'article-2',
    workspace_id: 'dev-workspace-001',
    title: 'Visa Application Tips for Indonesian Students',
    slug: 'visa-tips-indonesian',
    excerpt: 'Essential tips to make your student visa application process smooth and successful.',
    content: null,
    cover_image_url: null,
    status: 'draft',
    published_at: null,
    created_at: '2026-01-12T10:00:00Z',
    updated_at: '2026-01-12T10:00:00Z',
  },
]

export const mockWebinars: Webinar[] = [
  {
    id: 'webinar-1',
    workspace_id: 'dev-workspace-001',
    title: 'Study in Australia Info Session',
    slug: 'study-australia-info',
    description: 'Learn about studying in Australia, visa requirements, and scholarship opportunities.',
    cover_image_url: null,
    scheduled_at: '2026-01-25T14:00:00Z',
    duration_minutes: 60,
    meeting_url: 'https://zoom.us/j/example',
    max_registrations: 100,
    status: 'published',
    published_at: '2026-01-14T10:00:00Z',
    created_at: '2026-01-13T10:00:00Z',
    updated_at: '2026-01-14T10:00:00Z',
  },
  {
    id: 'webinar-2',
    workspace_id: 'dev-workspace-001',
    title: 'UK University Application Workshop',
    slug: 'uk-application-workshop',
    description: 'Hands-on workshop for applying to UK universities through UCAS.',
    cover_image_url: null,
    scheduled_at: '2026-02-01T15:00:00Z',
    duration_minutes: 90,
    meeting_url: null,
    max_registrations: 50,
    status: 'draft',
    published_at: null,
    created_at: '2026-01-14T10:00:00Z',
    updated_at: '2026-01-14T10:00:00Z',
  },
]
