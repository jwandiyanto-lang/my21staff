/**
 * ARI Handoff Module
 *
 * Handles the transition from ARI conversation to human consultant.
 * Generates conversation summary, updates contact status and tags,
 * and notifies the assigned consultant.
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';
import type { ARIMessage, LeadTemperature, ScoreBreakdown } from './types';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ===========================================
// Type Definitions
// ===========================================

export interface HandoffParams {
  workspaceId: string;
  contactId: string;
  ariConversationId: string;
  appointmentId?: string;
  consultationType: 'consultation' | 'community' | 'cold_followup';
  consultantId?: string;
}

export interface HandoffResult {
  success: boolean;
  summary?: string;
  error?: string;
}

// ===========================================
// Summary Generation
// ===========================================

/**
 * Generate a concise summary of the ARI conversation
 *
 * Creates a 3-5 sentence summary highlighting:
 * - Lead's main interest/goal
 * - Key qualifications (budget, timeline, documents)
 * - Readiness level and concerns
 *
 * @param messages - ARI conversation messages
 * @param context - ARI conversation context
 * @returns Summary string
 */
export function generateConversationSummary(
  messages: ARIMessage[],
  context: {
    lead_data?: Record<string, unknown>;
    score_breakdown?: ScoreBreakdown;
    lead_temperature?: LeadTemperature;
    form_answers?: Record<string, string>;
  }
): string {
  const parts: string[] = [];

  // Lead temperature and score
  if (context.lead_temperature && context.score_breakdown) {
    const temp = context.lead_temperature;
    const score = context.score_breakdown.total;
    parts.push(`Lead Score: ${score}/100 (${temp === 'hot' ? 'Hot' : temp === 'warm' ? 'Warm' : 'Cold'} lead)`);
  }

  // Form data summary
  const formData = context.form_answers || (context.lead_data as Record<string, string>) || {};
  const highlights: string[] = [];

  if (formData.country || formData.destination_country) {
    highlights.push(`Negara tujuan: ${formData.country || formData.destination_country}`);
  }
  if (formData.budget || formData.budget_range) {
    highlights.push(`Budget: ${formData.budget || formData.budget_range}`);
  }
  if (formData.timeline) {
    highlights.push(`Timeline: ${formData.timeline}`);
  }
  if (formData.english_level) {
    highlights.push(`English: ${formData.english_level}`);
  }

  if (highlights.length > 0) {
    parts.push('Key info: ' + highlights.join(', '));
  }

  // Extract key topics from messages
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.content.toLowerCase());

  const topicKeywords = {
    'universitas': 'Tanya universitas',
    'biaya': 'Tanya biaya',
    'beasiswa': 'Tertarik beasiswa',
    'visa': 'Tanya visa',
    'ielts': 'Perlu bantuan IELTS',
    'dokumen': 'Tanya dokumen',
  };

  const mentionedTopics: string[] = [];
  for (const [keyword, label] of Object.entries(topicKeywords)) {
    if (userMessages.some(msg => msg.includes(keyword))) {
      mentionedTopics.push(label);
    }
  }

  if (mentionedTopics.length > 0) {
    parts.push('Topik dibahas: ' + mentionedTopics.slice(0, 3).join(', '));
  }

  // Conversation length indicator
  const msgCount = messages.length;
  if (msgCount > 20) {
    parts.push('Percakapan panjang - lead sangat engaged');
  } else if (msgCount > 10) {
    parts.push('Percakapan aktif');
  }

  // Default if nothing extracted
  if (parts.length === 0) {
    return 'Lead dari WhatsApp via ARI. Lihat conversation history untuk detail.';
  }

  return parts.join('. ') + '.';
}

/**
 * Get consultation type tag name
 */
export function getConsultationTag(consultationType: 'consultation' | 'community' | 'cold_followup'): string {
  switch (consultationType) {
    case 'consultation':
      return '1on1';
    case 'community':
      return 'Community';
    case 'cold_followup':
      return 'Follow-up';
    default:
      return '1on1';
  }
}

// ===========================================
// Handoff Execution
// ===========================================

/**
 * Execute full handoff process
 *
 * 1. Generate conversation summary
 * 2. Update contact notes with summary
 * 3. Update lead status to hot_lead
 * 4. Add consultation type tag
 * 5. Set due date if appointment exists
 * 6. Create notification for consultant
 */
export async function executeHandoff(
  params: HandoffParams
): Promise<HandoffResult> {
  const {
    workspaceId,
    contactId,
    ariConversationId,
    appointmentId,
    consultationType,
    consultantId,
  } = params;

  try {
    // 1. Get ARI conversation with messages
    const ariConv = await convex.query(api.ari.getConversationWithMessages, {
      conversation_id: ariConversationId,
    });

    if (!ariConv) {
      console.error('[Handoff] Failed to get conversation');
      return { success: false, error: 'Conversation not found' };
    }

    // 2. Get contact for existing tags
    const contact = await convex.query(api.contacts.getByIdInternal, {
      contact_id: contactId,
    });

    if (!contact) {
      console.error('[Handoff] Failed to get contact');
      return { success: false, error: 'Contact not found' };
    }

    // 3. Generate summary
    const summary = generateConversationSummary(
      ariConv.messages || [],
      {
        lead_data: ariConv.context?.lead_data,
        score_breakdown: ariConv.context?.score_breakdown,
        lead_temperature: ariConv.lead_temperature,
        form_answers: ariConv.context?.form_answers,
      }
    );

    // 4. Build updated tags
    const existingTags = contact.tags || [];
    const consultationTag = getConsultationTag(consultationType);
    const newTags = existingTags.includes(consultationTag)
      ? existingTags
      : [...existingTags, consultationTag];

    // 5. Update contact
    await convex.mutation(api.mutations.updateContactForHandoff, {
      contact_id: contactId,
      tags: newTags,
      lead_status: 'hot_lead',
    });

    // 6. Create contact note with summary
    const timestamp = new Date().toLocaleString('id-ID', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const noteContent = `[ARI Summary - ${timestamp}]\n${summary}`;

    await convex.mutation(api.mutations.createContactNoteForHandoff, {
      workspace_id: workspaceId,
      contact_id: contactId,
      user_id: consultantId || 'system',
      content: noteContent,
    });

    // 7. Create notification for consultant (if assigned)
    if (consultantId) {
      await createConsultantNotification({
        workspaceId,
        consultantId,
        contactId,
        appointmentId,
        summary,
      });
    }

    console.log(`[Handoff] Completed for contact ${contactId}`);
    return { success: true, summary };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Handoff] Error:', error);
    return { success: false, error: message };
  }
}

// ===========================================
// Consultant Notification
// ===========================================

interface NotificationParams {
  workspaceId: string;
  consultantId: string;
  contactId: string;
  appointmentId?: string;
  summary: string;
}

/**
 * Create in-app notification for consultant
 *
 * Stores notifications in workspace_members.settings JSONB array.
 */
async function createConsultantNotification(
  params: NotificationParams
): Promise<void> {
  const { workspaceId, consultantId, contactId, appointmentId, summary } = params;

  // Get contact name for notification
  const contact = await convex.query(api.contacts.getByIdInternal, {
    contact_id: contactId,
  });

  const contactName = contact?.name || 'New lead';

  // Get current member settings
  const settings = (await convex.query(api.mutations.getWorkspaceMemberSettings, {
    workspace_id: workspaceId,
    user_id: consultantId,
  })) || {};

  const notifications = (settings.notifications || []) as Array<Record<string, unknown>>;

  // Add new notification
  notifications.unshift({
    id: crypto.randomUUID(),
    type: 'appointment_booked',
    title: `Konsultasi baru: ${contactName}`,
    message: summary.slice(0, 100) + (summary.length > 100 ? '...' : ''),
    contactId,
    appointmentId,
    read: false,
    createdAt: new Date().toISOString(),
  });

  // Keep only last 50 notifications
  const trimmedNotifications = notifications.slice(0, 50);

  await convex.mutation(api.mutations.updateWorkspaceMemberSettings, {
    workspace_id: workspaceId,
    user_id: consultantId,
    settings: { ...settings, notifications: trimmedNotifications },
  });

  console.log(`[Handoff] Created notification for consultant ${consultantId}`);
}
