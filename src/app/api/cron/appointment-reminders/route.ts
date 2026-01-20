/**
 * Appointment Reminders Cron
 *
 * Called by Vercel Cron every 15 minutes to send meeting link
 * reminders for appointments starting in ~1 hour.
 *
 * Cron schedule: "0,15,30,45 * * * *" (every 15 min)
 */

import { NextResponse } from 'next/server';
import { createApiAdminClient } from '@/lib/supabase/server';
import { sendMessage, type KapsoCredentials } from '@/lib/kapso/client';
import { safeDecrypt } from '@/lib/crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(request: Request) {
  // Verify cron secret if configured
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createApiAdminClient();

  // Find appointments starting in 45-75 minutes that haven't had reminder sent
  const now = new Date();
  const windowStart = new Date(now.getTime() + 45 * 60 * 1000); // 45 min from now
  const windowEnd = new Date(now.getTime() + 75 * 60 * 1000);   // 75 min from now

  // Get appointments with their related contact phone and workspace credentials
  // Use explicit foreign key references for nested joins
  const { data: appointments, error } = await supabase
    .from('ari_appointments')
    .select(`
      id,
      workspace_id,
      ari_conversation_id,
      scheduled_at,
      duration_minutes,
      meeting_link,
      status,
      ari_conversations!inner (
        contact_id,
        contacts:contact_id (
          phone
        )
      ),
      workspaces!inner (
        meta_access_token,
        kapso_phone_id
      )
    `)
    .gte('scheduled_at', windowStart.toISOString())
    .lte('scheduled_at', windowEnd.toISOString())
    .is('reminder_sent_at', null)
    .in('status', ['scheduled', 'confirmed']);

  if (error) {
    console.error('[Cron] Failed to fetch appointments:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }

  console.log(`[Cron] Found ${appointments?.length || 0} appointments needing reminders`);

  let sent = 0;
  let failed = 0;

  for (const apt of appointments || []) {
    try {
      // Extract nested data - contacts is now nested under ari_conversations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ariConv = apt.ari_conversations as any;
      const contact = ariConv?.contacts;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const workspace = apt.workspaces as any;

      if (!contact?.phone || !workspace?.meta_access_token) {
        console.log(`[Cron] Skipping ${apt.id} - missing phone or credentials`);
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
        apiKey: safeDecrypt(workspace.meta_access_token),
        phoneId: workspace.kapso_phone_id,
      };

      await sendMessage(credentials, contact.phone, message);

      // Mark reminder as sent
      await supabase
        .from('ari_appointments')
        .update({
          reminder_sent_at: new Date().toISOString(),
          status: 'confirmed', // Upgrade from scheduled to confirmed
        })
        .eq('id', apt.id);

      sent++;
      console.log(`[Cron] Sent reminder for appointment ${apt.id}`);

    } catch (err) {
      console.error(`[Cron] Failed to send reminder for ${apt.id}:`, err);
      failed++;
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: appointments?.length || 0,
  });
}
