/**
 * Workspace to Organization Migration Script
 *
 * Converts existing Supabase workspaces to Clerk organizations,
 * preserving workspace metadata and establishing ownership.
 *
 * Usage:
 *   npx tsx scripts/migrate-workspaces-to-orgs.ts           # Full migration
 *   npx tsx scripts/migrate-workspaces-to-orgs.ts --dry-run # Preview only
 *
 * Requirements:
 *   - CLERK_SECRET_KEY in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - .planning/migrations/user-id-mapping.json (from 04-01 migration)
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\\n$/, "").trim();
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

// Clerk API base URL
const CLERK_API_BASE = "https://api.clerk.com/v1";

// Rate limiting: Clerk has 20 req/sec limit, we'll use 10 to be safe
const RATE_LIMIT_DELAY_MS = 100;

// Types
interface SupabaseWorkspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  kapso_phone_id: string | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  workspace_type: string;
}

interface UserIdMapping {
  [supabaseId: string]: string;
}

interface ClerkOrganization {
  id: string;
  name: string;
  slug: string;
  created_by: string;
  public_metadata: Record<string, unknown>;
}

interface MigrationResult {
  workspaceId: string;
  workspaceName: string;
  clerkOrgId: string;
  status: "created" | "skipped" | "error";
  error?: string;
}

interface WorkspaceOrgMapping {
  [workspaceId: string]: string;
}

// Parse command line arguments
const isDryRun = process.argv.includes("--dry-run");

// Validate environment
function validateEnvironment(): void {
  const missing: string[] = [];

  if (!SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!CLERK_SECRET_KEY) missing.push("CLERK_SECRET_KEY");

  if (missing.length > 0) {
    console.error("Missing required environment variables:");
    missing.forEach((v) => console.error(`  - ${v}`));
    process.exit(1);
  }
}

// Load user ID mapping from previous migration
function loadUserIdMapping(): UserIdMapping {
  const mappingPath = ".planning/migrations/user-id-mapping.json";

  if (!existsSync(mappingPath)) {
    console.error(`User ID mapping file not found: ${mappingPath}`);
    console.error("Please run the user migration script first (scripts/migrate-users-to-clerk.ts)");
    process.exit(1);
  }

  const content = readFileSync(mappingPath, "utf-8");
  return JSON.parse(content);
}

// Create Supabase admin client
function createSupabaseAdmin() {
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Fetch all workspaces from Supabase
async function fetchWorkspaces(): Promise<SupabaseWorkspace[]> {
  const supabase = createSupabaseAdmin();

  console.log("Fetching workspaces from Supabase...");

  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, slug, owner_id, kapso_phone_id, settings, created_at, workspace_type");

  if (error) {
    throw new Error(`Failed to fetch workspaces: ${error.message}`);
  }

  console.log(`Found ${data?.length || 0} workspaces`);
  return data || [];
}

// Check if organization exists by name (slug feature not enabled)
async function checkOrgByName(name: string): Promise<ClerkOrganization | null> {
  const response = await fetch(
    `${CLERK_API_BASE}/organizations?query=${encodeURIComponent(name)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Clerk API error (check org): ${response.status} - ${text}`);
  }

  const result = await response.json();
  // Check for exact name match (query is fuzzy search)
  const exactMatch = result.data?.find((org: ClerkOrganization) => org.name === name);
  return exactMatch || null;
}

// Create organization in Clerk
async function createClerkOrganization(
  workspace: SupabaseWorkspace,
  jonathanClerkId: string
): Promise<MigrationResult> {
  // Organization name format: "[Business Name] - 21"
  const orgName = `${workspace.name} - 21`;

  // Public metadata includes Supabase workspace ID for migration reference
  // Note: Include original workspace slug for reference (org slugs not enabled in Clerk)
  const publicMetadata = {
    supabaseWorkspaceId: workspace.id,
    supabaseOwnerId: workspace.owner_id,
    workspaceType: workspace.workspace_type,
    originalWorkspaceSlug: workspace.slug,
  };

  // Note: slug parameter removed - Clerk organization slugs feature not enabled
  // Clerk will auto-generate slugs based on the organization name
  const body = {
    name: orgName,
    created_by: jonathanClerkId,
    public_metadata: publicMetadata,
  };

  const response = await fetch(`${CLERK_API_BASE}/organizations`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.errors?.[0]?.message ||
      errorData.message ||
      `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  const org = await response.json();

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    clerkOrgId: org.id,
    status: "created",
  };
}

// Sleep helper for rate limiting
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Migrate a single workspace
async function migrateWorkspace(
  workspace: SupabaseWorkspace,
  jonathanClerkId: string
): Promise<MigrationResult> {
  try {
    // Check if org already exists by name (slug feature not enabled in Clerk)
    const orgName = `${workspace.name} - 21`;
    const existingOrg = await checkOrgByName(orgName);

    if (existingOrg) {
      console.log(`  [SKIP] ${workspace.name} - organization already exists (${existingOrg.id})`);
      return {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        clerkOrgId: existingOrg.id,
        status: "skipped",
      };
    }

    // Create new organization
    const result = await createClerkOrganization(workspace, jonathanClerkId);
    console.log(`  [CREATE] ${workspace.name} -> ${result.clerkOrgId}`);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  [ERROR] ${workspace.name}: ${errorMessage}`);
    return {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      clerkOrgId: "",
      status: "error",
      error: errorMessage,
    };
  }
}

// Find Jonathan's Clerk ID from the mapping
function findJonathanClerkId(
  userMapping: UserIdMapping,
  workspaces: SupabaseWorkspace[]
): string | null {
  // Jonathan owns all workspaces in our system
  // Find the owner_id that appears most frequently (should be Jonathan)
  const ownerCounts = new Map<string, number>();
  for (const ws of workspaces) {
    const count = ownerCounts.get(ws.owner_id) || 0;
    ownerCounts.set(ws.owner_id, count + 1);
  }

  // Get the most common owner (should be Jonathan)
  let jonathanSupabaseId: string | null = null;
  let maxCount = 0;
  for (const [ownerId, count] of ownerCounts) {
    if (count > maxCount) {
      maxCount = count;
      jonathanSupabaseId = ownerId;
    }
  }

  if (!jonathanSupabaseId) {
    return null;
  }

  // Look up the Clerk ID
  return userMapping[jonathanSupabaseId] || null;
}

// Main migration function
async function runMigration(): Promise<void> {
  console.log("\n========================================");
  console.log("  Workspace -> Clerk Organization Migration");
  console.log("========================================\n");

  if (isDryRun) {
    console.log("DRY RUN MODE - No changes will be made\n");
  }

  validateEnvironment();

  // Load user ID mapping
  const userMapping = loadUserIdMapping();
  console.log(`Loaded user ID mapping (${Object.keys(userMapping).length} users)\n`);

  // Fetch workspaces from Supabase
  const workspaces = await fetchWorkspaces();

  if (workspaces.length === 0) {
    console.log("No workspaces to migrate. Exiting.");
    return;
  }

  // Find Jonathan's Clerk ID
  const jonathanClerkId = findJonathanClerkId(userMapping, workspaces);

  if (!jonathanClerkId) {
    console.error("Could not find Jonathan's Clerk ID in the user mapping.");
    console.error("Please ensure the user migration was completed successfully.");
    process.exit(1);
  }

  console.log(`Jonathan's Clerk ID: ${jonathanClerkId}\n`);

  // Display workspaces to migrate
  console.log("Workspaces to migrate:");
  console.log("-".repeat(70));
  for (const ws of workspaces) {
    const orgName = `${ws.name} - 21`;
    console.log(`  ${ws.name} (${ws.id})`);
    console.log(`    Slug: ${ws.slug}`);
    console.log(`    Type: ${ws.workspace_type}`);
    console.log(`    Org name will be: "${orgName}"`);
    console.log(`    Owner: ${ws.owner_id} -> ${userMapping[ws.owner_id] || "NOT FOUND"}`);
  }
  console.log("-".repeat(70));
  console.log();

  if (isDryRun) {
    console.log("DRY RUN COMPLETE - No organizations were created in Clerk.");
    console.log("\nTo run the actual migration, run without --dry-run flag.");
    return;
  }

  // Migrate workspaces to Clerk organizations
  console.log("Starting migration to Clerk...\n");

  const results: MigrationResult[] = [];

  for (let i = 0; i < workspaces.length; i++) {
    const workspace = workspaces[i];
    console.log(`[${i + 1}/${workspaces.length}] Processing ${workspace.name}...`);

    const result = await migrateWorkspace(workspace, jonathanClerkId);
    results.push(result);

    // Rate limiting
    if (i < workspaces.length - 1) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  // Generate mapping file
  const workspaceOrgMapping: WorkspaceOrgMapping = {};
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const result of results) {
    if (result.status === "created") {
      workspaceOrgMapping[result.workspaceId] = result.clerkOrgId;
      created++;
    } else if (result.status === "skipped") {
      workspaceOrgMapping[result.workspaceId] = result.clerkOrgId;
      skipped++;
    } else {
      errors++;
    }
  }

  // Save mapping file
  const mappingPath = ".planning/migrations/workspace-org-mapping.json";
  const mappingDir = ".planning/migrations";

  if (!existsSync(mappingDir)) {
    mkdirSync(mappingDir, { recursive: true });
  }

  writeFileSync(mappingPath, JSON.stringify(workspaceOrgMapping, null, 2));

  // Summary
  console.log("\n========================================");
  console.log("  Migration Summary");
  console.log("========================================");
  console.log(`  Created: ${created}`);
  console.log(`  Skipped (already exist): ${skipped}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total processed: ${results.length}`);
  console.log(`\n  Mapping saved to: ${mappingPath}`);

  if (errors > 0) {
    console.log("\nFailed workspaces:");
    for (const result of results.filter((r) => r.status === "error")) {
      console.log(`  - ${result.workspaceName}: ${result.error}`);
    }
  }

  // Display created organizations
  if (created > 0 || skipped > 0) {
    console.log("\nOrganizations in Clerk:");
    for (const result of results.filter((r) => r.status !== "error")) {
      console.log(`  - ${result.workspaceName} -> ${result.clerkOrgId}`);
    }
  }

  console.log("\n========================================\n");
}

// Run the migration
runMigration().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
