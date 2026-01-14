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
 * Create a Kapso client instance with bound credentials
 */
export function createKapsoClient(credentials: KapsoCredentials) {
  return {
    sendMessage: (to: string, text: string) => sendMessage(credentials, to, text),
  };
}

export type KapsoClient = ReturnType<typeof createKapsoClient>;
