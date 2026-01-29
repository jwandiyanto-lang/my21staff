/**
 * Eagle Overseas Bot Setup Script
 *
 * This script configures the ARI bot for Eagle Overseas workspace.
 * Run this after completing Phases 1-3 (State Machine, Prompts, Knowledge Base).
 *
 * Usage:
 *   npx tsx scripts/setup-eagle-bot.ts
 *
 * Based on: business/clients/eagle/eagle-ari-journey.md
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
const EAGLE_WORKSPACE_ID = "js7b1cwpdpadcgds1cr8dqw7dh7zv3a3";

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL not found in environment");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

/**
 * Phase 4: Bot Configuration
 * Set up Eagle Overseas bot persona and settings
 */
async function setupBotConfiguration() {
  console.log("\n🤖 Setting up Eagle Overseas Bot Configuration...\n");

  try {
    // Bot Persona Configuration (from eagle-ari-journey.md)
    const botConfig = {
      workspace_id: EAGLE_WORKSPACE_ID,
      bot_name: "ARI",
      greeting_style: "casual", // casual/friendly/professional
      language: "id", // Bahasa Indonesia
      tone: {
        supportive: true,
        clear: true,
        encouraging: true,
      },
      community_link: "https://whatsapp.com/channel/0029Vb72LoyLSmbcJvDunX1U",
      enabled: true, // Bot is active
    };

    console.log("📝 Bot Configuration:");
    console.log("   Name:", botConfig.bot_name);
    console.log("   Style:", botConfig.greeting_style);
    console.log("   Language:", botConfig.language);
    console.log("   Tone:", Object.keys(botConfig.tone).filter(k => botConfig.tone[k]).join(", "));
    console.log("   Community:", botConfig.community_link);
    console.log("   Status:", botConfig.enabled ? "✅ ENABLED" : "❌ DISABLED");

    // Use seedAriConfig (no auth required)
    console.log("\n📤 Applying configuration to database...");
    await client.mutation(api.ari.seedAriConfig, botConfig as any);

    console.log("\n✅ Bot configuration applied successfully!");
    console.log("🤖 ARI is now ENABLED for Eagle Overseas workspace");

  } catch (error) {
    console.error("❌ Failed to set up bot configuration:", error);
    throw error;
  }
}

/**
 * Communication Style Guidelines
 * Based on eagle-ari-journey.md lines 296-300
 */
function displayCommunicationGuidelines() {
  console.log("\n💬 Communication Style Guidelines:");
  console.log("   ✅ Short: 1-2 sentences per message");
  console.log("   ✅ NO emojis");
  console.log("   ✅ Casual language: 'saya/kamu' not formal");
  console.log("   ✅ Mirror customer's language");
  console.log("\n   Example greeting:");
  console.log("   'Siang kak Sarah! Wah tertarik kuliah di luar negeri ya?'");
}

/**
 * State Machine Overview
 * 7 stages from BOT-STRATEGY.md
 */
function displayStateMachine() {
  console.log("\n🔄 State Machine (7 Stages):");
  console.log("   1. greeting          → Greet and ask about questionnaire");
  console.log("   2. qualification     → Collect age + documents");
  console.log("   3. q_and_a           → Answer questions, offer consultation");
  console.log("   4. objection_handling → Capture objection, offer community");
  console.log("   5. circle_back       → One attempt to overcome objection");
  console.log("   6. handoff           → Route to human consultant");
  console.log("   7. community_fallback → Send community link, end");
}

/**
 * Implementation Checklist
 */
function displayChecklist() {
  console.log("\n📋 Implementation Checklist:");
  console.log("   Phase 1: Core State Machine");
  console.log("      ☐ Update schema (qualification, sales, analytics objects)");
  console.log("      ☐ Create state transition helpers");
  console.log("      ☐ Implement 5 mutations (qualification, Q&A, objection, circle back, handoff)");
  console.log("\n   Phase 2: Prompts & Brain Logic");
  console.log("      ☐ Create 7 state-specific system prompts");
  console.log("      ☐ Update Brain to detect age, documents, objections");
  console.log("      ☐ Test conversation flows");
  console.log("\n   Phase 3: Knowledge Base");
  console.log("      ☐ Seed 20+ FAQ entries (services, universities, requirements, etc.)");
  console.log("      ☐ Implement KB search in Mouth");
  console.log("\n   Phase 4: Bot Configuration (CURRENT)");
  console.log("      ✅ Bot persona defined");
  console.log("      ☐ Create upsertConfig mutation");
  console.log("      ☐ Apply configuration to database");
  console.log("\n   Phase 5: Analytics Dashboard");
  console.log("      ☐ Create analytics queries (metrics, objections, stats)");
  console.log("      ☐ Build dashboard UI component");
  console.log("      ☐ Add Analytics tab to Your Intern page");
}

/**
 * Main execution
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  Eagle Overseas - ARI Bot Setup                           ║");
  console.log("║  Phase 4: Bot Configuration                               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  displayStateMachine();
  displayCommunicationGuidelines();

  await setupBotConfiguration();

  displayChecklist();

  console.log("\n🎯 Next Actions:");
  console.log("   1. Implement missing mutations (see Phase 1 in plan)");
  console.log("   2. Run: npx tsx scripts/setup-eagle-bot.ts");
  console.log("   3. Test bot by sending WhatsApp message to Eagle's number");
  console.log("\n📄 Full Implementation Plan:");
  console.log("   See: business/integration/BOT-IMPLEMENTATION-PLAN.md");
  console.log("\n");
}

main().catch((error) => {
  console.error("\n❌ Setup failed:", error);
  process.exit(1);
});
