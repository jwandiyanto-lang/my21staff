// Kapso API client for WhatsApp operations
// Provides direct integration with Kapso API for conversations, messages, and contacts

export interface KapsoConversation {
  id: string
  phone: string
  contactName?: string
  kapso_name?: string
  lastMessageAt: string
  lastMessagePreview?: string
  status: 'active' | 'ended' | 'open' | 'handover' | 'closed'
  unreadCount: number
  assignedTo?: string
  tags?: string[]
  leadStatus?: string
}

export interface KapsoMessage {
  id: string
  conversationId: string
  content: string
  direction: 'inbound' | 'outbound'
  timestamp: string
  messageType: 'text' | 'image' | 'video' | 'document' | 'audio'
  mediaUrl?: string
  senderType?: 'contact' | 'user' | 'bot'
  senderId?: string
  status?: 'sent' | 'delivered' | 'read' | 'failed'
}

export interface KapsoContact {
  id: string
  phone: string
  name?: string
  kapso_name?: string
  email?: string
  leadStatus?: string
  leadScore?: number
  tags?: string[]
  assignedTo?: string
  metadata?: Record<string, unknown>
  kapsoIsOnline?: boolean
  kapsoLastSeen?: string
  kapsoProfilePic?: string
}

export interface KapsoContactContext {
  contact: KapsoContact
  recentMessages: KapsoMessage[]
  tags: string[]
  leadScore: number
  lastActivity: string
}

export interface KapsoSendMessageResponse {
  messageId: string
  status: 'sent' | 'queued' | 'failed'
  timestamp: string
}

export interface KapsoError {
  error: string
  message: string
  statusCode?: number
}

/**
 * KapsoClient - Direct API client for Kapso WhatsApp operations
 *
 * Uses Kapso REST API to fetch conversations, messages, and send messages.
 * Designed to work with Next.js API routes for auth proxy and CORS handling.
 */
export class KapsoClient {
  private apiKey: string
  private projectId: string
  private baseUrl: string

  constructor(config: { apiKey: string; projectId: string; baseUrl?: string }) {
    this.apiKey = config.apiKey
    this.projectId = config.projectId
    // Default to Kapso API base URL
    this.baseUrl = config.baseUrl || 'https://api.kapso.so/v1'
  }

  /**
   * Make authenticated request to Kapso API
   */
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Project-ID': this.projectId,
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(error.message || `Kapso API error: ${response.status}`)
      }

      return response.json()
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to connect to Kapso API')
    }
  }

  // =============================================================================
  // CONVERSATIONS
  // =============================================================================

  /**
   * List all conversations with optional filters
   */
  async listConversations(options?: {
    status?: 'active' | 'ended' | 'open' | 'handover' | 'closed'
    limit?: number
    offset?: number
  }): Promise<KapsoConversation[]> {
    const params = new URLSearchParams()
    if (options?.status) params.append('status', options.status)
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())

    const endpoint = `/projects/${this.projectId}/conversations${params.toString() ? `?${params}` : ''}`

    const response = await this.request<{ conversations: KapsoConversation[] }>(endpoint)
    return response.conversations
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(conversationId: string): Promise<KapsoConversation> {
    const endpoint = `/projects/${this.projectId}/conversations/${conversationId}`
    return this.request<KapsoConversation>(endpoint)
  }

  // =============================================================================
  // MESSAGES
  // =============================================================================

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, options?: {
    limit?: number
    before?: string // Message ID for pagination
  }): Promise<KapsoMessage[]> {
    const params = new URLSearchParams()
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.before) params.append('before', options.before)

    const endpoint = `/projects/${this.projectId}/conversations/${conversationId}/messages${params.toString() ? `?${params}` : ''}`

    const response = await this.request<{ messages: KapsoMessage[] }>(endpoint)
    return response.messages
  }

  // =============================================================================
  // SEND
  // =============================================================================

  /**
   * Send a text message
   */
  async sendTextMessage(
    conversationId: string,
    content: string
  ): Promise<KapsoSendMessageResponse> {
    const endpoint = `/projects/${this.projectId}/conversations/${conversationId}/messages`

    return this.request<KapsoSendMessageResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        type: 'text',
        content,
      }),
    })
  }

  /**
   * Send a template message
   */
  async sendTemplate(
    conversationId: string,
    templateName: string,
    params?: Record<string, string>
  ): Promise<KapsoSendMessageResponse> {
    const endpoint = `/projects/${this.projectId}/conversations/${conversationId}/messages`

    return this.request<KapsoSendMessageResponse>(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        type: 'template',
        templateName,
        params: params || {},
      }),
    })
  }

  // =============================================================================
  // CONTACTS
  // =============================================================================

  /**
   * Search contacts by phone or name
   */
  async searchContacts(query: string): Promise<KapsoContact[]> {
    const endpoint = `/projects/${this.projectId}/contacts/search?q=${encodeURIComponent(query)}`
    const response = await this.request<{ contacts: KapsoContact[] }>(endpoint)
    return response.contacts
  }

  /**
   * Get contact context with recent activity
   */
  async getContactContext(identifier: string): Promise<KapsoContactContext> {
    const endpoint = `/projects/${this.projectId}/contacts/${encodeURIComponent(identifier)}`
    return this.request<KapsoContactContext>(endpoint)
  }
}

// =============================================================================
  // FACTORY FUNCTIONS
  // =============================================================================

/**
 * Create a KapsoClient from workspace settings
 * Workspace settings should contain kapso_api_key and project_id
 */
export function createKapsoClient(settings: {
  kapso_api_key?: string
  projectId?: string
}): KapsoClient | null {
  const apiKey = settings.kapso_api_key
  const projectId = settings.projectId

  if (!apiKey || !projectId) {
    console.warn('Kapso client not configured: missing API key or project ID')
    return null
  }

  return new KapsoClient({ apiKey, projectId })
}

/**
 * Validate Kapso credentials
 */
export async function validateKapsoCredentials(
  apiKey: string,
  projectId: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = new KapsoClient({ apiKey, projectId })
    // Try to fetch conversations (should return empty array if valid)
    await client.listConversations({ limit: 1 })
    return { valid: true }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
