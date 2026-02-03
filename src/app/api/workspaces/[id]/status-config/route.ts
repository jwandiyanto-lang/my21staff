import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";
import { DEFAULT_LEAD_STATUSES } from "@/lib/lead-status";
import { getMockWorkspaceSettings, updateMockWorkspaceSettings } from "@/lib/mock-data";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function isDevMode(): boolean {
  return process.env.NEXT_PUBLIC_DEV_MODE === 'true'
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Dev mode: return statuses from runtime mock settings
  if (isDevMode()) {
    const mockSettings = getMockWorkspaceSettings();
    return NextResponse.json(mockSettings?.lead_statuses || DEFAULT_LEAD_STATUSES);
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: workspaceSlug } = await params;

    // Fetch workspace by slug to get Convex ID
    const workspace = await convex.query(api.workspaces.getBySlug, {
      slug: workspaceSlug
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const statusConfig = await convex.query(api.workspaces.getStatusConfig, {
      workspaceId: workspace._id,
    });

    return NextResponse.json(statusConfig);
  } catch (error) {
    console.error("[GET status-config] Error:", error);
    return NextResponse.json(
      { error: "Failed to get status config" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Dev mode: update runtime mock settings
  if (isDevMode()) {
    const body = await request.json();
    const { leadStatuses } = body;

    if (Array.isArray(leadStatuses)) {
      updateMockWorkspaceSettings({ lead_statuses: leadStatuses });
    }

    return NextResponse.json({ success: true });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: workspaceSlug } = await params;
    const body = await request.json();
    const { leadStatuses } = body;

    if (!Array.isArray(leadStatuses)) {
      return NextResponse.json(
        { error: "leadStatuses must be an array" },
        { status: 400 }
      );
    }

    // Fetch workspace by slug to get Convex ID
    const workspace = await convex.query(api.workspaces.getBySlug, {
      slug: workspaceSlug
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    await convex.mutation(api.workspaces.updateStatusConfig, {
      workspaceId: workspace._id,
      leadStatuses,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PUT status-config] Error:", error);
    return NextResponse.json(
      { error: "Failed to update status config" },
      { status: 500 }
    );
  }
}
