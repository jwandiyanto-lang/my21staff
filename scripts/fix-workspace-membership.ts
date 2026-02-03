/**
 * Fix Workspace Membership
 *
 * This script adds a workspace member record for a user to an existing workspace.
 * This fixes 403 errors when accessing workspace settings.
 *
 * Usage:
 *   npx tsx scripts/fix-workspace-membership.ts
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;
const WORKSPACE_SLUG = "my21staff-vpdfba";

async function main() {
  console.log("🔧 Fixing workspace membership...\n");

  // Create Convex client (no auth needed for this read)
  const convex = new ConvexHttpClient(CONVEX_URL);

  try {
    // 1. Get workspace by slug
    console.log(`📍 Looking up workspace: ${WORKSPACE_SLUG}`);
    const workspace = await convex.query(api.workspaces.getBySlug, {
      slug: WORKSPACE_SLUG,
    });

    if (!workspace) {
      console.error(`❌ Workspace not found: ${WORKSPACE_SLUG}`);
      process.exit(1);
    }

    console.log(`✅ Found workspace: ${workspace.name} (ID: ${workspace._id})\n`);

    // 2. Get current user from Clerk
    console.log("⚠️  You need to run this with authentication.");
    console.log("Please use the Convex dashboard console instead:\n");
    console.log("Go to: https://dashboard.convex.dev\n");
    console.log("Run this in the console:\n");
    console.log("```javascript");
    console.log(`const workspace = await ctx.db
  .query("workspaces")
  .filter(q => q.eq(q.field("slug"), "${WORKSPACE_SLUG}"))
  .first();

if (!workspace) {
  throw new Error("Workspace not found");
}

// Get your Clerk user ID from Settings page or Clerk dashboard
const userId = "YOUR_CLERK_USER_ID"; // Replace with your actual Clerk user ID

// Check if membership already exists
const existing = await ctx.db
  .query("workspaceMembers")
  .filter(q =>
    q.and(
      q.eq(q.field("workspace_id"), workspace._id),
      q.eq(q.field("user_id"), userId)
    )
  )
  .first();

if (existing) {
  return "Membership already exists!";
}

// Create workspace member record
const memberId = await ctx.db.insert("workspaceMembers", {
  workspace_id: workspace._id,
  user_id: userId,
  role: "owner",
  created_at: Date.now(),
});

return { success: true, memberId, workspaceId: workspace._id };
`);
    console.log("```\n");
    console.log("💡 To get your Clerk user ID:");
    console.log("   1. Open browser DevTools (F12)");
    console.log("   2. Go to Console");
    console.log("   3. Type: await Clerk.user.id");
    console.log("   4. Copy the result\n");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

main();
