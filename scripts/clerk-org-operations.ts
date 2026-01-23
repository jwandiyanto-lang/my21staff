/**
 * Clerk Organization Operations
 *
 * Quick script to delete My21Staff org and create Eagle Overseas org.
 * Based on user decision: eagle-only approach for Clerk free plan limit.
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const CLERK_API_BASE = "https://api.clerk.com/v1";

// Configuration based on user decision
const MY21STAFF_ORG_ID = "org_38fWul9gXlHsVjtRsC0uAvwZCbI";
const EAGLE_WORKSPACE_ID = "25de3c4e-b9ca-4aff-9639-b35668f0a48a";
const JONATHAN_CLERK_ID = "user_38fViPWAnLiNth62ZaAJj3PQDWU";
const JONATHAN_SUPABASE_ID = "d7012f0e-54a7-4013-9dfa-f63057040c08";

async function listOrgs(): Promise<void> {
  console.log("\n--- Listing existing organizations ---\n");

  const response = await fetch(`${CLERK_API_BASE}/organizations`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error listing orgs:", data);
    return;
  }

  if (data.data && data.data.length > 0) {
    console.log(`Found ${data.data.length} organization(s):`);
    for (const org of data.data) {
      console.log(`  - ${org.name} (${org.id})`);
    }
  } else {
    console.log("No organizations found.");
  }
}

async function deleteOrg(orgId: string): Promise<boolean> {
  console.log(`\n--- Deleting organization: ${orgId} ---\n`);

  const response = await fetch(`${CLERK_API_BASE}/organizations/${orgId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    console.log("Organization deleted successfully.");
    return true;
  } else {
    const data = await response.json();
    console.log("Delete response:", response.status, data);
    // 404 means already deleted, which is fine
    if (response.status === 404) {
      console.log("Organization was already deleted or doesn't exist.");
      return true;
    }
    return false;
  }
}

async function createEagleOrg(): Promise<string | null> {
  console.log("\n--- Creating Eagle Overseas organization ---\n");

  const body = {
    name: "Eagle Overseas - 21",
    created_by: JONATHAN_CLERK_ID,
    public_metadata: {
      supabaseWorkspaceId: EAGLE_WORKSPACE_ID,
      supabaseOwnerId: JONATHAN_SUPABASE_ID,
      workspaceType: "client",
      originalWorkspaceSlug: "eagle-overseas",
    },
  };

  console.log("Creating with body:", JSON.stringify(body, null, 2));

  const response = await fetch(`${CLERK_API_BASE}/organizations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error creating org:", data);
    return null;
  }

  console.log("Organization created successfully:");
  console.log(`  ID: ${data.id}`);
  console.log(`  Name: ${data.name}`);
  console.log(`  Slug: ${data.slug}`);

  return data.id;
}

async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("  Clerk Organization Operations - Eagle Only Migration");
  console.log("=".repeat(60));

  if (!CLERK_SECRET_KEY) {
    console.error("CLERK_SECRET_KEY not found in environment");
    process.exit(1);
  }

  // Step 1: List current organizations
  await listOrgs();

  // Step 2: Delete My21Staff org (if exists)
  await deleteOrg(MY21STAFF_ORG_ID);

  // Step 3: Create Eagle Overseas org
  const eagleOrgId = await createEagleOrg();

  if (!eagleOrgId) {
    console.error("\nFailed to create Eagle Overseas organization.");
    process.exit(1);
  }

  // Step 4: List final state
  await listOrgs();

  // Step 5: Output mapping JSON
  console.log("\n--- Workspace-Org Mapping ---\n");
  console.log(JSON.stringify({ [EAGLE_WORKSPACE_ID]: eagleOrgId }, null, 2));

  // Step 6: Save mapping to file
  const fs = await import("fs");
  const mappingPath = ".planning/migrations/workspace-org-mapping.json";
  const mapping = { [EAGLE_WORKSPACE_ID]: eagleOrgId };
  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2));
  console.log(`\nMapping saved to: ${mappingPath}`);

  console.log("\n" + "=".repeat(60));
  console.log("  Migration Complete - Eagle Overseas Only");
  console.log("=".repeat(60));
  console.log("\nNote: My21Staff workspace remains in Supabase (not converted to org).");
  console.log("Can add My21Staff org later after Clerk plan upgrade.\n");
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
