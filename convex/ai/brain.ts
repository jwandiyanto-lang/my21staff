/**
 * The Brain — Analytical AI module.
 *
 * Runs asynchronously after The Mouth responds.
 * Analyzes conversations to:
 * - Score leads (0-100)
 * - Classify temperature (hot/warm/cold)
 * - Determine conversation state
 * - Recommend next action
 *
 * Uses Grok API for cost-effective analysis (~$5 per million tokens).
 */

import { internalAction, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { buildConversationContext, buildBrainSystemPrompt } from "./context";

export interface BrainAnalysis {
  lead_score: number;
  temperature: "hot" | "warm" | "cold";
  state: "greeting" | "qualifying" | "scheduling" | "handoff";
  next_action: "continue_bot" | "offer_consultation" | "offer_community" | "handoff_human";
  reasoning: string;
}

export interface BrainResponse {
  analysis: BrainAnalysis;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

/**
 * Analyze a conversation and update lead scores.
 *
 * This action:
 * 1. Loads recent conversation history
 * 2. Calls Grok for analysis
 * 3. Updates contact lead_score and lead_status
 * 4. Updates ariConversation state and temperature
 * 5. Logs usage to aiUsage table
 */
export const analyzeConversation = internalAction({
  args: {
    workspaceId: v.id("workspaces"),
    contactId: v.id("contacts"),
    ariConversationId: v.id("ariConversations"),
    recentMessages: v.array(v.object({
      role: v.string(),
      content: v.string(),
    })),
    contactName: v.optional(v.string()),
    currentScore: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<BrainResponse | null> => {
    const grokApiKey = process.env.GROK_API_KEY;

    if (!grokApiKey) {
      console.error("[Brain] No GROK_API_KEY configured");
      return null;
    }

    // Build context with full history (last 20 messages)
    const context = buildConversationContext(
      args.recentMessages,
      { aiType: "brain", maxMessages: 20 }
    );

    // Build analysis prompt
    const systemPrompt = buildBrainSystemPrompt();
    const analysisPrompt = buildAnalysisPrompt(
      context,
      args.contactName ?? "Unknown",
      args.currentScore ?? 0
    );

    try {
      // Call Grok API (OpenAI-compatible format)
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${grokApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: analysisPrompt },
          ],
          max_tokens: 500,
          temperature: 0.3, // Lower temperature for consistent JSON
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Brain] Grok error: ${response.status} - ${errorText}`);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";

      if (!content) {
        console.error("[Brain] No content in Grok response");
        return null;
      }

      // Parse JSON response
      let analysis: BrainAnalysis;
      try {
        // Try to extract JSON from response (Grok may wrap it in markdown)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch (parseError) {
        console.error("[Brain] Failed to parse JSON:", content);
        // Return default analysis on parse failure
        analysis = {
          lead_score: args.currentScore ?? 0,
          temperature: "cold",
          state: "greeting",
          next_action: "continue_bot",
          reasoning: "Parse error - using defaults",
        };
      }

      // Calculate cost (~$5 per million tokens for Grok)
      const inputTokens = data.usage?.prompt_tokens || 0;
      const outputTokens = data.usage?.completion_tokens || 0;
      const totalTokens = data.usage?.total_tokens || inputTokens + outputTokens;
      const costUsd = totalTokens * (5 / 1_000_000);

      // Update contact lead score
      await ctx.runMutation(internal.ai.brain.updateContactScore, {
        contactId: args.contactId,
        leadScore: analysis.lead_score,
        leadStatus: mapTemperatureToStatus(analysis.temperature),
      });

      // Update ariConversation state
      await ctx.runMutation(internal.ai.brain.updateConversationState, {
        ariConversationId: args.ariConversationId,
        state: analysis.state,
        leadScore: analysis.lead_score,
        leadTemperature: analysis.temperature,
      });

      // Log usage to aiUsage table
      await ctx.runMutation(internal.ai.brain.logBrainUsage, {
        workspaceId: args.workspaceId,
        conversationId: args.ariConversationId,
        model: "grok-beta",
        inputTokens,
        outputTokens,
        costUsd,
      });

      console.log(
        `[Brain] Analysis complete: score=${analysis.lead_score}, temp=${analysis.temperature}, cost=$${costUsd.toFixed(6)}`
      );

      return {
        analysis,
        model: "grok-beta",
        inputTokens,
        outputTokens,
        costUsd,
      };
    } catch (error) {
      console.error("[Brain] Analysis failed:", error);
      return null;
    }
  },
});

/**
 * Build the analysis prompt with conversation context.
 */
function buildAnalysisPrompt(
  messages: Array<{ role: string; content: string }>,
  contactName: string,
  currentScore: number
): string {
  const conversationText = messages
    .map((m) => `${m.role === "user" ? "Customer" : "Bot"}: ${m.content}`)
    .join("\n");

  return `Analyze this conversation and provide lead scoring.

Contact Info:
- Name: ${contactName}
- Current Score: ${currentScore}

Recent Conversation:
${conversationText}

Provide your analysis as JSON only, no markdown formatting.`;
}

/**
 * Map temperature to contact lead_status field.
 */
function mapTemperatureToStatus(temperature: "hot" | "warm" | "cold"): string {
  switch (temperature) {
    case "hot": return "hot";
    case "warm": return "warm";
    case "cold": return "cold";
    default: return "new";
  }
}

// ============================================
// HELPER MUTATIONS (called by analyzeConversation)
// ============================================

/**
 * Update contact lead score and status.
 */
export const updateContactScore = internalMutation({
  args: {
    contactId: v.id("contacts"),
    leadScore: v.number(),
    leadStatus: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.contactId, {
      lead_score: args.leadScore,
      lead_status: args.leadStatus,
      updated_at: Date.now(),
    });
  },
});

/**
 * Update ariConversation state and scoring.
 */
export const updateConversationState = internalMutation({
  args: {
    ariConversationId: v.id("ariConversations"),
    state: v.string(),
    leadScore: v.number(),
    leadTemperature: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.ariConversationId, {
      state: args.state,
      lead_score: args.leadScore,
      lead_temperature: args.leadTemperature,
      updated_at: Date.now(),
    });
  },
});

/**
 * Log AI usage to aiUsage table.
 */
export const logBrainUsage = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    conversationId: v.id("ariConversations"),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    costUsd: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("aiUsage", {
      workspace_id: args.workspaceId,
      conversation_id: args.conversationId,
      model: args.model,
      ai_type: "brain",
      input_tokens: args.inputTokens,
      output_tokens: args.outputTokens,
      cost_usd: args.costUsd,
      created_at: Date.now(),
    });
  },
});
