/**
 * Create production workspace script
 *
 * Usage: CLERK_ORG_ID=org_xxx WORKSPACE_SLUG=slug npx tsx scripts/create-prod-workspace.ts
 */

import { convex } from '../convex/client.js';

async function createProdWorkspace() {
  const clerkOrgId = process.env.CLERK_ORG_ID;
  const workspaceSlug = process.env.WORKSPACE_SLUG;

  if (!clerkOrgId || !workspaceSlug) {
    console.error('Missing required env vars:');
    console.error('  CLERK_ORG_ID:', clerkOrgId || 'NOT SET');
    console.error('  WORKSPACE_SLUG:', workspaceSlug || 'NOT SET');
    console.error('\nUsage: CLERK_ORG_ID=org_xxx WORKSPACE_SLUG=slug npx tsx scripts/create-prod-workspace.ts');
    process.exit(1);
  }

  console.log('Creating production workspace...');
  console.log('  Clerk Org ID:', clerkOrgId);
  console.log('  Workspace Slug:', workspaceSlug);

  try {
    const workspaceId = await convex.mutation('workspaces:create', {
      name: 'My21staff Production',
      slug: workspaceSlug,
      owner_id: clerkOrgId,
    });

    console.log('\n✓ Workspace created successfully!');
    console.log('  Workspace ID:', workspaceId);
    console.log('\nNext steps:');
    console.log('  1. Go to Clerk Dashboard: https://dashboard.clerk.com');
    console.log('  2. Navigate to: Organizations > Your Organization > Configure');
    console.log('  3. In "Public Metadata", add:');
    console.log(`     convexWorkspaceId: ${workspaceId}`);
    console.log('  4. Save changes');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Failed to create workspace:', error);
    process.exit(1);
  }
}

createProdWorkspace();
