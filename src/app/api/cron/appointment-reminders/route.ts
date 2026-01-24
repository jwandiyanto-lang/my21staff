/**
 * Appointment Reminders Cron
 *
 * Called by Vercel Cron every 15 minutes to send meeting link
 * reminders for appointments starting in ~1 hour.
 *
 * Cron schedule: "0,15,30,45 * * * *" (every 15 min)
 */

import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/../convex/_generated/api';
import { sendMessage, type KapsoCredentials } from '@/lib/kapso/client';
import { safeDecrypt } from '@/lib/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: Request) {
  // Verify cron secret if configured
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find appointments starting in 45-75 minutes that haven't had reminder sent
    const now = Date.now();
    const windowStart = now + 45 * 60 * 1000; // 45 min from now
    const windowEnd = now + 75 * 60 * 1000;   // 75 min from now

    // Get appointments from Convex
    const appointments = await convex.query(api.ari.getUpcomingAppointments, {
      from: windowStart,
      to: windowEnd,
    });

    console.log(`[Cron] Found ${appointments?.length || 0} appointments needing reminders`);

    let sent = 0;
    let failed = 0;

    for (const apt of appointments || []) {
      try {
        // Get conversation to get contact_id (appointment links to conversation, not directly to contact)
        const conversation = await convex.query(api.ari.getConversationById, {
          conversation_id: apt.ari_conversation_id as string,
        }) as { contact_id: string; workspace_id: string } | null;

        if (!conversation) {
          console.log(`[Cron] Skipping ${apt._id} - conversation not found`);
          continue;
        }

        // Get related data: contact, workspace
        const [contact, workspace] = await Promise.all([
          convex.query(api.contacts.getByIdInternal, { contact_id: conversation.contact_id }),
          convex.query(api.workspaces.getById, { id: apt.workspace_id as string }),
        ]) as [{ phone: string } | null, { meta_access_token: string; kapso_phone_id: string } | null];

        if (!contact?.phone || !workspace?.meta_access_token) {
          console.log(`[Cron] Skipping ${apt._id} - missing phone or credentials`);
          continue;
        }

        // Build reminder message
        const aptTime = new Date(apt.scheduled_at);
        const timeStr = aptTime.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jakarta',
        });

        let message = `Reminder: Konsultasi kamu dimulai dalam 1 jam!\n\n`;
        message += `Waktu: ${timeStr} WIB\n`;
        message += `Durasi: ${apt.duration_minutes} menit\n`;

        if (apt.meeting_link) {
          message += `\nLink meeting: ${apt.meeting_link}`;
        } else {
          message += `\nKonsultan akan menghubungi kamu sebentar lagi.`;
        }

        // Send via Kapso
        const credentials: KapsoCredentials = {
          apiKey: safeDecrypt(workspace.meta_access_token as string),
          phoneId: workspace.kapso_phone_id as string,
        };

        await sendMessage(credentials, contact.phone, message);

        // Mark reminder as sent
        await convex.mutation(api.ari.markReminderSent, {
          appointment_id: apt._id,
        });

        sent++;
        console.log(`[Cron] Sent reminder for appointment ${apt._id}`);

      } catch (err) {
        console.error(`[Cron] Failed to send reminder for ${apt._id}:`, err);
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: appointments?.length || 0,
    });
  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json({ error: 'Failed to process reminders' }, { status: 500 });
  }
}
