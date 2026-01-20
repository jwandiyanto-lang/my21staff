/**
 * ARI Handoff Module
 *
 * Handles the transition from ARI conversation to human consultant.
 * Generates conversation summary, updates contact status and tags,
 * and notifies the assigned consultant.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ARIMessage, LeadTemperature, ScoreBreakdown } from './types';

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
  supabase: SupabaseClient,
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
    const { data: ariConv, error: convError } = await supabase
      .from('ari_conversations')
      .select('*, ari_messages(*)')
      .eq('id', ariConversationId)
      .single();

    if (convError || !ariConv) {
      console.error('[Handoff] Failed to get conversation:', convError);
      return { success: false, error: 'Conversation not found' };
    }

    // 2. Get contact for existing notes
    const { data: contact } = await supabase
      .from('contacts')
      .select('notes, tags, metadata')
      .eq('id', contactId)
      .single();

    // 3. Generate summary
    const summary = generateConversationSummary(
      ariConv.ari_messages || [],
      {
        lead_data: ariConv.context?.lead_data,
        score_breakdown: ariConv.context?.score_breakdown,
        lead_temperature: ariConv.lead_temperature,
        form_answers: ariConv.context?.form_answers,
      }
    );

    // 4. Build updated notes
    const timestamp = new Date().toLocaleString('id-ID', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const existingNotes = contact?.notes || '';
    const newNotes = existingNotes
      ? `${existingNotes}\n\n---\n[ARI Summary - ${timestamp}]\n${summary}`
      : `[ARI Summary - ${timestamp}]\n${summary}`;

    // 5. Build updated tags
    const existingTags = contact?.tags || [];
    const consultationTag = getConsultationTag(consultationType);
    const newTags = existingTags.includes(consultationTag)
      ? existingTags
      : [...existingTags, consultationTag];

    // 6. Get appointment date for due_date
    let dueDate: string | null = null;
    if (appointmentId) {
      const { data: appointment } = await supabase
        .from('ari_appointments')
        .select('scheduled_at')
        .eq('id', appointmentId)
        .single();

      if (appointment) {
        dueDate = appointment.scheduled_at.split('T')[0]; // YYYY-MM-DD
      }
    }

    // 7. Update contact
    const updateData: Record<string, unknown> = {
      notes: newNotes,
      tags: newTags,
      lead_status: 'hot_lead',
      updated_at: new Date().toISOString(),
    };

    if (dueDate) {
      updateData.due_date = dueDate;
    }

    const { error: updateError } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contactId);

    if (updateError) {
      console.error('[Handoff] Failed to update contact:', updateError);
      return { success: false, error: 'Failed to update contact' };
    }

    // 8. Create notification for consultant (if assigned)
    if (consultantId) {
      await createConsultantNotification(supabase, {
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
 * Uses workspace_notifications table (or creates if not exists).
 * Falls back to storing in a notifications array in workspace_members.settings.
 */
async function createConsultantNotification(
  supabase: SupabaseClient,
  params: NotificationParams
): Promise<void> {
  const { workspaceId, consultantId, contactId, appointmentId, summary } = params;

  // Get contact name for notification
  const { data: contact } = await supabase
    .from('contacts')
    .select('name')
    .eq('id', contactId)
    .single();

  const contactName = contact?.name || 'New lead';

  // Try to create notification in workspace_members settings
  // This is a simple approach - store notifications in JSONB array
  const { data: member } = await supabase
    .from('workspace_members')
    .select('settings')
    .eq('workspace_id', workspaceId)
    .eq('user_id', consultantId)
    .single();

  const settings = (member?.settings || {}) as Record<string, unknown>;
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

  await supabase
    .from('workspace_members')
    .update({
      settings: { ...settings, notifications: trimmedNotifications },
    })
    .eq('workspace_id', workspaceId)
    .eq('user_id', consultantId);

  console.log(`[Handoff] Created notification for consultant ${consultantId}`);
}
