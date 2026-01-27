// Mock data for development - bypasses Convex when NEXT_PUBLIC_DEV_MODE=true
// This allows fully OFFLINE local development at localhost:3000/demo

import type { Contact, Workspace, Conversation, Message, ConversationWithContact, Article, Webinar, WorkspaceMember, Profile } from '@/types/database'

export type MockTeamMember = WorkspaceMember & { profile: Profile | null }

// =============================================================================
// CONVEX-COMPATIBLE MOCK WORKSPACE
// Used by server components to avoid Convex calls when offline
// =============================================================================
export type MockConvexWorkspace = {
  _id: string  // Fake Convex ID format
  _creationTime: number
  name: string
  slug: string
  owner_id: string
  kapso_phone_id: string | null
  meta_access_token?: string
  settings: {
    kapso_api_key?: string
    whatsapp_number?: string
    whatsapp_name?: string
    quick_replies?: { id: string; label: string; text: string }[]
    contact_tags?: string[]
    lead_statuses?: {
      key: string
      label: string
      color: string
      enabled: boolean
    }[]
  } | null
  created_at: number
  updated_at: number
}

export const MOCK_CONVEX_WORKSPACE: MockConvexWorkspace = {
  _id: 'demo',  // Must match API route dev mode check: isDevMode() && workspaceId === 'demo'
  _creationTime: Date.now(),
  name: 'Eagle Overseas Education',
  slug: 'demo',
  owner_id: 'dev-user-001',
  kapso_phone_id: '647015955153740',
  settings: {
    kapso_api_key: 'mock-api-key',
    whatsapp_number: '+62 xxx xxxx xxxx',
    whatsapp_name: 'Jonathan Wandiyanto',
    quick_replies: [
      { id: '1', label: 'Greeting', text: 'Halo! Ada yang bisa saya bantu?' },
      { id: '2', label: 'Thanks', text: 'Terima kasih sudah menghubungi kami!' },
    ],
    contact_tags: ['Hot Lead', 'Student', 'Parent', 'Follow Up'],
    lead_statuses: [
      { key: 'new', label: 'New', color: '#808080', enabled: true },
      { key: 'cold', label: 'Cold', color: '#3b82f6', enabled: true },
      { key: 'warm', label: 'Warm', color: '#f59e0b', enabled: true },
      { key: 'hot', label: 'Hot', color: '#ef4444', enabled: true },
      { key: 'client', label: 'Client', color: '#10b981', enabled: true },
      { key: 'lost', label: 'Lost', color: '#6b7280', enabled: false },
    ],
  },
  created_at: Date.now(),
  updated_at: Date.now(),
}

// Helper to check if we should use mock data (dev mode + demo slug)
export const shouldUseMockData = (slug: string) => {
  return isDevMode() && slug === 'demo'
}

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

// Mock contacts - synced with /api/contacts for consistency
export const MOCK_CONTACTS: Contact[] = [
  {
    id: 'contact-001',
    workspace_id: 'dev-workspace-001',
    phone: '+6281234567890',
    phone_normalized: '+6281234567890',
    name: 'Budi Santoso',
    kapso_name: 'Budi Santoso',
    email: 'budi@gmail.com',
    lead_score: 85,
    lead_status: 'hot',
    tags: ['Student', 'Hot Lead'],
    assigned_to: 'dev-user-001',
    metadata: {
      source: 'Website',
      form_answers: {
        'Pendidikan': 'S1 (Sarjana)',
        'Jurusan': 'IT / Computer Science',
        'Negara Tujuan': 'Australia',
        'Budget': '300jt - 500jt per tahun',
        'Target Berangkat': '2026',
      },
    },
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-20T14:30:00Z',
    cache_updated_at: null,
    kapso_is_online: null,
    kapso_last_seen: null,
    kapso_profile_pic: null,
  },
  {
    id: 'contact-002',
    workspace_id: 'dev-workspace-001',
    phone: '+6282345678901',
    phone_normalized: '+6282345678901',
    name: 'Siti Rahayu',
    kapso_name: 'Siti Rahayu',
    email: 'siti.rahayu@yahoo.com',
    lead_score: 60,
    lead_status: 'warm',
    tags: ['Parent', 'Follow Up'],
    assigned_to: null,
    metadata: {
      source: 'WhatsApp',
      form_answers: {
        'Pendidikan': 'SMA',
        'Jurusan': 'Bisnis / Manajemen',
        'Negara Tujuan': 'Malaysia',
        'Budget': '150jt - 200jt per tahun',
        'Target Berangkat': '2027',
      },
    },
    created_at: '2026-01-18T09:00:00Z',
    updated_at: '2026-01-22T11:00:00Z',
    cache_updated_at: null,
    kapso_is_online: null,
    kapso_last_seen: null,
    kapso_profile_pic: null,
  },
]

export const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Mock conversations - synced with MOCK_CONTACTS
export const MOCK_CONVERSATIONS_RAW: Conversation[] = [
  {
    id: 'conv-001',
    workspace_id: 'dev-workspace-001',
    contact_id: 'contact-001', // Budi Santoso
    status: 'open',
    assigned_to: 'dev-user-001',
    unread_count: 2,
    last_message_at: '2026-01-20T14:30:00Z',
    last_message_preview: 'Terima kasih infonya, saya akan pertimbangkan.',
    created_at: '2026-01-15T10:00:00Z',
    updated_at: '2026-01-20T14:30:00Z',
  },
  {
    id: 'conv-002',
    workspace_id: 'dev-workspace-001',
    contact_id: 'contact-002', // Siti Rahayu
    status: 'open',
    assigned_to: null,
    unread_count: 1,
    last_message_at: '2026-01-22T11:00:00Z',
    last_message_preview: 'Apakah ada beasiswa untuk anak saya?',
    created_at: '2026-01-18T09:00:00Z',
    updated_at: '2026-01-22T11:00:00Z',
  },
]

// Join conversations with contacts for complete data
export const MOCK_CONVERSATIONS: ConversationWithContact[] = MOCK_CONVERSATIONS_RAW.map((conv) => ({
  ...conv,
  contact: MOCK_CONTACTS.find((c) => c.id === conv.contact_id)!,
}))

// Mock messages - synced with MOCK_CONVERSATIONS
export const MOCK_MESSAGES: Message[] = [
  // Conversation with Budi Santoso
  {
    id: 'msg-001',
    conversation_id: 'conv-001',
    workspace_id: 'dev-workspace-001',
    direction: 'inbound',
    sender_type: 'contact',
    sender_id: 'contact-001',
    content: 'Halo, saya tertarik untuk kuliah di Australia. Bisa minta info lebih lanjut?',
    message_type: 'text',
    media_url: null,
    kapso_message_id: 'mock-001',
    metadata: { source: 'Website' },
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'msg-002',
    conversation_id: 'conv-001',
    workspace_id: 'dev-workspace-001',
    direction: 'outbound',
    sender_type: 'bot',
    sender_id: 'bot',
    content: 'Halo Budi! Terima kasih sudah menghubungi Eagle Overseas Education. Tentu, kami bisa bantu. Apakah sudah ada jurusan yang diminati?',
    message_type: 'text',
    media_url: null,
    kapso_message_id: 'mock-002',
    metadata: {},
    created_at: '2026-01-15T10:01:00Z',
  },
  {
    id: 'msg-003',
    conversation_id: 'conv-001',
    workspace_id: 'dev-workspace-001',
    direction: 'inbound',
    sender_type: 'contact',
    sender_id: 'contact-001',
    content: 'Saya ingin ambil jurusan IT atau Computer Science. Budget sekitar 300jt per tahun.',
    message_type: 'text',
    media_url: null,
    kapso_message_id: 'mock-003',
    metadata: {},
    created_at: '2026-01-20T14:00:00Z',
  },
  {
    id: 'msg-004',
    conversation_id: 'conv-001',
    workspace_id: 'dev-workspace-001',
    direction: 'inbound',
    sender_type: 'contact',
    sender_id: 'contact-001',
    content: 'Terima kasih infonya, saya akan pertimbangkan.',
    message_type: 'text',
    media_url: null,
    kapso_message_id: 'mock-004',
    metadata: {},
    created_at: '2026-01-20T14:30:00Z',
  },
  // Conversation with Siti Rahayu
  {
    id: 'msg-005',
    conversation_id: 'conv-002',
    workspace_id: 'dev-workspace-001',
    direction: 'inbound',
    sender_type: 'contact',
    sender_id: 'contact-002',
    content: 'Selamat siang, saya ibu dari anak yang mau kuliah ke luar negeri.',
    message_type: 'text',
    media_url: null,
    kapso_message_id: 'mock-005',
    metadata: { source: 'WhatsApp' },
    created_at: '2026-01-18T09:00:00Z',
  },
  {
    id: 'msg-006',
    conversation_id: 'conv-002',
    workspace_id: 'dev-workspace-001',
    direction: 'outbound',
    sender_type: 'bot',
    sender_id: 'bot',
    content: 'Selamat siang, Bu! Senang bisa membantu. Anak Ibu mau kuliah di negara mana?',
    message_type: 'text',
    media_url: null,
    kapso_message_id: 'mock-006',
    metadata: {},
    created_at: '2026-01-18T09:01:00Z',
  },
  {
    id: 'msg-007',
    conversation_id: 'conv-002',
    workspace_id: 'dev-workspace-001',
    direction: 'inbound',
    sender_type: 'contact',
    sender_id: 'contact-002',
    content: 'Apakah ada beasiswa untuk anak saya?',
    message_type: 'text',
    media_url: null,
    kapso_message_id: 'mock-007',
    metadata: {},
    created_at: '2026-01-22T11:00:00Z',
  },
]

// Mock notes for contacts
export interface MockNote {
  id: string
  workspace_id: string
  contact_id: string
  user_id: string
  content: string
  due_date: string | null  // Keep for UI compatibility
  is_completed: boolean  // Keep for UI compatibility
  created_at: string
}

export const MOCK_NOTES: MockNote[] = [
  {
    id: 'note-001',
    workspace_id: 'dev-workspace-001',
    contact_id: 'contact-001',
    user_id: 'dev-user-001',
    content: 'Follow up about Australia visa requirements - he mentioned budget concerns',
    due_date: '2026-01-28T10:00:00Z',
    is_completed: false,
    created_at: '2026-01-20T15:00:00Z',
  },
  {
    id: 'note-002',
    workspace_id: 'dev-workspace-001',
    contact_id: 'contact-001',
    user_id: 'dev-user-001',
    content: 'Sent university brochure via email',
    due_date: null,
    is_completed: true,
    created_at: '2026-01-18T11:00:00Z',
  },
  {
    id: 'note-003',
    workspace_id: 'dev-workspace-001',
    contact_id: 'contact-002',
    user_id: 'dev-user-001',
    content: 'Call back next week to discuss scholarship options for her son',
    due_date: '2026-01-30T09:00:00Z',
    is_completed: false,
    created_at: '2026-01-22T14:00:00Z',
  },
]

// Helper to get notes for a specific contact
export const getNotesForContact = (contactId: string): MockNote[] => {
  return MOCK_NOTES.filter(note => note.contact_id === contactId)
}

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
