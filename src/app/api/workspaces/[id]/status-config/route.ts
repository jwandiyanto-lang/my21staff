import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LEAD_STATUSES } from "@/lib/lead-status";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Always return fixed 4 statuses (no workspace lookup needed)
  return NextResponse.json(DEFAULT_LEAD_STATUSES);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // No-op: statuses are now fixed and not customizable
  // Kept for backward compatibility
  return NextResponse.json({ success: true });
}
