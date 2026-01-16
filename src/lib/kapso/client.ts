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
 * Get Kapso conversation by contact phone number
 * Returns the Kapso conversation ID for a phone number
 */
export async function getKapsoConversation(
  credentials: KapsoCredentials,
  contactPhone: string
): Promise<{ id: string; status: string } | null> {
  const { apiKey, phoneId } = credentials;

  if (!apiKey || !phoneId) {
    console.error('Missing Kapso credentials');
    return null;
  }

  const cleanPhone = cleanPhoneNumber(contactPhone);
  const apiUrl = `https://api.kapso.ai/meta/whatsapp/v24.0/${phoneId}/conversations?phone_number=${cleanPhone}&status=active&limit=1`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      const result = await response.text();
      console.error(`Kapso get conversation error: ${response.status} - ${result}`);
      return null;
    }

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return { id: data.data[0].id, status: data.data[0].status };
    }
    return null;
  } catch (error) {
    console.error('Kapso get conversation failed:', error);
    return null;
  }
}

/**
 * Get active workflow executions for a Kapso conversation
 */
export async function getWorkflowExecutions(
  credentials: KapsoCredentials,
  kapsoConversationId: string
): Promise<Array<{ id: string; status: string }>> {
  const { apiKey } = credentials;

  if (!apiKey) {
    console.error('Missing Kapso API key');
    return [];
  }

  const apiUrl = `https://api.kapso.ai/platform/v1/functions/whatsapp-conversations/${kapsoConversationId}/workflow-executions`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
      },
    });

    if (!response.ok) {
      const result = await response.text();
      console.error(`Kapso get workflow executions error: ${response.status} - ${result}`);
      return [];
    }

    const data = await response.json();
    // Filter for active/waiting executions that can be handed off
    const activeExecutions = (data.data || []).filter(
      (exec: { status: string }) => exec.status === 'running' || exec.status === 'waiting'
    );
    return activeExecutions.map((exec: { id: string; status: string }) => ({
      id: exec.id,
      status: exec.status,
    }));
  } catch (error) {
    console.error('Kapso get workflow executions failed:', error);
    return [];
  }
}

/**
 * Update workflow execution status (handoff/waiting/ended)
 */
export async function updateWorkflowExecutionStatus(
  credentials: KapsoCredentials,
  executionId: string,
  status: 'handoff' | 'waiting' | 'ended'
): Promise<boolean> {
  const { apiKey } = credentials;

  if (!apiKey) {
    console.error('Missing Kapso API key');
    return false;
  }

  const apiUrl = `https://api.kapso.ai/platform/v1/workflow_executions/${executionId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'PATCH',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_execution: { status },
      }),
    });

    if (!response.ok) {
      const result = await response.text();
      console.error(`Kapso update workflow execution error: ${response.status} - ${result}`);
      return false;
    }

    console.log(`Workflow execution ${executionId} status updated to ${status}`);
    return true;
  } catch (error) {
    console.error('Kapso update workflow execution failed:', error);
    return false;
  }
}

/**
 * Set handover status for a conversation (pause/resume AI)
 * This is a high-level function that:
 * 1. Finds the Kapso conversation by phone number
 * 2. Gets active workflow executions
 * 3. Updates their status to handoff (to pause) or ends the handoff state
 */
export async function setHandover(
  credentials: KapsoCredentials,
  contactPhone: string,
  paused: boolean
): Promise<{ success: boolean; message?: string }> {
  const { apiKey } = credentials;

  if (!apiKey) {
    return { success: false, message: 'Missing Kapso API key' };
  }

  try {
    // Step 1: Get Kapso conversation by phone number
    const conversation = await getKapsoConversation(credentials, contactPhone);
    if (!conversation) {
      console.log(`No active Kapso conversation found for ${contactPhone}`);
      // This is OK - may not have an active conversation on Kapso side
      return { success: true, message: 'No active Kapso conversation' };
    }

    // Step 2: Get active workflow executions
    const executions = await getWorkflowExecutions(credentials, conversation.id);
    if (executions.length === 0) {
      console.log(`No active workflow executions for conversation ${conversation.id}`);
      // This is OK - may not have any workflows running
      return { success: true, message: 'No active workflow executions' };
    }

    // Step 3: Update all active workflow executions
    const newStatus = paused ? 'handoff' : 'waiting'; // 'waiting' to resume, Kapso will continue
    let successCount = 0;

    for (const exec of executions) {
      const updated = await updateWorkflowExecutionStatus(credentials, exec.id, newStatus);
      if (updated) successCount++;
    }

    console.log(`Handover: Updated ${successCount}/${executions.length} workflow executions to ${newStatus}`);
    return {
      success: successCount > 0,
      message: `Updated ${successCount}/${executions.length} workflow executions`,
    };
  } catch (error) {
    console.error('Kapso handover API call failed:', error);
    return { success: false, message: 'Kapso API call failed' };
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
    setHandover: (contactPhone: string, paused: boolean) => setHandover(credentials, contactPhone, paused),
    getKapsoConversation: (contactPhone: string) => getKapsoConversation(credentials, contactPhone),
    getWorkflowExecutions: (kapsoConversationId: string) => getWorkflowExecutions(credentials, kapsoConversationId),
  };
}

export type KapsoClient = ReturnType<typeof createKapsoClient>;
