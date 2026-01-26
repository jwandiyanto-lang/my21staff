import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/../convex/_generated/api";
import { Id } from "@/../convex/_generated/dataModel";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const statusConfig = await convex.query(api.workspaces.getStatusConfig, {
      workspaceId: id as Id<"workspaces">,
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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { leadStatuses } = body;

    if (!Array.isArray(leadStatuses)) {
      return NextResponse.json(
        { error: "leadStatuses must be an array" },
        { status: 400 }
      );
    }

    await convex.mutation(api.workspaces.updateStatusConfig, {
      workspaceId: id as Id<"workspaces">,
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
