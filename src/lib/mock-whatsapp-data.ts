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
  direction: 'inbound' | 'outbound'
  content: string
  createdAt: string
  status: string
  phoneNumber: string
  hasMedia: boolean
  messageType?: string
}> {
  // Return mock message history based on conversation ID
  const phoneNumber = MOCK_WHATSAPP_CONVERSATIONS.find(c => c.id === conversationId)?.phoneNumber || '+62 812-3456-7890'

  return [
    {
      id: `msg-${conversationId}-1`,
      direction: 'inbound',
      content: 'Halo, saya butuh info tentang layanan Anda',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      status: 'delivered',
      phoneNumber,
      hasMedia: false,
      messageType: 'text',
    },
    {
      id: `msg-${conversationId}-2`,
      direction: 'outbound',
      content: 'Halo! Tentu, dengan senang hati saya bantu. Layanan apa yang Anda cari?',
      createdAt: new Date(Date.now() - 7000000).toISOString(),
      status: 'read',
      phoneNumber,
      hasMedia: false,
      messageType: 'text',
    },
    {
      id: `msg-${conversationId}-3`,
      direction: 'inbound',
      content: 'Saya tertarik dengan paket premium',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      status: 'delivered',
      phoneNumber,
      hasMedia: false,
      messageType: 'text',
    },
    {
      id: `msg-${conversationId}-4`,
      direction: 'outbound',
      content: 'Paket premium kami sangat cocok untuk kebutuhan bisnis. Bisakah saya tahu lebih detail tentang kebutuhan Anda?',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      status: 'read',
      phoneNumber,
      hasMedia: false,
      messageType: 'text',
    },
    {
      id: `msg-${conversationId}-5`,
      direction: 'inbound',
      content: 'Saya butuh untuk tim 10 orang, budget sekitar 5-10 juta per bulan',
      createdAt: new Date(Date.now() - 900000).toISOString(),
      status: 'delivered',
      phoneNumber,
      hasMedia: false,
      messageType: 'text',
    },
  ]
}
