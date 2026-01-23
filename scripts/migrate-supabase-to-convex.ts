/**
 * Data Migration Script: Supabase to Convex (Remaining Tables)
 *
 * This script performs a one-time bulk transfer of all remaining Supabase data
 * to Convex. It migrates 12 tables (ARI extended features, CMS content, consultant slots).
 *
 * Tables Migrated:
 * - ARI: ari_destinations, ari_payments, ari_appointments, ari_ai_comparison,
 *        ari_flow_stages, ari_knowledge_categories, ari_knowledge_entries,
 *        ari_scoring_config
 * - CMS: articles, webinars, webinar_registrations
 * - Scheduling: consultant_slots
 *
 * ID Mapping Strategy:
 * - workspace_id: Look up by slug (already migrated)
 * - contact_id: Look up by phone+workspace (already migrated)
 * - ari_conversation_id: Look up by contact+workspace (already migrated)
 * - category_id: Built during ariKnowledgeCategories migration
 * - webinar_id: Built during webinars migration
 *
 * Usage:
 *   npx tsx scripts/migrate-supabase-to-convex.ts
 *
 * Requirements:
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - NEXT_PUBLIC_CONVEX_URL in .env.local
 *   - .planning/migrations/workspace-org-mapping.json must exist
 */

import { createClient } from "@supabase/supabase-js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import { config } from "dotenv";
import { resolve } from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

// Types
interface WorkspaceMapping {
  [supabaseId: string]: string; // supabaseId -> clerkOrgId
}

interface TableReport {
  table: string;
  source: number;
  migrated: number;
  skipped: number;
  errors: string[];
}

interface MigrationReport {
  timestamp: string;
  duration_seconds?: number;
  tables: Record<string, TableReport>;
}

// Validate environment
function validateEnvironment(): void {
  if (!SUPABASE_URL) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
    process.exit(1);
  }
  if (!SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }
  if (!CONVEX_URL) {
    console.error("Missing NEXT_PUBLIC_CONVEX_URL in .env.local");
    process.exit(1);
  }
}

// Load workspace mapping (needed to get workspace slugs)
function loadWorkspaceMapping(): WorkspaceMapping {
  const mappingPath = ".planning/migrations/workspace-org-mapping.json";

  if (!existsSync(mappingPath)) {
    console.error(`Mapping file not found: ${mappingPath}`);
    console.error("Run 04-02 plan first to generate workspace-org-mapping.json");
    process.exit(1);
  }

  const content = readFileSync(mappingPath, "utf-8");
  return JSON.parse(content);
}

// Get workspace slug from Supabase ID
async function getWorkspaceSlug(
  supabase: any,
  workspaceId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("workspaces")
    .select("slug")
    .eq("id", workspaceId)
    .single();

  if (error || !data) return null;
  return data.slug;
}

// Get contact phone from Supabase ID
async function getContactPhone(
  supabase: any,
  contactId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("contacts")
    .select("phone")
    .eq("id", contactId)
    .single();

  if (error || !data) return null;
  return data.phone;
}

// Call Convex mutation via ConvexHttpClient
async function callConvexMutation(
  client: ConvexHttpClient,
  mutationName: string,
  args: any
): Promise<any> {
  const mutation = (api.migrate as any)[mutationName];
  const result = await client.mutation(mutation, args);
  return result;
}

// Migrate ARI Destinations
async function migrateAriDestinations(
  client: ConvexHttpClient,
  supabase: any,
  report: MigrationReport
): Promise<void> {
  console.log("\n[1/12] Migrating ari_destinations...");

  const tableReport: TableReport = {
    table: "ari_destinations",
    source: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Fetch all records
    const { data: records, error } = await supabase
      .from("ari_destinations")
      .select("*");

    if (error) throw error;

    tableReport.source = records?.length || 0;
    console.log(`  Found ${tableReport.source} records`);

    if (records && records.length > 0) {
      // Transform for Convex
      const convexRecords = await Promise.all(
        records.map(async (r: any) => {
          const workspace_slug = await getWorkspaceSlug(supabase, r.workspace_id);
          return {
            workspace_slug: workspace_slug || "",
            country: r.country,
            city: r.city,
            university_name: r.university_name,
            requirements: r.requirements,
            programs: r.programs,
            is_promoted: r.is_promoted,
            priority: r.priority,
            notes: r.notes,
            created_at: new Date(r.created_at).getTime(),
            updated_at: new Date(r.updated_at).getTime(),
            supabaseId: r.id,
          };
        })
      );

      // Call Convex mutation
      const result = await callConvexMutation(client, "bulkInsertAriDestinations", {
        records: convexRecords,
      });

      tableReport.migrated = result.inserted;
      tableReport.skipped = result.skipped;
    }

    console.log(`  ✓ Migrated: ${tableReport.migrated}, Skipped: ${tableReport.skipped}`);
  } catch (error: any) {
    tableReport.errors.push(error.message);
    console.error(`  ✗ Error: ${error.message}`);
  }

  report.tables["ari_destinations"] = tableReport;
}

// Migrate ARI Payments
async function migrateAriPayments(client: ConvexHttpClient, 
  supabase: any,
  report: MigrationReport
): Promise<void> {
  console.log("\n[2/12] Migrating ari_payments...");

  const tableReport: TableReport = {
    table: "ari_payments",
    source: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const { data: records, error } = await supabase
      .from("ari_payments")
      .select("*");

    if (error) throw error;

    tableReport.source = records?.length || 0;
    console.log(`  Found ${tableReport.source} records`);

    if (records && records.length > 0) {
      // Get ARI conversation to find contact
      const convexRecords = await Promise.all(
        records.map(async (r: any) => {
          const { data: ariConv } = await supabase
            .from("ari_conversations")
            .select("workspace_id, contact_id")
            .eq("id", r.ari_conversation_id)
            .single();

          if (!ariConv) return null;

          const workspace_slug = await getWorkspaceSlug(supabase, ariConv.workspace_id);
          const contact_phone = await getContactPhone(supabase, ariConv.contact_id);

          if (!workspace_slug || !contact_phone) return null;

          return {
            workspace_slug,
            contact_phone,
            amount: r.amount,
            currency: r.currency,
            payment_method: r.payment_method,
            gateway: r.gateway,
            gateway_transaction_id: r.gateway_transaction_id,
            gateway_response: r.gateway_response,
            status: r.status,
            expires_at: r.expires_at ? new Date(r.expires_at).getTime() : undefined,
            paid_at: r.paid_at ? new Date(r.paid_at).getTime() : undefined,
            created_at: new Date(r.created_at).getTime(),
            updated_at: new Date(r.updated_at).getTime(),
            supabaseId: r.id,
          };
        })
      );

      const validRecords = convexRecords.filter((r) => r !== null);

      if (validRecords.length > 0) {
        const result = await callConvexMutation(client, "bulkInsertAriPayments", {
          records: validRecords,
        });

        tableReport.migrated = result.inserted;
        tableReport.skipped = result.skipped + (records.length - validRecords.length);
      } else {
        tableReport.skipped = records.length;
      }
    }

    console.log(`  ✓ Migrated: ${tableReport.migrated}, Skipped: ${tableReport.skipped}`);
  } catch (error: any) {
    tableReport.errors.push(error.message);
    console.error(`  ✗ Error: ${error.message}`);
  }

  report.tables["ari_payments"] = tableReport;
}

// Migrate ARI Appointments
async function migrateAriAppointments(client: ConvexHttpClient, 
  supabase: any,
  report: MigrationReport
): Promise<void> {
  console.log("\n[3/12] Migrating ari_appointments...");

  const tableReport: TableReport = {
    table: "ari_appointments",
    source: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const { data: records, error } = await supabase
      .from("ari_appointments")
      .select("*");

    if (error) throw error;

    tableReport.source = records?.length || 0;
    console.log(`  Found ${tableReport.source} records`);

    if (records && records.length > 0) {
      const convexRecords = await Promise.all(
        records.map(async (r: any) => {
          const { data: ariConv } = await supabase
            .from("ari_conversations")
            .select("workspace_id, contact_id")
            .eq("id", r.ari_conversation_id)
            .single();

          if (!ariConv) return null;

          const workspace_slug = await getWorkspaceSlug(supabase, ariConv.workspace_id);
          const contact_phone = await getContactPhone(supabase, ariConv.contact_id);

          if (!workspace_slug || !contact_phone) return null;

          return {
            workspace_slug,
            contact_phone,
            payment_supabase_id: r.payment_id,
            consultant_id: r.consultant_id,
            scheduled_at: new Date(r.scheduled_at).getTime(),
            duration_minutes: r.duration_minutes,
            meeting_link: r.meeting_link,
            status: r.status,
            reminder_sent_at: r.reminder_sent_at
              ? new Date(r.reminder_sent_at).getTime()
              : undefined,
            notes: r.notes,
            created_at: new Date(r.created_at).getTime(),
            updated_at: new Date(r.updated_at).getTime(),
            supabaseId: r.id,
          };
        })
      );

      const validRecords = convexRecords.filter((r) => r !== null);

      if (validRecords.length > 0) {
        const result = await callConvexMutation(client, "bulkInsertAriAppointments", {
          records: validRecords,
        });

        tableReport.migrated = result.inserted;
        tableReport.skipped = result.skipped + (records.length - validRecords.length);
      } else {
        tableReport.skipped = records.length;
      }
    }

    console.log(`  ✓ Migrated: ${tableReport.migrated}, Skipped: ${tableReport.skipped}`);
  } catch (error: any) {
    tableReport.errors.push(error.message);
    console.error(`  ✗ Error: ${error.message}`);
  }

  report.tables["ari_appointments"] = tableReport;
}

// Migrate ARI AI Comparison
async function migrateAriAiComparison(client: ConvexHttpClient, 
  supabase: any,
  report: MigrationReport
): Promise<void> {
  console.log("\n[4/12] Migrating ari_ai_comparison...");

  const tableReport: TableReport = {
    table: "ari_ai_comparison",
    source: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const { data: records, error } = await supabase
      .from("ari_ai_comparison")
      .select("*");

    if (error) throw error;

    tableReport.source = records?.length || 0;
    console.log(`  Found ${tableReport.source} records`);

    if (records && records.length > 0) {
      const convexRecords = await Promise.all(
        records.map(async (r: any) => {
          const workspace_slug = await getWorkspaceSlug(supabase, r.workspace_id);
          return {
            workspace_slug: workspace_slug || "",
            ai_model: r.ai_model,
            conversation_count: r.conversation_count,
            avg_response_time_ms: r.avg_response_time_ms,
            total_tokens_used: r.total_tokens_used,
            conversion_count: r.conversion_count,
            satisfaction_score: r.satisfaction_score,
            period_start: r.period_start
              ? new Date(r.period_start).getTime()
              : undefined,
            period_end: r.period_end ? new Date(r.period_end).getTime() : undefined,
            created_at: new Date(r.created_at).getTime(),
            updated_at: new Date(r.updated_at).getTime(),
            supabaseId: r.id,
          };
        })
      );

      const result = await callConvexMutation(client, "bulkInsertAriAiComparison", {
        records: convexRecords,
      });

      tableReport.migrated = result.inserted;
      tableReport.skipped = result.skipped;
    }

    console.log(`  ✓ Migrated: ${tableReport.migrated}, Skipped: ${tableReport.skipped}`);
  } catch (error: any) {
    tableReport.errors.push(error.message);
    console.error(`  ✗ Error: ${error.message}`);
  }

  report.tables["ari_ai_comparison"] = tableReport;
}

// Migrate ARI Flow Stages
async function migrateAriFlowStages(client: ConvexHttpClient, 
  supabase: any,
  report: MigrationReport
): Promise<void> {
  console.log("\n[5/12] Migrating ari_flow_stages...");

  const tableReport: TableReport = {
    table: "ari_flow_stages",
    source: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const { data: records, error } = await supabase
      .from("ari_flow_stages")
      .select("*");

    if (error) throw error;

    tableReport.source = records?.length || 0;
    console.log(`  Found ${tableReport.source} records`);

    if (records && records.length > 0) {
      const convexRecords = await Promise.all(
        records.map(async (r: any) => {
          const workspace_slug = await getWorkspaceSlug(supabase, r.workspace_id);
          return {
            workspace_slug: workspace_slug || "",
            name: r.name,
            goal: r.goal,
            sample_script: r.sample_script,
            exit_criteria: r.exit_criteria,
            stage_order: r.stage_order,
            is_active: r.is_active,
            created_at: new Date(r.created_at).getTime(),
            updated_at: new Date(r.updated_at).getTime(),
            supabaseId: r.id,
          };
        })
      );

      const result = await callConvexMutation(client, "bulkInsertAriFlowStages", {
        records: convexRecords,
      });

      tableReport.migrated = result.inserted;
      tableReport.skipped = result.skipped;
    }

    console.log(`  ✓ Migrated: ${tableReport.migrated}, Skipped: ${tableReport.skipped}`);
  } catch (error: any) {
    tableReport.errors.push(error.message);
    console.error(`  ✗ Error: ${error.message}`);
  }

  report.tables["ari_flow_stages"] = tableReport;
}

// Migrate ARI Knowledge Categories
async function migrateAriKnowledgeCategories(client: ConvexHttpClient, 
  supabase: any,
  report: MigrationReport
): Promise<Record<string, string>> {
  console.log("\n[6/12] Migrating ari_knowledge_categories...");

  const tableReport: TableReport = {
    table: "ari_knowledge_categories",
    source: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  let categoryMapping: Record<string, string> = {};

  try {
    const { data: records, error } = await supabase
      .from("ari_knowledge_categories")
      .select("*");

    if (error) throw error;

    tableReport.source = records?.length || 0;
    console.log(`  Found ${tableReport.source} records`);

    if (records && records.length > 0) {
      const convexRecords = await Promise.all(
        records.map(async (r: any) => {
          const workspace_slug = await getWorkspaceSlug(supabase, r.workspace_id);
          return {
            workspace_slug: workspace_slug || "",
            name: r.name,
            description: r.description,
            display_order: r.display_order,
            created_at: new Date(r.created_at).getTime(),
            updated_at: new Date(r.updated_at).getTime(),
            supabaseId: r.id,
          };
        })
      );

      const result = await callConvexMutation(client, "bulkInsertAriKnowledgeCategories", {
        records: convexRecords,
      });

      tableReport.migrated = result.inserted;
      tableReport.skipped = result.skipped;
      categoryMapping = result.mapping || {};
    }

    console.log(`  ✓ Migrated: ${tableReport.migrated}, Skipped: ${tableReport.skipped}`);
  } catch (error: any) {
    tableReport.errors.push(error.message);
    console.error(`  ✗ Error: ${error.message}`);
  }

  report.tables["ari_knowledge_categories"] = tableReport;
  return categoryMapping;
}

// Migrate ARI Knowledge Entries
async function migrateAriKnowledgeEntries(client: ConvexHttpClient, 
  supabase: any,
  report: MigrationReport,
  categoryMapping: Record<string, string>
): Promise<void> {
  console.log("\n[7/12] Migrating ari_knowledge_entries...");

  const tableReport: TableReport = {
    table: "ari_knowledge_entries",
    source: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const { data: records, error } = await supabase
      .from("ari_knowledge_entries")
      .select("*");

    if (error) throw error;

    tableReport.source = records?.length || 0;
    console.log(`  Found ${tableReport.source} records`);

    if (records && records.length > 0) {
      const convexRecords = await Promise.all(
        records.map(async (r: any) => {
          const workspace_slug = await getWorkspaceSlug(supabase, r.workspace_id);
          return {
            workspace_slug: workspace_slug || "",
            category_supabase_id: r.category_id,
            title: r.title,
            content: r.content,
            is_active: r.is_active,
            created_at: new Date(r.created_at).getTime(),
            updated_at: new Date(r.updated_at).getTime(),
            supabaseId: r.id,
          };
        })
      );

      const result = await callConvexMutation(client, "bulkInsertAriKnowledgeEntries", {
        records: convexRecords,
        categoryMapping,
      });

      tableReport.migrated = result.inserted;
      tableReport.skipped = result.skipped;
    }

    console.log(`  ✓ Migrated: ${tableReport.migrated}, Skipped: ${tableReport.skipped}`);
  } catch (error: any) {
    tableReport.errors.push(error.message);
    console.error(`  ✗ Error: ${error.message}`);
  }

  report.tables["ari_knowledge_entries"] = tableReport;
}

// Migrate ARI Scoring Config
async function migrateAriScoringConfig(client: ConvexHttpClient, 
  supabase: any,
  report: MigrationReport
): Promise<void> {
  console.log("\n[8/12] Migrating ari_scoring_config...");

  const tableReport: TableReport = {
    table: "ari_scoring_config",
    source: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const { data: records, error } = await supabase
      .from("ari_scoring_config")
      .select("*");

    if (error) throw error;

    tableReport.source = records?.length || 0;
    console.log(`  Found ${tableReport.source} records`);

    if (records && records.length > 0) {
      const convexRecords = await Promise.all(
        records.map(async (r: any) => {
          const workspace_slug = await getWorkspaceSlug(supabase, r.workspace_id);
          return {
            workspace_slug: workspace_slug || "",
            hot_threshold: r.hot_threshold,
            warm_threshold: r.warm_threshold,
            weight_basic: r.weight_basic,
            weight_qualification: r.weight_qualification,
            weight_document: r.weight_document,
            weight_engagement: r.weight_engagement,
            created_at: new Date(r.created_at).getTime(),
            updated_at: new Date(r.updated_at).getTime(),
            supabaseId: r.id,
          };
        })
      );

      const result = await callConvexMutation(client, "bulkInsertAriScoringConfig", {
        records: convexRecords,
      });

      tableReport.migrated = result.inserted;
      tableReport.skipped = result.skipped;
    }

    console.log(`  ✓ Migrated: ${tableReport.migrated}, Skipped: ${tableReport.skipped}`);
  } catch (error: any) {
    tableReport.errors.push(error.message);
    console.error(`  ✗ Error: ${error.message}`);
  }

  report.tables["ari_scoring_config"] = tableReport;
}

// Migrate Consultant Slots
async function migrateConsultantSlots(client: ConvexHttpClient, 
  supabase: any,
  report: MigrationReport
): Promise<void> {
  console.log("\n[9/12] Migrating consultant_slots...");

  const tableReport: TableReport = {
    table: "consultant_slots",
    source: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const { data: records, error } = await supabase
      .from("consultant_slots")
      .select("*");

    if (error) throw error;

    tableReport.source = records?.length || 0;
    console.log(`  Found ${tableReport.source} records`);

    if (records && records.length > 0) {
      const convexRecords = await Promise.all(
        records.map(async (r: any) => {
          const workspace_slug = await getWorkspaceSlug(supabase, r.workspace_id);
          return {
            workspace_slug: workspace_slug || "",
            consultant_id: r.consultant_id || undefined, // Convert null to undefined
            day_of_week: r.day_of_week,
            start_time: r.start_time,
            end_time: r.end_time,
            duration_minutes: r.duration_minutes,
            booking_window_days: r.booking_window_days,
            max_bookings_per_slot: r.max_bookings_per_slot,
            is_active: r.is_active,
            created_at: new Date(r.created_at).getTime(),
            updated_at: new Date(r.updated_at).getTime(),
            supabaseId: r.id,
          };
        })
      );

      const result = await callConvexMutation(client, "bulkInsertConsultantSlots", {
        records: convexRecords,
      });

      tableReport.migrated = result.inserted;
      tableReport.skipped = result.skipped;
    }

    console.log(`  ✓ Migrated: ${tableReport.migrated}, Skipped: ${tableReport.skipped}`);
  } catch (error: any) {
    tableReport.errors.push(error.message);
    console.error(`  ✗ Error: ${error.message}`);
  }

  report.tables["consultant_slots"] = tableReport;
}

// Migrate Articles
async function migrateArticles(client: ConvexHttpClient, 
  supabase: any,
  report: MigrationReport
): Promise<void> {
  console.log("\n[10/12] Migrating articles...");

  const tableReport: TableReport = {
    table: "articles",
    source: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const { data: records, error } = await supabase.from("articles").select("*");

    if (error) throw error;

    tableReport.source = records?.length || 0;
    console.log(`  Found ${tableReport.source} records`);

    if (records && records.length > 0) {
      const convexRecords = await Promise.all(
        records.map(async (r: any) => {
          const workspace_slug = await getWorkspaceSlug(supabase, r.workspace_id);
          return {
            workspace_slug: workspace_slug || "",
            title: r.title,
            slug: r.slug,
            excerpt: r.excerpt,
            content: r.content,
            cover_image_url: r.cover_image_url,
            status: r.status,
            published_at: r.published_at
              ? new Date(r.published_at).getTime()
              : undefined,
            created_at: new Date(r.created_at).getTime(),
            updated_at: new Date(r.updated_at).getTime(),
            supabaseId: r.id,
          };
        })
      );

      const result = await callConvexMutation(client, "bulkInsertArticles", {
        records: convexRecords,
      });

      tableReport.migrated = result.inserted;
      tableReport.skipped = result.skipped;
    }

    console.log(`  ✓ Migrated: ${tableReport.migrated}, Skipped: ${tableReport.skipped}`);
  } catch (error: any) {
    tableReport.errors.push(error.message);
    console.error(`  ✗ Error: ${error.message}`);
  }

  report.tables["articles"] = tableReport;
}

// Migrate Webinars
async function migrateWebinars(client: ConvexHttpClient, 
  supabase: any,
  report: MigrationReport
): Promise<Record<string, string>> {
  console.log("\n[11/12] Migrating webinars...");

  const tableReport: TableReport = {
    table: "webinars",
    source: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  let webinarMapping: Record<string, string> = {};

  try {
    const { data: records, error } = await supabase.from("webinars").select("*");

    if (error) throw error;

    tableReport.source = records?.length || 0;
    console.log(`  Found ${tableReport.source} records`);

    if (records && records.length > 0) {
      const convexRecords = await Promise.all(
        records.map(async (r: any) => {
          const workspace_slug = await getWorkspaceSlug(supabase, r.workspace_id);
          return {
            workspace_slug: workspace_slug || "",
            title: r.title,
            slug: r.slug,
            description: r.description,
            cover_image_url: r.cover_image_url,
            scheduled_at: new Date(r.scheduled_at).getTime(),
            duration_minutes: r.duration_minutes,
            meeting_url: r.meeting_url,
            max_registrations: r.max_registrations,
            status: r.status,
            published_at: r.published_at
              ? new Date(r.published_at).getTime()
              : undefined,
            created_at: new Date(r.created_at).getTime(),
            updated_at: new Date(r.updated_at).getTime(),
            supabaseId: r.id,
          };
        })
      );

      const result = await callConvexMutation(client, "bulkInsertWebinars", {
        records: convexRecords,
      });

      tableReport.migrated = result.inserted;
      tableReport.skipped = result.skipped;
      webinarMapping = result.mapping || {};
    }

    console.log(`  ✓ Migrated: ${tableReport.migrated}, Skipped: ${tableReport.skipped}`);
  } catch (error: any) {
    tableReport.errors.push(error.message);
    console.error(`  ✗ Error: ${error.message}`);
  }

  report.tables["webinars"] = tableReport;
  return webinarMapping;
}

// Migrate Webinar Registrations
async function migrateWebinarRegistrations(client: ConvexHttpClient, 
  supabase: any,
  report: MigrationReport,
  webinarMapping: Record<string, string>
): Promise<void> {
  console.log("\n[12/12] Migrating webinar_registrations...");

  const tableReport: TableReport = {
    table: "webinar_registrations",
    source: 0,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const { data: records, error } = await supabase
      .from("webinar_registrations")
      .select("*");

    if (error) throw error;

    tableReport.source = records?.length || 0;
    console.log(`  Found ${tableReport.source} records`);

    if (records && records.length > 0) {
      const convexRecords = await Promise.all(
        records.map(async (r: any) => {
          const { data: contact } = await supabase
            .from("contacts")
            .select("workspace_id, phone")
            .eq("id", r.contact_id)
            .single();

          if (!contact) return null;

          const workspace_slug = await getWorkspaceSlug(supabase, contact.workspace_id);

          if (!workspace_slug) return null;

          return {
            workspace_slug,
            webinar_supabase_id: r.webinar_id,
            contact_phone: contact.phone,
            registered_at: new Date(r.registered_at).getTime(),
            attended: r.attended,
            supabaseId: r.id,
          };
        })
      );

      const validRecords = convexRecords.filter((r) => r !== null);

      if (validRecords.length > 0) {
        const result = await callConvexMutation(client, "bulkInsertWebinarRegistrations", {
          records: validRecords,
          webinarMapping,
        });

        tableReport.migrated = result.inserted;
        tableReport.skipped = result.skipped + (records.length - validRecords.length);
      } else {
        tableReport.skipped = records.length;
      }
    }

    console.log(`  ✓ Migrated: ${tableReport.migrated}, Skipped: ${tableReport.skipped}`);
  } catch (error: any) {
    tableReport.errors.push(error.message);
    console.error(`  ✗ Error: ${error.message}`);
  }

  report.tables["webinar_registrations"] = tableReport;
}

// Main execution
async function main() {
  console.log("=== Supabase to Convex Data Migration ===\n");

  const startTime = Date.now();

  // Validate environment
  validateEnvironment();

  // Load workspace mapping (for slug lookup)
  const workspaceMapping = loadWorkspaceMapping();
  console.log(`Loaded workspace mapping: ${Object.keys(workspaceMapping).length} workspaces\n`);

  // Initialize Convex client
  const convex = new ConvexHttpClient(CONVEX_URL!);

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

  // Initialize report
  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    tables: {},
  };

  // Execute migrations in order
  await migrateAriDestinations(convex, supabase, report);
  await migrateAriPayments(convex, supabase, report);
  await migrateAriAppointments(convex, supabase, report);
  await migrateAriAiComparison(convex, supabase, report);
  await migrateAriFlowStages(convex, supabase, report);

  // Categories must complete before entries (for mapping)
  const categoryMapping = await migrateAriKnowledgeCategories(convex, supabase, report);
  await migrateAriKnowledgeEntries(convex, supabase, report, categoryMapping);

  await migrateAriScoringConfig(convex, supabase, report);
  await migrateConsultantSlots(convex, supabase, report);
  await migrateArticles(convex, supabase, report);

  // Webinars must complete before registrations (for mapping)
  const webinarMapping = await migrateWebinars(convex, supabase, report);
  await migrateWebinarRegistrations(convex, supabase, report, webinarMapping);

  // Calculate duration
  const endTime = Date.now();
  report.duration_seconds = Math.round((endTime - startTime) / 1000);

  // Save report
  const reportDir = ".planning/migrations";
  if (!existsSync(reportDir)) {
    mkdirSync(reportDir, { recursive: true });
  }

  const reportPath = `${reportDir}/data-migration-report.json`;
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log("\n=== Migration Summary ===");
  console.log(`Duration: ${report.duration_seconds}s`);
  console.log(`Report: ${reportPath}\n`);

  let totalSource = 0;
  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  Object.values(report.tables).forEach((t) => {
    totalSource += t.source;
    totalMigrated += t.migrated;
    totalSkipped += t.skipped;
    totalErrors += t.errors.length;
  });

  console.log(`Total records in Supabase: ${totalSource}`);
  console.log(`Total migrated to Convex: ${totalMigrated}`);
  console.log(`Total skipped: ${totalSkipped}`);
  console.log(`Total errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.log("\n⚠️  Migration completed with errors. Check report for details.");
    process.exit(1);
  } else {
    console.log("\n✅ Migration completed successfully!");
  }
}

// Run main
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
