// Mock WhatsApp data for dev mode testing

export function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

export const MOCK_WHATSAPP_CONVERSATIONS = [
  {
    id: 'conv-1',
    phoneNumber: '+62 812-3456-7890',
    contactName: 'Budi Santoso',
    status: 'active',
    lastActiveAt: new Date().toISOString(),
    messagesCount: 5,
    lastMessage: {
      content: 'Terima kasih untuk infonya!',
      direction: 'inbound' as const,
      type: 'text',
    },
  },
  {
    id: 'conv-2',
    phoneNumber: '+62 813-9876-5432',
    contactName: 'Siti Rahma',
    status: 'active',
    lastActiveAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    messagesCount: 12,
    lastMessage: {
      content: 'Kapan bisa mulai?',
      direction: 'inbound' as const,
      type: 'text',
    },
  },
  {
    id: 'conv-3',
    phoneNumber: '+62 821-1111-2222',
    contactName: undefined,
    status: 'active',
    lastActiveAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    messagesCount: 3,
    lastMessage: {
      content: 'Halo, saya tertarik dengan layanan Anda',
      direction: 'inbound' as const,
      type: 'text',
    },
  },
]

export function getMockMessages(conversationId: string): Array<{
  id: string
  conversationId: string
  direction: 'inbound' | 'outbound'
  content: string
  timestamp: string
  type: string
  status: string
}> {
  // Return mock message history based on conversation ID
  return [
    {
      id: `msg-${conversationId}-1`,
      conversationId,
      direction: 'inbound',
      content: 'Halo, saya butuh info tentang layanan Anda',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      type: 'text',
      status: 'delivered',
    },
    {
      id: `msg-${conversationId}-2`,
      conversationId,
      direction: 'outbound',
      content: 'Halo! Tentu, dengan senang hati saya bantu. Layanan apa yang Anda cari?',
      timestamp: new Date(Date.now() - 7000000).toISOString(),
      type: 'text',
      status: 'read',
    },
    {
      id: `msg-${conversationId}-3`,
      conversationId,
      direction: 'inbound',
      content: 'Saya tertarik dengan paket premium',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'text',
      status: 'delivered',
    },
  ]
}
