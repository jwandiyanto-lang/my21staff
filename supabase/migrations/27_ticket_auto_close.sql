-- Migration: 27_ticket_auto_close.sql
-- Auto-close tickets 7 days after reaching Implementation stage
-- Part of Phase 04: Support Ticketing Core

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create auto-close function
CREATE OR REPLACE FUNCTION public.auto_close_tickets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ticket_record RECORD;
BEGIN
  -- Find tickets in 'implementation' stage for 7+ days that aren't already closed
  FOR ticket_record IN
    SELECT t.id, t.requester_id, t.workspace_id, t.title
    FROM tickets t
    WHERE t.stage = 'implementation'
    AND t.updated_at < NOW() - INTERVAL '7 days'
    AND t.closed_at IS NULL
  LOOP
    -- Generate placeholder reopen token (app layer will regenerate with proper HMAC)
    -- Using random hex as placeholder - actual token generated when sending email
    UPDATE tickets
    SET
      stage = 'closed',
      closed_at = NOW(),
      reopen_token = encode(gen_random_bytes(32), 'hex'),
      updated_at = NOW()
    WHERE id = ticket_record.id;

    -- Add status history entry
    INSERT INTO ticket_status_history (ticket_id, changed_by, from_stage, to_stage, reason)
    VALUES (
      ticket_record.id,
      ticket_record.requester_id,  -- System action attributed to requester
      'implementation',
      'closed',
      'Ditutup otomatis setelah 7 hari di tahap Implementasi'
    );

    -- Note: Email notification will be handled by a separate process
    -- that polls for newly auto-closed tickets (where closed_at > NOW() - 1 day)
    -- and sends the proper HMAC-signed reopen link
  END LOOP;
END;
$$;

-- Schedule daily at 00:00 UTC (07:00 WIB)
-- Using SELECT to wrap cron.schedule for Supabase compatibility
SELECT cron.schedule(
  'auto-close-tickets',
  '0 0 * * *',
  $$SELECT public.auto_close_tickets()$$
);

-- Comment explaining the job
COMMENT ON FUNCTION public.auto_close_tickets() IS
  'Automatically closes tickets that have been in implementation stage for 7+ days.
   Runs daily at midnight UTC via pg_cron.';
