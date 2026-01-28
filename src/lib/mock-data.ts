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
        'Aktivitas': 'working',
        'Negara Tujuan': 'Australia',
        'Budget': '300-500jt',
        'Target Berangkat': '6months',
        'Level Bahasa Inggris': 'intermediate',
        'Goals': 'Master degree in Computer Science',
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
    lead_score: 45,
    lead_status: 'warm',
    tags: ['Parent', 'Follow Up'],
    assigned_to: null,
    metadata: {
      source: 'WhatsApp',
      form_answers: {
        'Pendidikan': 'SMA',
        'Jurusan': 'Bisnis / Manajemen',
        'Aktivitas': 'student',
        'Negara Tujuan': 'Malaysia',
        'Budget': '100-300jt',
        'Target Berangkat': '1year',
        'Level Bahasa Inggris': 'beginner',
        'Goals': 'Bachelor degree in Business Management',
      },
    },
    created_at: '2026-01-18T09:00:00Z',
    updated_at: '2026-01-22T11:00:00Z',
    cache_updated_at: null,
    kapso_is_online: null,
    kapso_last_seen: null,
    kapso_profile_pic: null,
  },
  {
    id: 'contact-003',
    workspace_id: 'dev-workspace-001',
    phone: '+6283456789012',
    phone_normalized: '+6283456789012',
    name: 'Ahmad Rizky',
    kapso_name: 'Ahmad Rizky',
    email: 'ahmad.rizky@outlook.com',
    lead_score: 95,
    lead_status: 'hot',
    tags: ['Hot Lead', 'Student'],
    assigned_to: 'dev-user-001',
    metadata: {
      source: 'Google Form',
      form_answers: {
        'Pendidikan': 'S1 (Sarjana)',
        'Jurusan': 'Engineering',
        'Aktivitas': 'fresh_grad',
        'Negara Tujuan': 'UK',
        'Budget': '500jt-1m',
        'Target Berangkat': '3months',
        'Level Bahasa Inggris': 'has_score',
        'Goals': 'PhD in Mechanical Engineering',
        'Catatan': 'IELTS 7.5, ready to start ASAP',
      },
    },
    created_at: '2026-01-20T08:00:00Z',
    updated_at: '2026-01-23T16:00:00Z',
    cache_updated_at: null,
    kapso_is_online: null,
    kapso_last_seen: null,
    kapso_profile_pic: null,
  },
  {
    id: 'contact-004',
    workspace_id: 'dev-workspace-001',
    phone: '+6284567890123',
    phone_normalized: '+6284567890123',
    name: 'Dewi Lestari',
    kapso_name: 'Dewi Lestari',
    email: null,
    lead_score: 30,
    lead_status: 'cold',
    tags: ['Follow Up'],
    assigned_to: null,
    metadata: {
      source: 'WhatsApp',
      form_answers: {
        'Pendidikan': 'SMA',
        'Jurusan': 'Design',
        'Aktivitas': 'other',
        'Negara Tujuan': 'undecided',
        'Budget': '<100jt',
        'Target Berangkat': 'flexible',
        'Level Bahasa Inggris': 'beginner',
        'Goals': 'Study graphic design',
      },
    },
    created_at: '2026-01-21T14:00:00Z',
    updated_at: '2026-01-21T14:00:00Z',
    cache_updated_at: null,
    kapso_is_online: null,
    kapso_last_seen: null,
    kapso_profile_pic: null,
  },
  {
    id: 'contact-005',
    workspace_id: 'dev-workspace-001',
    phone: '+6285678901234',
    phone_normalized: '+6285678901234',
    name: 'Rina Wijaya',
    kapso_name: 'Rina Wijaya',
    email: 'rina.w@gmail.com',
    lead_score: 70,
    lead_status: 'warm',
    tags: ['Student'],
    assigned_to: null,
    metadata: {
      source: 'Website',
      form_answers: {
        'Pendidikan': 'S1 (Sarjana)',
        'Jurusan': 'Medicine',
        'Aktivitas': 'working',
        'Negara Tujuan': 'Canada',
        'Budget': '300-500jt',
        'Target Berangkat': '1year',
        'Level Bahasa Inggris': 'advanced',
        'Goals': 'Specialist training in Cardiology',
      },
    },
    created_at: '2026-01-22T10:00:00Z',
    updated_at: '2026-01-24T09:00:00Z',
    cache_updated_at: null,
    kapso_is_online: null,
    kapso_last_seen: null,
    kapso_profile_pic: null,
  },
]

export const isDevMode = () => process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Mock conversations - synced with MOCK_CONTACTS
// status: 'open' = AI active, 'handover' = Manual mode, 'closed' = Archived
export const MOCK_CONVERSATIONS_RAW: Conversation[] = [
  {
    id: 'conv-001',
    workspace_id: 'dev-workspace-001',
    contact_id: 'contact-001', // Budi Santoso
    status: 'open', // AI active (ARI Active)
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
    status: 'handover', // Manual mode (Human handling)
    assigned_to: null,
    unread_count: 1,
    last_message_at: '2026-01-22T11:00:00Z',
    last_message_preview: 'Apakah ada beasiswa untuk anak saya?',
    created_at: '2026-01-18T09:00:00Z',
    updated_at: '2026-01-22T11:00:00Z',
  },
  {
    id: 'conv-003',
    workspace_id: 'dev-workspace-001',
    contact_id: 'contact-003', // Ahmad Rizky
    status: 'open', // AI active (ARI Active)
    assigned_to: 'dev-user-001',
    unread_count: 0,
    last_message_at: '2026-01-23T16:00:00Z',
    last_message_preview: 'Saya sudah siap submit aplikasi bulan depan.',
    created_at: '2026-01-20T08:00:00Z',
    updated_at: '2026-01-23T16:00:00Z',
  },
  {
    id: 'conv-004',
    workspace_id: 'dev-workspace-001',
    contact_id: 'contact-004', // Dewi Lestari
    status: 'handover', // Manual mode
    assigned_to: null,
    unread_count: 3,
    last_message_at: '2026-01-21T14:00:00Z',
    last_message_preview: 'Masih bingung mau pilih negara mana...',
    created_at: '2026-01-21T14:00:00Z',
    updated_at: '2026-01-21T14:00:00Z',
  },
  {
    id: 'conv-005',
    workspace_id: 'dev-workspace-001',
    contact_id: 'contact-005', // Rina Wijaya
    status: 'open', // AI active
    assigned_to: null,
    unread_count: 1,
    last_message_at: '2026-01-24T09:00:00Z',
    last_message_preview: 'Bagaimana cara apply untuk program spesialis?',
    created_at: '2026-01-22T10:00:00Z',
    updated_at: '2026-01-24T09:00:00Z',
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

// Helper to get messages for a specific conversation
export const getMockMessagesForConversation = (conversationId: string): Message[] => {
  return MOCK_MESSAGES.filter(message => message.conversation_id === conversationId)
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

// =============================================================================
// MOCK ARI CONVERSATIONS
// Shows complete flow progression for demo mode testing
// =============================================================================

export interface MockARIMessage {
  role: 'assistant' | 'user' | 'system'
  content: string
  timestamp: number
}

export interface MockARIConversation {
  id: string
  contact_id: string
  contact_name: string
  state: 'greeting' | 'qualifying' | 'scoring' | 'routing' | 'scheduling' | 'booking'
  lead_score: number
  lead_temperature: 'cold' | 'warm' | 'hot'
  next_action: string
  messages: MockARIMessage[]
  created_at: number
  updated_at: number
}

export const MOCK_ARI_CONVERSATIONS: MockARIConversation[] = [
  {
    id: 'mock-ari-001',
    contact_id: 'contact-001',
    contact_name: 'Budi Santoso',
    state: 'qualifying',
    lead_score: 45,
    lead_temperature: 'warm',
    next_action: 'Ask about passport availability and document readiness',
    messages: [
      {
        role: 'assistant',
        content: 'Selamat siang! Saya Ari dari Eagle Overseas Education. Mau kuliah di luar negeri ya? Boleh tau namanya siapa?',
        timestamp: Date.now() - 300000, // 5 minutes ago
      },
      {
        role: 'user',
        content: 'Halo, nama saya Budi',
        timestamp: Date.now() - 280000,
      },
      {
        role: 'assistant',
        content: 'Hai kak Budi! Senang bisa bantu. Negara tujuannya kemana nih?',
        timestamp: Date.now() - 260000,
      },
      {
        role: 'user',
        content: 'Australia kak, saya tertarik jurusan IT',
        timestamp: Date.now() - 240000,
      },
      {
        role: 'assistant',
        content: 'Wah keren! IT di Australia banyak peluangnya. Oh iya kak, paspor nya udah punya belum?',
        timestamp: Date.now() - 220000,
      },
    ],
    created_at: Date.now() - 300000,
    updated_at: Date.now() - 220000,
  },
  {
    id: 'mock-ari-002',
    contact_id: 'contact-002',
    contact_name: 'Siti Rahayu',
    state: 'routing',
    lead_score: 65,
    lead_temperature: 'warm',
    next_action: 'Offer consultation slot for scholarship discussion',
    messages: [
      {
        role: 'assistant',
        content: 'Selamat siang! Saya Ari dari Eagle Overseas Education. Ada yang bisa saya bantu?',
        timestamp: Date.now() - 600000, // 10 minutes ago
      },
      {
        role: 'user',
        content: 'Selamat siang, saya ibu dari anak yang mau kuliah ke luar negeri',
        timestamp: Date.now() - 580000,
      },
      {
        role: 'assistant',
        content: 'Senang bisa membantu, Bu! Anak ibu mau kuliah di negara mana?',
        timestamp: Date.now() - 560000,
      },
      {
        role: 'user',
        content: 'Malaysia, jurusan bisnis. Ada beasiswa gak ya?',
        timestamp: Date.now() - 540000,
      },
      {
        role: 'assistant',
        content: 'Ada bu! Malaysia ada beasiswa untuk jurusan bisnis. Mau konsultasi lebih detail? Saya bisa jadwalkan dengan konsultan kami.',
        timestamp: Date.now() - 520000,
      },
    ],
    created_at: Date.now() - 600000,
    updated_at: Date.now() - 520000,
  },
]

// Helper function to get mock ARI conversation by contact ID
export const getMockAriConversation = (contactId: string): MockARIConversation | undefined => {
  return MOCK_ARI_CONVERSATIONS.find((conv) => conv.contact_id === contactId)
}
