/**
 * ARI Message Processor
 *
 * Core processing logic for handling WhatsApp messages with AI.
 * Integrates state machine, context builder, and AI router to
 * generate contextual responses.
 */

import { createApiAdminClient } from '@/lib/supabase/server';
import { sendMessage, type KapsoCredentials } from '@/lib/kapso/client';
import {
  buildSystemPrompt,
  buildMessageHistory,
  extractFormAnswers,
  type PromptContext,
} from './context-builder';
import { selectModel, generateResponse } from './ai-router';
import { getNextState, shouldAutoHandoff } from './state-machine';
import type {
  ARIConversation,
  ARIConfig,
  ARIMessage,
  ARIState,
  ARIContext,
  ARITone,
  AIModelType,
} from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

// ===========================================
// Type Definitions
// ===========================================

/**
 * Parameters for processing a message with ARI
 */
export interface ProcessParams {
  workspaceId: string;
  contactId: string;
  contactPhone: string;
  userMessage: string;
  kapsoCredentials: KapsoCredentials;
}

/**
 * Result from ARI processing
 */
export interface ProcessResult {
  success: boolean;
  response?: string;
  error?: string;
  model?: AIModelType;
  newState?: ARIState;
}

// ===========================================
// Database Helpers
// ===========================================

/**
 * Default ARI configuration when workspace has no custom config
 */
const DEFAULT_CONFIG: Omit<ARIConfig, 'id' | 'workspace_id' | 'created_at' | 'updated_at'> = {
  bot_name: 'ARI',
  greeting_style: 'professional',
  language: 'id',
  tone: { supportive: true, clear: true, encouraging: true },
  community_link: null,
};

/**
 * Get or create ARI conversation for a contact
 *
 * @param supabase - Supabase client with service role
 * @param workspaceId - Workspace ID
 * @param contactId - Contact ID
 * @returns ARI conversation record
 */
async function getOrCreateARIConversation(
  supabase: SupabaseClient,
  workspaceId: string,
  contactId: string
): Promise<ARIConversation | null> {
  // Try to get existing conversation
  const { data: existing, error: selectError } = await supabase
    .from('ari_conversations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('contact_id', contactId)
    .single();

  if (existing && !selectError) {
    return existing as ARIConversation;
  }

  // Create new conversation if not exists
  if (selectError?.code === 'PGRST116') {
    // Not found - create new
    const { data: created, error: insertError } = await supabase
      .from('ari_conversations')
      .insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        state: 'greeting' as ARIState,
        lead_score: 0,
        context: {} as ARIContext,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[ARI] Failed to create conversation:', insertError);
      return null;
    }

    return created as ARIConversation;
  }

  // Some other error
  console.error('[ARI] Failed to get conversation:', selectError);
  return null;
}

/**
 * Get ARI configuration for a workspace
 *
 * @param supabase - Supabase client
 * @param workspaceId - Workspace ID
 * @returns ARI config (or defaults if not found)
 */
async function getARIConfig(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<ARIConfig> {
  const { data, error } = await supabase
    .from('ari_config')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  if (error || !data) {
    // Return default config with placeholder IDs
    return {
      id: 'default',
      workspace_id: workspaceId,
      ...DEFAULT_CONFIG,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  return data as ARIConfig;
}

/**
 * Get recent ARI messages for a conversation
 *
 * @param supabase - Supabase client
 * @param ariConversationId - ARI conversation ID
 * @param limit - Max messages to retrieve (default: 10)
 * @returns Array of ARI messages
 */
async function getRecentMessages(
  supabase: SupabaseClient,
  ariConversationId: string,
  limit: number = 10
): Promise<ARIMessage[]> {
  const { data, error } = await supabase
    .from('ari_messages')
    .select('*')
    .eq('ari_conversation_id', ariConversationId)
    .order('created_at', { ascending: true })
    .limit(limit * 2) // Get more to ensure we have enough after filtering
    ;

  if (error) {
    console.error('[ARI] Failed to get messages:', error);
    return [];
  }

  // Take last N messages
  const messages = data as ARIMessage[];
  return messages.slice(-limit);
}

/**
 * Log a message to ari_messages table
 */
async function logMessage(
  supabase: SupabaseClient,
  params: {
    ariConversationId: string;
    workspaceId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    aiModel?: AIModelType;
    tokensUsed?: number | null;
    responseTimeMs?: number | null;
  }
): Promise<void> {
  const { error } = await supabase.from('ari_messages').insert({
    ari_conversation_id: params.ariConversationId,
    workspace_id: params.workspaceId,
    role: params.role,
    content: params.content,
    ai_model: params.aiModel || null,
    tokens_used: params.tokensUsed || null,
    response_time_ms: params.responseTimeMs || null,
    metadata: {},
  });

  if (error) {
    console.error('[ARI] Failed to log message:', error);
  }
}

/**
 * Count messages in current state for auto-handoff detection
 */
async function countMessagesInState(
  supabase: SupabaseClient,
  ariConversationId: string,
  stateChangedAt: string | null
): Promise<number> {
  // If we don't have a state change timestamp, count all messages
  const query = supabase
    .from('ari_messages')
    .select('id', { count: 'exact', head: true })
    .eq('ari_conversation_id', ariConversationId);

  if (stateChangedAt) {
    query.gte('created_at', stateChangedAt);
  }

  const { count, error } = await query;

  if (error) {
    console.error('[ARI] Failed to count messages:', error);
    return 0;
  }

  return count || 0;
}

// ===========================================
// Main Processing Function
// ===========================================

/**
 * Process an incoming message with ARI
 *
 * This is the main entry point for ARI message processing:
 * 1. Gets or creates conversation state
 * 2. Builds context from contact data and history
 * 3. Generates AI response
 * 4. Logs messages
 * 5. Updates state if needed
 * 6. Sends response via Kapso
 *
 * @param params - Processing parameters
 * @returns Processing result
 */
export async function processWithARI(params: ProcessParams): Promise<ProcessResult> {
  const { workspaceId, contactId, contactPhone, userMessage, kapsoCredentials } = params;
  const startTime = Date.now();

  console.log(`[ARI] Processing message for contact ${contactId} in workspace ${workspaceId}`);

  try {
    const supabase = createApiAdminClient();

    // 1. Get or create ARI conversation
    const conversation = await getOrCreateARIConversation(supabase, workspaceId, contactId);
    if (!conversation) {
      return { success: false, error: 'Failed to get/create conversation' };
    }

    // 2. Get contact data with form answers
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('id, name, email, phone, metadata, lead_score')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      console.error('[ARI] Failed to get contact:', contactError);
      return { success: false, error: 'Contact not found' };
    }

    // 3. Get ARI config
    const config = await getARIConfig(supabase, workspaceId);

    // 4. Get recent messages
    const recentMessages = await getRecentMessages(supabase, conversation.id);

    // 5. Extract form answers from contact metadata
    const formAnswers = extractFormAnswers(contact.metadata);

    // 6. Check for auto-handoff (stuck in same state too long)
    const messageCount = await countMessagesInState(
      supabase,
      conversation.id,
      conversation.updated_at
    );

    if (shouldAutoHandoff(conversation.state, messageCount)) {
      console.log(`[ARI] Auto-handoff triggered: ${messageCount} messages in ${conversation.state}`);

      // Update to handoff state
      await supabase
        .from('ari_conversations')
        .update({
          state: 'handoff' as ARIState,
          handoff_at: new Date().toISOString(),
          handoff_reason: 'auto_handoff_stuck',
        })
        .eq('id', conversation.id);

      // Log user message
      await logMessage(supabase, {
        ariConversationId: conversation.id,
        workspaceId,
        role: 'user',
        content: userMessage,
      });

      // Send handoff message
      const handoffMessage = 'Terima kasih sudah menunggu. Konsultan kami akan segera menghubungi kamu untuk membantu lebih lanjut.';

      await logMessage(supabase, {
        ariConversationId: conversation.id,
        workspaceId,
        role: 'assistant',
        content: handoffMessage,
      });

      try {
        await sendMessage(kapsoCredentials, contactPhone, handoffMessage);
      } catch (sendError) {
        console.error('[ARI] Failed to send handoff message:', sendError);
      }

      return {
        success: true,
        response: handoffMessage,
        newState: 'handoff',
      };
    }

    // 7. Build context for AI
    const promptContext: PromptContext = {
      contact: {
        name: contact.name,
        formAnswers,
        leadScore: contact.lead_score || conversation.lead_score,
      },
      conversation: {
        state: conversation.state,
        context: conversation.context as ARIContext,
        recentMessages: recentMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      },
      config: {
        botName: config.bot_name,
        greetingStyle: config.greeting_style,
        tone: config.tone as ARITone,
        language: config.language,
      },
    };

    const systemPrompt = buildSystemPrompt(promptContext);
    const messageHistory = buildMessageHistory(recentMessages);

    // 8. Select AI model based on contact ID (deterministic A/B)
    const model = selectModel(contactId);

    // 9. Generate AI response
    console.log(`[ARI] Generating response with ${model}`);

    const aiResponse = await generateResponse(
      model,
      [
        { role: 'system', content: systemPrompt },
        ...messageHistory,
        { role: 'user', content: userMessage },
      ],
      {
        maxTokens: 150,
        temperature: 0.8,
      }
    );

    const responseTime = Date.now() - startTime;

    // 10. Log user message
    await logMessage(supabase, {
      ariConversationId: conversation.id,
      workspaceId,
      role: 'user',
      content: userMessage,
    });

    // 11. Log AI response
    await logMessage(supabase, {
      ariConversationId: conversation.id,
      workspaceId,
      role: 'assistant',
      content: aiResponse.content,
      aiModel: model,
      tokensUsed: aiResponse.tokens,
      responseTimeMs: aiResponse.responseTimeMs,
    });

    // 12. Determine next state
    const leadScore = contact.lead_score || conversation.lead_score;
    const nextState = getNextState(conversation.state, conversation.context as ARIContext, leadScore);

    // 13. Update conversation if state changed or update AI model
    if (nextState !== conversation.state || conversation.ai_model !== model) {
      await supabase
        .from('ari_conversations')
        .update({
          state: nextState,
          ai_model: model,
          last_ai_message_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);
    } else {
      // Just update last message timestamp
      await supabase
        .from('ari_conversations')
        .update({
          last_ai_message_at: new Date().toISOString(),
        })
        .eq('id', conversation.id);
    }

    // 14. Send response via Kapso
    try {
      await sendMessage(kapsoCredentials, contactPhone, aiResponse.content);
      console.log(`[ARI] Response sent in ${responseTime}ms`);
    } catch (sendError) {
      console.error('[ARI] Failed to send message via Kapso:', sendError);
      // Response generated successfully but sending failed
      return {
        success: false,
        response: aiResponse.content,
        error: 'Failed to send message via Kapso',
        model,
        newState: nextState,
      };
    }

    return {
      success: true,
      response: aiResponse.content,
      model,
      newState: nextState !== conversation.state ? nextState : undefined,
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ARI] Processing error:', error);

    // Try to send fallback message
    try {
      const fallbackMessage = 'Maaf, ada gangguan teknis. Bentar ya.';
      await sendMessage(kapsoCredentials, contactPhone, fallbackMessage);

      // Log the failed attempt if we have a conversation
      try {
        const supabase = createApiAdminClient();
        const { data: conv } = await supabase
          .from('ari_conversations')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('contact_id', contactId)
          .single();

        if (conv) {
          await logMessage(supabase, {
            ariConversationId: conv.id,
            workspaceId,
            role: 'user',
            content: userMessage,
          });

          await logMessage(supabase, {
            ariConversationId: conv.id,
            workspaceId,
            role: 'system',
            content: `Error: ${errorMessage}. Sent fallback message.`,
          });
        }
      } catch {
        // Ignore logging errors
      }

      return {
        success: false,
        response: fallbackMessage,
        error: errorMessage,
      };
    } catch {
      return {
        success: false,
        error: `${errorMessage} (fallback also failed)`,
      };
    }
  }
}

// ===========================================
// Helper Functions
// ===========================================

/**
 * Check if ARI is enabled for a workspace
 *
 * @param supabase - Supabase client
 * @param workspaceId - Workspace ID
 * @returns true if ARI is enabled (has ari_config)
 */
export async function isARIEnabledForWorkspace(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<boolean> {
  const { data } = await supabase
    .from('ari_config')
    .select('id')
    .eq('workspace_id', workspaceId)
    .single();

  return !!data;
}

/**
 * Manually trigger ARI greeting for a contact
 *
 * Useful for testing ARI without an actual incoming WhatsApp message.
 * This simulates the first message from a lead.
 *
 * @param workspaceId - Workspace ID
 * @param contactId - Contact ID
 * @param contactPhone - Contact phone number
 * @returns Processing result
 */
export async function triggerARIGreeting(
  workspaceId: string,
  contactId: string,
  contactPhone: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createApiAdminClient();

    // Get workspace Kapso credentials
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('kapso_api_key, kapso_phone_id')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    if (!workspace.kapso_api_key || !workspace.kapso_phone_id) {
      return { success: false, error: 'Kapso credentials not configured' };
    }

    // Note: In production, we'd decrypt the API key here
    // For now, assuming it's stored decrypted for testing
    const credentials: KapsoCredentials = {
      apiKey: workspace.kapso_api_key,
      phoneId: workspace.kapso_phone_id,
    };

    // Process with a simulated greeting trigger
    const result = await processWithARI({
      workspaceId,
      contactId,
      contactPhone,
      userMessage: 'Halo', // Simulated first message
      kapsoCredentials: credentials,
    });

    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
