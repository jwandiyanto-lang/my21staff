/**
 * User Migration Script: Supabase to Clerk
 *
 * This script migrates existing users from Supabase auth to Clerk,
 * preserving the Supabase UUID as external_id for ID mapping.
 *
 * Usage:
 *   npx tsx scripts/migrate-users-to-clerk.ts           # Full migration
 *   npx tsx scripts/migrate-users-to-clerk.ts --dry-run # Preview only
 *
 * Requirements:
 *   - CLERK_SECRET_KEY in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import { writeFileSync, mkdirSync, existsSync } from "fs";

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

// Jonathan's emails for super-admin flag (all known accounts)
const SUPER_ADMIN_EMAILS = [
  "jwandiyanto@gmail.com",
  "jonathan@",  // Any jonathan@ email
];

// Types
interface SupabaseUser {
  id: string;
  email: string | undefined;
  created_at: string;
  phone?: string;
  email_confirmed_at?: string;
  raw_user_meta_data?: Record<string, unknown>;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
}

interface MergedUser {
  supabaseId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  createdAt: string;
}

interface ClerkUserResponse {
  id: string;
  external_id: string | null;
  email_addresses: Array<{ email_address: string }>;
}

interface MigrationResult {
  supabaseId: string;
  clerkId: string;
  email: string;
  status: "created" | "skipped" | "error";
  error?: string;
}

interface IdMapping {
  [supabaseId: string]: string;
}

// Parse command line arguments
const isDryRun = process.argv.includes("--dry-run");

// Check if email is a super-admin email
function isSuperAdminEmail(email: string): boolean {
  const lowerEmail = email.toLowerCase();
  return SUPER_ADMIN_EMAILS.some(
    (adminEmail) =>
      lowerEmail === adminEmail.toLowerCase() ||
      (adminEmail.endsWith("@") && lowerEmail.startsWith(adminEmail.toLowerCase()))
  );
}

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

// Create Supabase admin client
function createSupabaseAdmin() {
  return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Fetch all users from Supabase auth
async function fetchSupabaseUsers(): Promise<SupabaseUser[]> {
  const supabase = createSupabaseAdmin();

  console.log("Fetching users from Supabase auth.users...");

  const { data, error } = await supabase.auth.admin.listUsers({
    perPage: 1000, // Adjust if more users expected
  });

  if (error) {
    throw new Error(`Failed to fetch Supabase users: ${error.message}`);
  }

  console.log(`Found ${data.users.length} users in auth.users`);
  return data.users as SupabaseUser[];
}

// Fetch all profiles from Supabase
async function fetchProfiles(): Promise<Map<string, Profile>> {
  const supabase = createSupabaseAdmin();

  console.log("Fetching user profiles from profiles table...");

  const { data, error } = await supabase.from("profiles").select("*");

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`);
  }

  const profileMap = new Map<string, Profile>();
  for (const profile of data || []) {
    profileMap.set(profile.id, profile);
  }

  console.log(`Found ${profileMap.size} profiles`);
  return profileMap;
}

// Merge auth users with profiles
function mergeUsersWithProfiles(
  users: SupabaseUser[],
  profiles: Map<string, Profile>
): MergedUser[] {
  const merged: MergedUser[] = [];

  for (const user of users) {
    // Skip users without email (shouldn't happen, but be safe)
    if (!user.email) {
      console.warn(`Skipping user ${user.id} - no email`);
      continue;
    }

    const profile = profiles.get(user.id);

    merged.push({
      supabaseId: user.id,
      email: user.email,
      fullName: profile?.full_name || null,
      avatarUrl: profile?.avatar_url || null,
      isAdmin: profile?.is_admin || false,
      createdAt: user.created_at,
    });
  }

  return merged;
}

// Parse full name into first and last name
function parseName(fullName: string | null): { firstName: string; lastName: string } {
  if (!fullName || fullName.trim() === "") {
    return { firstName: "", lastName: "" };
  }

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

// Check if user exists in Clerk by external_id
async function checkClerkUserByExternalId(
  externalId: string
): Promise<ClerkUserResponse | null> {
  const response = await fetch(
    `${CLERK_API_BASE}/users?external_id=${encodeURIComponent(externalId)}`,
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
    throw new Error(`Clerk API error (check): ${response.status} - ${text}`);
  }

  const users = await response.json();
  return users.length > 0 ? users[0] : null;
}

// Create user in Clerk
async function createClerkUser(user: MergedUser): Promise<MigrationResult> {
  const { firstName, lastName } = parseName(user.fullName);

  // Check if super-admin (Jonathan's email)
  const isSuperAdmin = isSuperAdminEmail(user.email);

  const publicMetadata = isSuperAdmin ? { superAdmin: true } : {};

  const body = {
    email_address: [user.email],
    external_id: user.supabaseId,
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    skip_password_requirement: true, // Users will use "Forgot Password" flow
    public_metadata: publicMetadata,
    created_at: user.createdAt, // Preserve original creation date
  };

  const response = await fetch(`${CLERK_API_BASE}/users`, {
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

  const clerkUser = await response.json();

  return {
    supabaseId: user.supabaseId,
    clerkId: clerkUser.id,
    email: user.email,
    status: "created",
  };
}

// Migrate a single user with retry logic
async function migrateUser(user: MergedUser): Promise<MigrationResult> {
  try {
    // Check if user already exists in Clerk (by external_id)
    const existingUser = await checkClerkUserByExternalId(user.supabaseId);

    if (existingUser) {
      console.log(`  [SKIP] ${user.email} - already exists in Clerk`);
      return {
        supabaseId: user.supabaseId,
        clerkId: existingUser.id,
        email: user.email,
        status: "skipped",
      };
    }

    // Create new user in Clerk
    const result = await createClerkUser(user);
    const isSuperAdmin = isSuperAdminEmail(user.email);
    const adminFlag = isSuperAdmin ? " [SUPER-ADMIN]" : "";
    console.log(`  [CREATE] ${user.email} -> ${result.clerkId}${adminFlag}`);
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  [ERROR] ${user.email}: ${errorMessage}`);
    return {
      supabaseId: user.supabaseId,
      clerkId: "",
      email: user.email,
      status: "error",
      error: errorMessage,
    };
  }
}

// Sleep helper for rate limiting
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main migration function
async function runMigration(): Promise<void> {
  console.log("\n========================================");
  console.log("  Supabase -> Clerk User Migration");
  console.log("========================================\n");

  if (isDryRun) {
    console.log("DRY RUN MODE - No changes will be made\n");
  }

  validateEnvironment();

  // Step 1: Fetch data from Supabase
  const authUsers = await fetchSupabaseUsers();
  const profiles = await fetchProfiles();
  const mergedUsers = mergeUsersWithProfiles(authUsers, profiles);

  console.log(`\nMerged ${mergedUsers.length} users for migration\n`);

  if (mergedUsers.length === 0) {
    console.log("No users to migrate. Exiting.");
    return;
  }

  // Display users to migrate
  console.log("Users to migrate:");
  console.log("-".repeat(60));
  for (const user of mergedUsers) {
    const isSuperAdmin = isSuperAdminEmail(user.email);
    const adminFlag = isSuperAdmin ? " [SUPER-ADMIN]" : "";
    console.log(`  ${user.email} (${user.supabaseId})${adminFlag}`);
    console.log(`    Name: ${user.fullName || "(none)"}`);
    console.log(`    Created: ${user.createdAt}`);
  }
  console.log("-".repeat(60));
  console.log();

  if (isDryRun) {
    console.log("DRY RUN COMPLETE - No users were created in Clerk.");
    console.log("\nTo run the actual migration, run without --dry-run flag.");
    return;
  }

  // Step 2: Migrate users to Clerk
  console.log("Starting migration to Clerk...\n");

  const results: MigrationResult[] = [];

  for (let i = 0; i < mergedUsers.length; i++) {
    const user = mergedUsers[i];
    console.log(`[${i + 1}/${mergedUsers.length}] Processing ${user.email}...`);

    const result = await migrateUser(user);
    results.push(result);

    // Rate limiting
    if (i < mergedUsers.length - 1) {
      await sleep(RATE_LIMIT_DELAY_MS);
    }
  }

  // Step 3: Generate mapping file
  const idMapping: IdMapping = {};
  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const result of results) {
    if (result.status === "created") {
      idMapping[result.supabaseId] = result.clerkId;
      created++;
    } else if (result.status === "skipped") {
      idMapping[result.supabaseId] = result.clerkId;
      skipped++;
    } else {
      errors++;
    }
  }

  // Save mapping file
  const mappingPath = ".planning/migrations/user-id-mapping.json";
  const mappingDir = ".planning/migrations";

  if (!existsSync(mappingDir)) {
    mkdirSync(mappingDir, { recursive: true });
  }

  writeFileSync(mappingPath, JSON.stringify(idMapping, null, 2));

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
    console.log("\nFailed users:");
    for (const result of results.filter((r) => r.status === "error")) {
      console.log(`  - ${result.email}: ${result.error}`);
    }
  }

  console.log("\n========================================\n");
}

// Run the migration
runMigration().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
