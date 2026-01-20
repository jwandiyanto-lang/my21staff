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
import { getNextState, shouldAutoHandoff, type RoutingActionType } from './state-machine';
import {
  parseDocumentResponse,
  updateDocumentStatus,
  getNextDocumentKey,
  type DocumentStatus,
} from './qualification';
import { calculateLeadScore, getLeadTemperature, getScoreReasons, type ScoreBreakdown } from './scoring';
import { determineRouting, temperatureToLeadStatus } from './routing';
import {
  getDestinationsForCountry,
  detectUniversityQuestion,
  type Destination,
} from './knowledge-base';
import {
  getAvailableSlots,
  getSlotsForDay,
  formatAvailableDays,
  formatSlotsForDay,
  parseIndonesianDay,
  parseSlotSelection,
  bookAppointment,
  formatBookingConfirmation,
} from './scheduling';
import { executeHandoff } from './handoff';
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

    // 5b. Process document response if in qualifying state with pending question
    const conversationContext = conversation.context as ARIContext & {
      documents?: DocumentStatus;
      pendingDocumentQuestion?: keyof DocumentStatus;
      pendingCommunityMessage?: string;
      score_breakdown?: ScoreBreakdown;
      score_reasons?: string[];
    };

    if (
      conversation.state === 'qualifying' &&
      conversationContext.pendingDocumentQuestion
    ) {
      const parsedResponse = parseDocumentResponse(userMessage);
      if (parsedResponse !== null) {
        const currentDocs: DocumentStatus = conversationContext.documents || {
          passport: null,
          cv: null,
          english_test: null,
          transcript: null,
        };
        const pendingKey = conversationContext.pendingDocumentQuestion;
        const newDocs = updateDocumentStatus(currentDocs, pendingKey, parsedResponse);

        // Update conversation context with new document status
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedContext = {
          ...conversationContext,
          documents: newDocs,
          pendingDocumentQuestion: null, // Clear pending
        } as any;
        await supabase
          .from('ari_conversations')
          .update({ context: updatedContext })
          .eq('id', conversation.id);

        // Update local context for prompt building
        conversationContext.documents = newDocs;
        conversationContext.pendingDocumentQuestion = undefined;

        console.log(`[ARI] Document ${pendingKey} status updated to: ${parsedResponse}`);
      }
    }

    // 5d. Calculate lead score
    const documentStatus: DocumentStatus = conversationContext.documents || {
      passport: null,
      cv: null,
      english_test: null,
      transcript: null,
    };

    const { score: calculatedScore, breakdown, reasons } = calculateLeadScore(
      formAnswers,
      documentStatus,
      undefined  // Engagement score - future enhancement
    );

    const temperature = getLeadTemperature(calculatedScore);

    // 5e. Detect university questions and fetch destinations
    let destinations: Destination[] = [];
    const detection = detectUniversityQuestion(userMessage);
    if (detection.isQuestion) {
      // Use detected country, or fall back to form answer
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const metadataFormAnswers = (contact.metadata as any)?.form_answers;
      const targetCountry = detection.country ||
        formAnswers.country ||
        (metadataFormAnswers?.country as string | undefined);

      if (targetCountry) {
        destinations = await getDestinationsForCountry(supabase, workspaceId, targetCountry);
        console.log(`[ARI] Fetched ${destinations.length} destinations for ${targetCountry}`);
      }
    }

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
        context: conversationContext,
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
      // Include destinations for university questions
      destinations: destinations.length > 0 ? destinations.map(d => ({
        country: d.country,
        university: d.university_name,
        requirements: d.requirements as Record<string, unknown>,
      })) : undefined,
      // Full destinations for detailed formatting in prompt
      fullDestinations: destinations.length > 0 ? destinations : undefined,
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

    // 12. Determine routing decision
    const routing = determineRouting(
      calculatedScore,
      temperature,
      formAnswers,
      documentStatus,
      config.community_link
    );

    console.log(`[ARI] Routing decision: ${routing.action} (readyForRouting: ${routing.readyForRouting})`);

    // 12b. Determine next state (use calculated score and routing action)
    const nextState = getNextState(
      conversation.state,
      conversation.context as ARIContext,
      calculatedScore,
      routing.action as RoutingActionType
    );

    // 12c. Update score in ari_conversations if changed
    if (calculatedScore !== conversation.lead_score) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedContext: any = {
        ...conversationContext,
        score_breakdown: breakdown,
        score_reasons: reasons,
      };

      await supabase
        .from('ari_conversations')
        .update({
          lead_score: calculatedScore,
          lead_temperature: temperature,
          context: updatedContext,
        })
        .eq('id', conversation.id);

      console.log(`[ARI] Score updated: ${conversation.lead_score} -> ${calculatedScore} (${temperature})`);
    }

    // 12d. Sync score to contacts table for CRM visibility
    await supabase
      .from('contacts')
      .update({
        lead_score: calculatedScore,
        lead_status: temperatureToLeadStatus(temperature),
      })
      .eq('id', contactId);

    // 12e. Execute routing action if ready
    if (routing.readyForRouting) {
      if (routing.action === 'send_community_cold' && routing.message) {
        // Send community link message BEFORE handoff message
        try {
          await sendMessage(kapsoCredentials, contactPhone, routing.message);
          console.log('[ARI] Sent community link to cold lead');

          // Log community message
          await logMessage(supabase, {
            ariConversationId: conversation.id,
            workspaceId,
            role: 'assistant',
            content: routing.message,
          });
        } catch (sendError) {
          console.error('[ARI] Failed to send community message:', sendError);
        }
      }

      if (routing.action === 'handoff_hot' || routing.action === 'send_community_cold') {
        // Update conversation for handoff
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const handoffContext: any = {
          ...conversationContext,
          handoff_notes: routing.handoffNotes,
          score_breakdown: breakdown,
          score_reasons: reasons,
        };

        await supabase
          .from('ari_conversations')
          .update({
            state: 'handoff' as ARIState,
            handoff_at: new Date().toISOString(),
            handoff_reason: routing.action === 'handoff_hot' ? 'hot_lead' : 'cold_lead_community_sent',
            lead_score: calculatedScore,
            lead_temperature: temperature,
            context: handoffContext,
          })
          .eq('id', conversation.id);

        // Send handoff message
        const handoffMessage = routing.action === 'handoff_hot'
          ? 'Terima kasih sudah berbagi info yang lengkap. Konsultan kami akan segera menghubungi kamu untuk mendiskusikan pilihan yang cocok.'
          : 'Konsultan kami akan follow up nanti ya kak. Kalau ada pertanyaan, langsung chat di grup aja.';

        await logMessage(supabase, {
          ariConversationId: conversation.id,
          workspaceId,
          role: 'assistant',
          content: handoffMessage,
        });

        try {
          await sendMessage(kapsoCredentials, contactPhone, handoffMessage);
          console.log(`[ARI] Handoff message sent (${routing.action})`);
        } catch (sendError) {
          console.error('[ARI] Failed to send handoff message:', sendError);
        }

        return {
          success: true,
          response: handoffMessage,
          model,
          newState: 'handoff',
        };
      }
    }

    // 12f. Handle scheduling state transitions
    if (conversation.state === 'scheduling' || nextState === 'scheduling') {
      const schedCtx = conversationContext as ARIContext & {
        scheduling_step?: 'asking_day' | 'showing_slots' | 'confirming' | 'booked';
        selected_day?: number;
        available_slots?: Array<{
          date: string;
          start_time: string;
          duration_minutes: number;
          slot_id: string;
        }>;
        selected_slot?: {
          date: string;
          start_time: string;
          duration_minutes: number;
          slot_id: string;
        };
        available_days_summary?: string;
        slots_summary?: string;
        appointment_id?: string;
      };

      // First time entering scheduling - show available days
      if (!schedCtx.scheduling_step || schedCtx.scheduling_step === 'asking_day') {
        // Check for day preference in user message
        const dayPref = parseIndonesianDay(userMessage);

        if (dayPref !== null) {
          // User specified a day - get slots for that day
          const daySlots = await getSlotsForDay(supabase, workspaceId, dayPref);

          if (daySlots.length > 0) {
            schedCtx.scheduling_step = 'showing_slots';
            schedCtx.selected_day = dayPref;
            schedCtx.available_slots = daySlots.slice(0, 5).map(s => ({
              date: s.date,
              start_time: s.start_time,
              duration_minutes: s.duration_minutes,
              slot_id: s.slot_id,
            }));
            schedCtx.slots_summary = formatSlotsForDay(daySlots);

            // Update conversation context
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await supabase
              .from('ari_conversations')
              .update({ context: schedCtx as any, state: 'scheduling' })
              .eq('id', conversation.id);
          } else {
            // No slots for that day - reload available days
            const allSlots = await getAvailableSlots(supabase, workspaceId);
            schedCtx.available_days_summary = formatAvailableDays(allSlots);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await supabase
              .from('ari_conversations')
              .update({ context: schedCtx as any, state: 'scheduling' })
              .eq('id', conversation.id);
          }
        } else if (!schedCtx.available_days_summary) {
          // First time - load available days
          const allSlots = await getAvailableSlots(supabase, workspaceId);
          schedCtx.scheduling_step = 'asking_day';
          schedCtx.available_days_summary = formatAvailableDays(allSlots);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await supabase
            .from('ari_conversations')
            .update({ context: schedCtx as any, state: 'scheduling' })
            .eq('id', conversation.id);
        }
      }

      // User is selecting from shown slots
      if (schedCtx.scheduling_step === 'showing_slots' && schedCtx.available_slots) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const selection = parseSlotSelection(userMessage, schedCtx.available_slots as any);

        if (selection !== null) {
          schedCtx.scheduling_step = 'confirming';
          schedCtx.selected_slot = schedCtx.available_slots[selection];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await supabase
            .from('ari_conversations')
            .update({ context: schedCtx as any })
            .eq('id', conversation.id);
        }
      }

      // User is confirming selection
      if (schedCtx.scheduling_step === 'confirming' && schedCtx.selected_slot) {
        const isConfirm = /^(ya|oke|ok|yes|betul|benar|setuju|deal)/i.test(userMessage.trim());

        if (isConfirm) {
          // Book the appointment
          const slot = schedCtx.selected_slot;
          const appointment = await bookAppointment(supabase, {
            workspaceId,
            ariConversationId: conversation.id,
            slot: {
              date: slot.date,
              day_of_week: schedCtx.selected_day || 0,
              start_time: slot.start_time,
              end_time: '', // Not needed for booking
              duration_minutes: slot.duration_minutes,
              consultant_id: null,
              slot_id: slot.slot_id,
              booked: false,
            },
            notes: `Booked via ARI. Lead score: ${calculatedScore}`,
          });

          if (appointment) {
            schedCtx.scheduling_step = 'booked';
            schedCtx.appointment_id = appointment.id;

            // Update to handoff state
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await supabase
              .from('ari_conversations')
              .update({
                state: 'handoff' as ARIState,
                context: schedCtx as any,
                handoff_at: new Date().toISOString(),
                handoff_reason: 'appointment_booked',
              })
              .eq('id', conversation.id);

            // Execute handoff: update contact notes, tags, lead status, notify consultant
            // Note: consultant_id is set on the appointment from the slot lookup in scheduling.ts
            const handoffResult = await executeHandoff(supabase, {
              workspaceId,
              contactId,
              ariConversationId: conversation.id,
              appointmentId: appointment.id,
              consultationType: 'consultation',
              consultantId: appointment.consultant_id || undefined,
            });

            if (!handoffResult.success) {
              console.error('[ARI] Handoff execution failed:', handoffResult.error);
              // Continue anyway - booking succeeded, handoff is secondary
            } else {
              console.log('[ARI] Handoff executed successfully');
            }

            // Send confirmation message
            const confirmMsg = formatBookingConfirmation({
              date: slot.date,
              day_of_week: schedCtx.selected_day || 0,
              start_time: slot.start_time,
              end_time: '',
              duration_minutes: slot.duration_minutes,
              consultant_id: null,
              slot_id: slot.slot_id,
              booked: true,
            });
            await sendMessage(kapsoCredentials, contactPhone, confirmMsg);

            await logMessage(supabase, {
              ariConversationId: conversation.id,
              workspaceId,
              role: 'assistant',
              content: confirmMsg,
            });

            return {
              success: true,
              response: confirmMsg,
              newState: 'handoff',
            };
          }
        }
      }
    }

    // 13. Update conversation state and AI model
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
    // Note: API key is stored in meta_access_token (encrypted)
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('meta_access_token, kapso_phone_id')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return { success: false, error: 'Workspace not found' };
    }

    if (!workspace.meta_access_token || !workspace.kapso_phone_id) {
      return { success: false, error: 'Kapso credentials not configured' };
    }

    // Import safeDecrypt for decryption
    const { safeDecrypt } = await import('@/lib/crypto');
    const credentials: KapsoCredentials = {
      apiKey: safeDecrypt(workspace.meta_access_token),
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
