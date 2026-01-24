/**
 * ARI Message Processor
 *
 * Core processing logic for handling WhatsApp messages with AI.
 * Integrates state machine, context builder, and AI router to
 * generate contextual responses.
 */

import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/../convex/_generated/api'
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

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
 * @param workspaceId - Workspace ID
 * @param contactId - Contact ID
 * @returns ARI conversation record
 */
async function getOrCreateARIConversation(
  workspaceId: string,
  contactId: string
): Promise<ARIConversation | null> {
  try {
    // Try to get existing conversation
    const existing = await convex.query(api.ari.getConversationByContact, {
      workspace_id: workspaceId,
      contact_id: contactId,
    })

    if (existing) {
      // Map Convex object to ARIConversation (with type assertion for Convex-specific fields)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conv = existing as any
      return {
        id: conv._id,
        workspace_id: conv.workspace_id,
        contact_id: conv.contact_id,
        state: conv.state || 'greeting',
        context: conv.context || {},
        lead_score: conv.lead_score,
        lead_temperature: conv.lead_temperature,
        ai_model: conv.ai_model,
        handoff_at: conv.handoff_at ? new Date(conv.handoff_at).toISOString() : null,
        handoff_reason: conv.handoff_reason,
        created_at: new Date(conv.created_at).toISOString(),
        // Keep as number internally for Convex compatibility
        updated_at: conv.updated_at,
      } as ARIConversation
    }

    // Create new conversation if not exists
    const created = await convex.mutation(api.ari.upsertConversation, {
      workspace_id: workspaceId,
      contact_id: contactId,
      current_state: 'greeting' as ARIState,
      context: {} as ARIContext,
    })

    if (!created) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conv = created as any
    return {
      id: conv._id,
      workspace_id: conv.workspace_id,
      contact_id: conv.contact_id,
      state: conv.state || 'greeting',
      context: conv.context || {},
      lead_score: conv.lead_score,
      lead_temperature: conv.lead_temperature,
      ai_model: conv.ai_model,
      handoff_at: conv.handoff_at ? new Date(conv.handoff_at).toISOString() : null,
      handoff_reason: conv.handoff_reason,
      created_at: new Date(conv.created_at).toISOString(),
      // Keep as number internally for Convex compatibility
      updated_at: conv.updated_at,
    } as ARIConversation
  } catch (error) {
    console.error('[ARI] Failed to get/create conversation:', error)
    return null
  }
}

/**
 * Get ARI configuration for a workspace
 *
 * @param workspaceId - Workspace ID
 * @returns ARI config (or defaults if not found)
 */
async function getARIConfig(
  workspaceId: string
): Promise<ARIConfig> {
  try {
    const data = await convex.query(api.ari.getAriConfig, {
      workspace_id: workspaceId,
    })

    if (!data) {
      // Return default config with placeholder IDs
      return {
        id: 'default',
        workspace_id: workspaceId,
        ...DEFAULT_CONFIG,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }

    return data as any as ARIConfig
  } catch (error) {
    console.error('[ARI] Failed to get config:', error)
    // Return default config on error
    return {
      id: 'default',
      workspace_id: workspaceId,
      ...DEFAULT_CONFIG,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }
}

/**
 * Get recent ARI messages for a conversation
 *
 * @param ariConversationId - ARI conversation ID
 * @param limit - Max messages to retrieve (default: 10)
 * @returns Array of ARI messages
 */
async function getRecentMessages(
  ariConversationId: string,
  limit: number = 10
): Promise<ARIMessage[]> {
  try {
    const messages = await convex.query(api.ari.getConversationMessages, {
      conversation_id: ariConversationId,
      limit: limit * 2, // Get more to ensure we have enough after filtering
    })

    // Take last N messages (they're already ordered oldest first from Convex)
    return (messages || []).slice(-limit) as any as ARIMessage[]
  } catch (error) {
    console.error('[ARI] Failed to get messages:', error)
    return []
  }
}

/**
 * Log a message to ARI messages table
 */
async function logMessage(
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
  try {
    await convex.mutation(api.ari.createMessage, {
      conversation_id: params.ariConversationId,
      sender_type: params.role,
      content: params.content,
      metadata: {
        ai_model: params.aiModel || null,
        tokens_used: params.tokensUsed || null,
        response_time_ms: params.responseTimeMs || null,
      },
    })
  } catch (error) {
    console.error('[ARI] Failed to log message:', error)
  }
}

/**
 * Count messages in current state for auto-handoff detection
 */
async function countMessagesInState(
  ariConversationId: string,
  stateChangedAt: number | null
): Promise<number> {
  try {
    const count = await convex.query(api.ari.countMessagesInState, {
      conversation_id: ariConversationId,
      state_changed_at: stateChangedAt || undefined,
    })
    return count || 0
  } catch (error) {
    console.error('[ARI] Failed to count messages:', error)
    return 0
  }
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
    // 1. Get or create ARI conversation
    const conversation = await getOrCreateARIConversation(workspaceId, contactId);
    if (!conversation) {
      return { success: false, error: 'Failed to get/create conversation' };
    }

    // 2. Get contact data with form answers
    const contact = await convex.query(api.contacts.getByIdInternal, {
      contact_id: contactId,
    })

    if (!contact) {
      console.error('[ARI] Failed to get contact');
      return { success: false, error: 'Contact not found' };
    }

    // 3. Get ARI config
    const config = await getARIConfig(workspaceId);

    // 4. Get recent messages
    const recentMessages = await getRecentMessages(conversation.id);

    // 5. Extract form answers from contact metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formAnswers = extractFormAnswers((contact as any).metadata);

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
        await convex.mutation(api.ari.updateConversation, {
          conversation_id: conversation.id,
          context: updatedContext,
        });

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
      const metadataFormAnswers = ((contact as any).metadata as any)?.form_answers;
      const targetCountry = detection.country ||
        formAnswers.country ||
        (metadataFormAnswers?.country as string | undefined);

      if (targetCountry) {
        destinations = await getDestinationsForCountry(workspaceId, targetCountry);
        console.log(`[ARI] Fetched ${destinations.length} destinations for ${targetCountry}`);
      }
    }

    // 6. Check for auto-handoff (stuck in same state too long)
    const messageCount = await countMessagesInState(
      conversation.id,
      conversation.updated_at as any as number
    );

    if (shouldAutoHandoff(conversation.state, messageCount)) {
      console.log(`[ARI] Auto-handoff triggered: ${messageCount} messages in ${conversation.state}`);

      // Update to handoff state
      await convex.mutation(api.ari.updateConversation, {
        conversation_id: conversation.id,
        state: 'handoff' as ARIState,
        handoff_at: Date.now(),
        handoff_reason: 'auto_handoff_stuck',
      });

      // Log user message
      await logMessage({
        ariConversationId: conversation.id,
        workspaceId,
        role: 'user',
        content: userMessage,
      });

      // Send handoff message
      const handoffMessage = 'Terima kasih sudah menunggu. Konsultan kami akan segera menghubungi kamu untuk membantu lebih lanjut.';

      await logMessage({
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name: (contact as any).name,
        formAnswers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        leadScore: (contact as any).lead_score || conversation.lead_score,
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
    await logMessage({
      ariConversationId: conversation.id,
      workspaceId,
      role: 'user',
      content: userMessage,
    });

    // 11. Log AI response
    await logMessage({
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

      await convex.mutation(api.ari.updateConversation, {
        conversation_id: conversation.id,
        lead_score: calculatedScore,
        lead_temperature: temperature,
        context: updatedContext,
      });

      console.log(`[ARI] Score updated: ${conversation.lead_score} -> ${calculatedScore} (${temperature})`);
    }

    // 12d. Sync score to contacts table for CRM visibility
    await convex.mutation(api.contacts.updateContact, {
      contact_id: contactId,
      lead_score: calculatedScore,
      lead_status: temperatureToLeadStatus(temperature),
    });

    // 12e. Execute routing action if ready
    if (routing.readyForRouting) {
      if (routing.action === 'send_community_cold' && routing.message) {
        // Send community link message BEFORE handoff message
        try {
          await sendMessage(kapsoCredentials, contactPhone, routing.message);
          console.log('[ARI] Sent community link to cold lead');

          // Log community message
          await logMessage({
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

        await convex.mutation(api.ari.updateConversation, {
          conversation_id: conversation.id,
          state: 'handoff' as ARIState,
          handoff_at: Date.now(),
          handoff_reason: routing.action === 'handoff_hot' ? 'hot_lead' : 'cold_lead_community_sent',
          lead_score: calculatedScore,
          lead_temperature: temperature,
          context: handoffContext,
        });

        // Send handoff message
        const handoffMessage = routing.action === 'handoff_hot'
          ? 'Terima kasih sudah berbagi info yang lengkap. Konsultan kami akan segera menghubungi kamu untuk mendiskusikan pilihan yang cocok.'
          : 'Konsultan kami akan follow up nanti ya kak. Kalau ada pertanyaan, langsung chat di grup aja.';

        await logMessage({
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
          const daySlots = await getSlotsForDay(workspaceId, dayPref);

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
            await convex.mutation(api.ari.updateConversation, {
              conversation_id: conversation.id,
              context: schedCtx as any,
              state: 'scheduling',
            });
          } else {
            // No slots for that day - reload available days
            const allSlots = await getAvailableSlots(workspaceId);
            schedCtx.available_days_summary = formatAvailableDays(allSlots);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await convex.mutation(api.ari.updateConversation, {
              conversation_id: conversation.id,
              context: schedCtx as any,
              state: 'scheduling',
            });
          }
        } else if (!schedCtx.available_days_summary) {
          // First time - load available days
          const allSlots = await getAvailableSlots(workspaceId);
          schedCtx.scheduling_step = 'asking_day';
          schedCtx.available_days_summary = formatAvailableDays(allSlots);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await convex.mutation(api.ari.updateConversation, {
            conversation_id: conversation.id,
            context: schedCtx as any,
            state: 'scheduling',
          });
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
          await convex.mutation(api.ari.updateConversation, {
            conversation_id: conversation.id,
            context: schedCtx as any,
          });
        }
      }

      // User is confirming selection
      if (schedCtx.scheduling_step === 'confirming' && schedCtx.selected_slot) {
        const isConfirm = /^(ya|oke|ok|yes|betul|benar|setuju|deal)/i.test(userMessage.trim());

        if (isConfirm) {
          // Book the appointment
          const slot = schedCtx.selected_slot;
          const appointment = await bookAppointment({
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
            await convex.mutation(api.ari.updateConversation, {
              conversation_id: conversation.id,
              state: 'handoff' as ARIState,
              context: schedCtx as any,
              handoff_at: Date.now(),
              handoff_reason: 'appointment_booked',
            });

            // Execute handoff: update contact notes, tags, lead status, notify consultant
            // Note: consultant_id is set on the appointment from the slot lookup in scheduling.ts
            const handoffResult = await executeHandoff({
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

            await logMessage({
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
      await convex.mutation(api.ari.updateConversation, {
        conversation_id: conversation.id,
        state: nextState,
        ai_model: model,
        last_ai_message_at: Date.now(),
      });
    } else {
      // Just update last message timestamp
      await convex.mutation(api.ari.updateConversation, {
        conversation_id: conversation.id,
        last_ai_message_at: Date.now(),
      });
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
        const conv = await convex.query(api.ari.getConversationByContact, {
          workspace_id: workspaceId,
          contact_id: contactId,
        })

        if (conv) {
          await logMessage({
            ariConversationId: conv._id,
            workspaceId,
            role: 'user',
            content: userMessage,
          });

          await logMessage({
            ariConversationId: conv._id,
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
 * @param workspaceId - Workspace ID
 * @returns true if ARI is enabled (has ari_config)
 */
export async function isARIEnabledForWorkspace(
  workspaceId: string
): Promise<boolean> {
  try {
    const hasConfig = await convex.query(api.ari.hasAriConfig, {
      workspace_id: workspaceId,
    })
    return hasConfig
  } catch (error) {
    console.error('[ARI] Failed to check if enabled:', error)
    return false
  }
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
    // Get workspace Kapso credentials
    // Note: API key is stored in meta_access_token (encrypted)
    const workspace = await convex.query(api.workspaces.getKapsoCredentials, {
      workspace_id: workspaceId,
    })

    if (!workspace) {
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
