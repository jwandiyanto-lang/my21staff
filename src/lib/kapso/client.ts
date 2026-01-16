/**
 * Kapso WhatsApp API Client
 * API Docs: https://docs.kapso.ai/docs/whatsapp/send-messages/text
 *
 * Workspace-aware client that uses credentials from workspace settings
 */

export interface KapsoCredentials {
  apiKey: string;
  phoneId: string;
}

export interface KapsoResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

/**
 * Clean phone number - remove all non-digit characters
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Get Kapso API URL for a specific phone
 */
function getApiUrl(phoneId: string): string {
  return `https://api.kapso.ai/meta/whatsapp/v24.0/${phoneId}/messages`;
}

/**
 * Send a text message
 */
export async function sendMessage(
  credentials: KapsoCredentials,
  to: string,
  text: string
): Promise<KapsoResponse> {
  const { apiKey, phoneId } = credentials;

  if (!apiKey || !phoneId) {
    throw new Error('Missing Kapso credentials (apiKey or phoneId)');
  }

  const cleanTo = cleanPhoneNumber(to);
  const apiUrl = getApiUrl(phoneId);

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: cleanTo,
      type: 'text',
      text: { body: text },
    }),
  });

  const result = await response.text();

  if (!response.ok) {
    console.error(`Kapso API error: ${response.status} - ${result}`);
    throw new Error(`Kapso API error: ${response.status}`);
  }

  console.log(`Message sent to ${cleanTo}`);
  return JSON.parse(result);
}

/**
 * Send a media message (image, video, document, audio)
 * API Docs: https://docs.kapso.ai/docs/whatsapp/send-messages/media
 */
export async function sendMediaMessage(
  credentials: KapsoCredentials,
  to: string,
  mediaUrl: string,
  mediaType: 'image' | 'video' | 'document' | 'audio',
  caption?: string,
  filename?: string
): Promise<KapsoResponse> {
  const { apiKey, phoneId } = credentials;

  if (!apiKey || !phoneId) {
    throw new Error('Missing Kapso credentials (apiKey or phoneId)');
  }

  const cleanTo = cleanPhoneNumber(to);
  const apiUrl = getApiUrl(phoneId);

  // Build media payload based on type
  const mediaPayload: Record<string, unknown> = {
    link: mediaUrl,
  };

  if (caption) {
    mediaPayload.caption = caption;
  }

  if (mediaType === 'document' && filename) {
    mediaPayload.filename = filename;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: cleanTo,
      type: mediaType,
      [mediaType]: mediaPayload,
    }),
  });

  const result = await response.text();

  if (!response.ok) {
    console.error(`Kapso API error: ${response.status} - ${result}`);
    throw new Error(`Kapso API error: ${response.status}`);
  }

  console.log(`Media message sent to ${cleanTo}`);
  return JSON.parse(result);
}

/**
 * Set handover status for a conversation (pause/resume AI)
 * Uses Kapso API: PATCH /whatsapp/conversations/{conversation_id}
 */
export async function setHandover(
  credentials: KapsoCredentials,
  conversationId: string,
  paused: boolean
): Promise<{ success: boolean }> {
  const { apiKey } = credentials;

  if (!apiKey) {
    throw new Error('Missing Kapso API key');
  }

  // Kapso conversation endpoint
  const apiUrl = `https://api.kapso.ai/whatsapp/conversations/${conversationId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: paused ? 'handoff' : 'open',
      }),
    });

    if (!response.ok) {
      const result = await response.text();
      console.error(`Kapso handover API error: ${response.status} - ${result}`);
      // Don't throw - we still want to track locally even if Kapso call fails
      return { success: false };
    }

    console.log(`Handover ${paused ? 'enabled' : 'disabled'} for conversation ${conversationId}`);
    return { success: true };
  } catch (error) {
    console.error('Kapso handover API call failed:', error);
    return { success: false };
  }
}

/**
 * Create a Kapso client instance with bound credentials
 */
export function createKapsoClient(credentials: KapsoCredentials) {
  return {
    sendMessage: (to: string, text: string) => sendMessage(credentials, to, text),
    sendMediaMessage: (
      to: string,
      mediaUrl: string,
      mediaType: 'image' | 'video' | 'document' | 'audio',
      caption?: string,
      filename?: string
    ) => sendMediaMessage(credentials, to, mediaUrl, mediaType, caption, filename),
    setHandover: (conversationId: string, paused: boolean) => setHandover(credentials, conversationId, paused),
  };
}

export type KapsoClient = ReturnType<typeof createKapsoClient>;
