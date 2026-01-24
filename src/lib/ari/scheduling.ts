/**
 * ARI Scheduling Module
 *
 * Handles slot availability calculation and appointment booking.
 * Converts weekly patterns (consultant_slots) into actual available
 * times for specific dates, respecting existing bookings.
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';
import type { ConsultantSlot, AvailableSlot, ARIAppointment } from './types';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ===========================================
// Indonesian Day Names
// ===========================================

const INDONESIAN_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

/**
 * Parse Indonesian day name to day_of_week number
 */
export function parseIndonesianDay(text: string): number | null {
  const normalized = text.toLowerCase().trim();
  const index = INDONESIAN_DAYS.findIndex(d => d.toLowerCase() === normalized);
  return index >= 0 ? index : null;
}

/**
 * Get Indonesian day name from day_of_week number
 */
export function getIndonesianDayName(dayOfWeek: number): string {
  return INDONESIAN_DAYS[dayOfWeek] || 'Unknown';
}

// ===========================================
// Slot Availability Functions
// ===========================================

/**
 * Get available slots for a workspace within the booking window
 *
 * @param workspaceId - Workspace ID
 * @param daysAhead - How many days ahead to look (default from slot config)
 * @returns Array of available slots
 */
export async function getAvailableSlots(
  workspaceId: string,
  daysAhead: number = 14
): Promise<AvailableSlot[]> {
  // Get active slot patterns
  const slotPatterns = await convex.query(api.ari.getConsultantSlots, {
    workspace_id: workspaceId,
  });

  if (!slotPatterns?.length) {
    console.log('[Scheduling] No active slots found');
    return [];
  }

  // Filter active slots
  const activeSlots = slotPatterns.filter((s: any) => s.is_active);

  if (!activeSlots.length) {
    console.log('[Scheduling] No active slots found');
    return [];
  }

  // Get existing appointments in the window
  const now = new Date();
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + daysAhead);

  const existingAppointments = await convex.query(api.ari.getWorkspaceAppointments, {
    workspace_id: workspaceId,
    from: now.getTime(),
    to: windowEnd.getTime(),
  });

  // Build set of booked times for quick lookup
  const bookedTimes = new Set(
    existingAppointments.map(a => new Date(a.scheduled_at).toISOString())
  );

  // Generate available slots for each day in window
  const availableSlots: AvailableSlot[] = [];

  for (let d = 1; d <= daysAhead; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    date.setHours(0, 0, 0, 0);

    const dayOfWeek = date.getDay();
    const dateStr = date.toISOString().split('T')[0];

    // Find slot patterns for this day
    const daySlots = activeSlots.filter(
      (s: any) => s.day_of_week === dayOfWeek
    );

    for (const slot of daySlots) {
      // Parse start/end times
      const [startHour, startMin] = (slot.start_time as string).split(':').map(Number);

      // Create appointment datetime (in WIB timezone for Indonesia)
      const appointmentTime = new Date(date);
      appointmentTime.setHours(startHour, startMin, 0, 0);

      // Check if already booked
      const isBooked = bookedTimes.has(appointmentTime.toISOString());

      // Only add if in future and not booked
      if (appointmentTime > now && !isBooked) {
        availableSlots.push({
          date: dateStr,
          day_of_week: dayOfWeek,
          start_time: slot.start_time as string,
          end_time: slot.end_time as string,
          duration_minutes: slot.duration_minutes,
          consultant_id: slot.consultant_id,
          slot_id: slot._id as string,  // Convex uses _id
          booked: false,
        });
      }
    }
  }

  // Sort by date and time
  availableSlots.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.start_time.localeCompare(b.start_time);
  });

  return availableSlots;
}

/**
 * Get available slots for a specific day of week
 */
export async function getSlotsForDay(
  workspaceId: string,
  dayOfWeek: number,
  daysAhead: number = 14
): Promise<AvailableSlot[]> {
  const allSlots = await getAvailableSlots(workspaceId, daysAhead);
  return allSlots.filter(s => s.day_of_week === dayOfWeek);
}

/**
 * Format available slots for a day into Indonesian message
 *
 * @example
 * "Untuk hari Senin ada slot:
 * 1. 20 Jan - 09:00 (60 menit)
 * 2. 20 Jan - 10:00 (60 menit)
 * 3. 27 Jan - 09:00 (60 menit)
 *
 * Pilih nomor atau ketik tanggal dan jam yang cocok."
 */
export function formatSlotsForDay(slots: AvailableSlot[]): string {
  if (slots.length === 0) {
    return 'Maaf, tidak ada slot tersedia untuk hari itu. Coba hari lain ya.';
  }

  const dayName = getIndonesianDayName(slots[0].day_of_week);
  const lines = [`Untuk hari ${dayName} ada slot:`];

  slots.slice(0, 5).forEach((slot, i) => {
    const date = new Date(slot.date);
    const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const time = slot.start_time.slice(0, 5);
    lines.push(`${i + 1}. ${dateStr} - ${time} (${slot.duration_minutes} menit)`);
  });

  if (slots.length > 5) {
    lines.push(`...dan ${slots.length - 5} slot lainnya.`);
  }

  lines.push('');
  lines.push('Pilih nomor atau ketik tanggal dan jam yang cocok.');

  return lines.join('\n');
}

/**
 * Format all available days into a summary
 */
export function formatAvailableDays(slots: AvailableSlot[]): string {
  // Group by day of week
  const byDay = new Map<number, number>();
  slots.forEach(s => {
    byDay.set(s.day_of_week, (byDay.get(s.day_of_week) || 0) + 1);
  });

  if (byDay.size === 0) {
    return 'Maaf, tidak ada jadwal konsultasi yang tersedia saat ini.';
  }

  const lines = ['Jadwal konsultasi yang tersedia:'];
  Array.from(byDay.entries())
    .sort((a, b) => a[0] - b[0])
    .forEach(([day, count]) => {
      lines.push(`- ${getIndonesianDayName(day)} (${count} slot)`);
    });

  lines.push('');
  lines.push('Hari apa yang cocok untuk kamu?');

  return lines.join('\n');
}

// ===========================================
// Booking Functions
// ===========================================

/**
 * Book an appointment for a contact
 */
export async function bookAppointment(
  params: {
    workspaceId: string;
    ariConversationId: string;
    slot: AvailableSlot;
    consultantId?: string | null;
    notes?: string;
  }
): Promise<ARIAppointment | null> {
  const { workspaceId, ariConversationId, slot, consultantId, notes } = params;

  // Build scheduled_at timestamp
  const [hour, min] = slot.start_time.split(':').map(Number);
  const scheduledAt = new Date(slot.date);
  scheduledAt.setHours(hour, min, 0, 0);

  // Insert appointment
  try {
    const appointment = await convex.mutation(api.ari.createAppointment, {
      workspace_id: workspaceId,
      ari_conversation_id: ariConversationId,
      consultant_id: consultantId || slot.consultant_id || undefined,
      scheduled_at: scheduledAt.getTime(),
      duration_minutes: slot.duration_minutes,
      notes: notes || undefined,
    });

    console.log(`[Scheduling] Booked appointment ${(appointment as any)?._id} for ${scheduledAt.toISOString()}`);
    return appointment as any as ARIAppointment;
  } catch (error) {
    console.error('[Scheduling] Failed to book appointment:', error);
    return null;
  }
}

/**
 * Format appointment confirmation message
 */
export function formatBookingConfirmation(
  slot: AvailableSlot,
  consultantName?: string
): string {
  const date = new Date(slot.date);
  const dateStr = date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const time = slot.start_time.slice(0, 5);

  let msg = `Oke, saya booking konsultasi untuk kamu:\n\n`;
  msg += `Tanggal: ${dateStr}\n`;
  msg += `Jam: ${time} WIB\n`;
  msg += `Durasi: ${slot.duration_minutes} menit\n`;
  if (consultantName) {
    msg += `Konsultan: ${consultantName}\n`;
  }
  msg += `\nLink meeting akan dikirim 1 jam sebelum jadwal. Sampai ketemu!`;

  return msg;
}

// ===========================================
// Slot Selection Parsing
// ===========================================

/**
 * Parse user's slot selection from message
 *
 * Handles:
 * - Number selection: "1", "2", "nomor 1"
 * - Date/time: "20 Januari jam 9", "besok pagi"
 *
 * Returns slot index (0-based) or null if can't parse
 */
export function parseSlotSelection(
  message: string,
  availableSlots: AvailableSlot[]
): number | null {
  const normalized = message.toLowerCase().trim();

  // Try number selection first
  const numMatch = normalized.match(/^(\d+)$|nomor\s*(\d+)|pilih\s*(\d+)/);
  if (numMatch) {
    const num = parseInt(numMatch[1] || numMatch[2] || numMatch[3]);
    if (num >= 1 && num <= availableSlots.length) {
      return num - 1; // Convert to 0-based index
    }
  }

  // Try to match by time keywords for first available slot
  if (/pagi|morning/.test(normalized)) {
    const morningSlot = availableSlots.findIndex(s => {
      const hour = parseInt(s.start_time.split(':')[0]);
      return hour >= 6 && hour < 12;
    });
    if (morningSlot >= 0) return morningSlot;
  }

  if (/siang|afternoon/.test(normalized)) {
    const afternoonSlot = availableSlots.findIndex(s => {
      const hour = parseInt(s.start_time.split(':')[0]);
      return hour >= 12 && hour < 17;
    });
    if (afternoonSlot >= 0) return afternoonSlot;
  }

  if (/sore|evening/.test(normalized)) {
    const eveningSlot = availableSlots.findIndex(s => {
      const hour = parseInt(s.start_time.split(':')[0]);
      return hour >= 17;
    });
    if (eveningSlot >= 0) return eveningSlot;
  }

  return null;
}
