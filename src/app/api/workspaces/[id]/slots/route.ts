/**
 * Consultant Slots API
 * GET - List all slots for workspace
 * POST - Create new slot
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ConsultantSlotInsert } from '@/lib/ari/types';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/workspaces/[id]/slots
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: workspaceId } = await params;
  const supabase = await createClient();

  // Verify user has access to workspace
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get slots with consultant profile info
  const { data: slots, error } = await supabase
    .from('consultant_slots')
    .select(`
      *,
      consultant:consultant_id (
        id,
        email,
        full_name
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Failed to fetch slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }

  return NextResponse.json({ slots });
}

// POST /api/workspaces/[id]/slots
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id: workspaceId } = await params;
  const supabase = await createClient();

  // Verify user has access
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Validate required fields
  if (body.day_of_week === undefined || !body.start_time || !body.end_time) {
    return NextResponse.json(
      { error: 'day_of_week, start_time, and end_time are required' },
      { status: 400 }
    );
  }

  const slotData: ConsultantSlotInsert = {
    workspace_id: workspaceId,
    consultant_id: body.consultant_id || null,
    day_of_week: body.day_of_week,
    start_time: body.start_time,
    end_time: body.end_time,
    duration_minutes: body.duration_minutes || 60,
    booking_window_days: body.booking_window_days || 14,
    max_bookings_per_slot: body.max_bookings_per_slot || 1,
    is_active: body.is_active ?? true,
  };

  const { data: slot, error } = await supabase
    .from('consultant_slots')
    .insert(slotData)
    .select()
    .single();

  if (error) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Slot already exists for this day and time' },
        { status: 409 }
      );
    }
    console.error('Failed to create slot:', error);
    return NextResponse.json({ error: 'Failed to create slot' }, { status: 500 });
  }

  return NextResponse.json({ slot }, { status: 201 });
}
