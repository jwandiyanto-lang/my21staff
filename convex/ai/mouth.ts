/**
 * The Mouth — Conversational AI module.
 *
 * Handles real-time WhatsApp conversations with low latency.
 * Primary: Sea-Lion (local Ollama on Tailscale) — FREE
 * Fallback: Grok API — PAID
 */

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import {
  buildConversationContext,
  buildMouthSystemPrompt,
  type ConversationMessage,
} from "./context";

export interface MouthResponse {
  content: string;
  model: "sea-lion" | "grok-beta" | "fallback";
  tokens: number;
  responseTimeMs: number;
}

/**
 * Generate a conversational response from The Mouth.
 *
 * Flow:
 * 1. Try Sea-Lion (local Ollama) first — free, Indonesian-optimized
 * 2. If Sea-Lion fails, fall back to Grok API — paid but reliable
 * 3. If both fail, return safe fallback message
 */
export const generateMouthResponse = internalAction({
  args: {
    conversationHistory: v.array(
      v.object({
        role: v.string(),
        content: v.string(),
      })
    ),
    userMessage: v.string(),
    botName: v.optional(v.string()),
    contactName: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<MouthResponse> => {
    const startTime = Date.now();

    // Build context with sliding window (last 10 messages for speed)
    const context = buildConversationContext(args.conversationHistory, {
      aiType: "mouth",
      maxMessages: 10,
    });

    // Build system prompt
    const systemPrompt = buildMouthSystemPrompt(
      args.botName ?? "Ari",
      args.contactName ?? "kakak",
      args.language ?? "id"
    );

    // Format messages for API
    const messages: ConversationMessage[] = [
      { role: "system", content: systemPrompt },
      ...context,
      { role: "user", content: args.userMessage },
    ];

    // Try Sea-Lion first (free, local)
    try {
      const seaLionResponse = await callSeaLion(messages);
      if (seaLionResponse) {
        return {
          ...seaLionResponse,
          responseTimeMs: Date.now() - startTime,
        };
      }
    } catch (error) {
      console.error("[Mouth] Sea-Lion error, falling back to Grok:", error);
    }

    // Fall back to Grok
    try {
      const grokResponse = await callGrok(messages);
      if (grokResponse) {
        return {
          ...grokResponse,
          responseTimeMs: Date.now() - startTime,
        };
      }
    } catch (error) {
      console.error("[Mouth] Grok error:", error);
    }

    // Final fallback
    return {
      content:
        args.language === "en"
          ? "Thank you for contacting us. Our consultant will help you shortly."
          : "Terima kasih sudah menghubungi kami. Konsultan kami akan segera membantu.",
      model: "fallback",
      tokens: 0,
      responseTimeMs: Date.now() - startTime,
    };
  },
});

/**
 * Call Sea-Lion via local Ollama (Tailscale server).
 * FREE - runs locally on 100.113.96.25:11434
 */
async function callSeaLion(
  messages: ConversationMessage[]
): Promise<Omit<MouthResponse, "responseTimeMs"> | null> {
  const ollamaUrl = process.env.SEALION_URL || "http://100.113.96.25:11434";

  // Format messages for Ollama chat API
  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "sea-lion", // or "aisingapore/Gemma-SEA-LION-v3-9B-IT"
      messages: formattedMessages,
      stream: false,
      options: {
        num_ctx: 2048,
        temperature: 0.8,
        top_p: 0.9,
      },
    }),
  });

  if (!response.ok) {
    console.error(`[Mouth] Ollama error: ${response.status}`);
    return null;
  }

  const data = (await response.json()) as {
    message?: { content: string };
    response?: string;
    eval_count?: number;
  };
  const content = data.message?.content || data.response || "";

  if (!content) {
    return null;
  }

  return {
    content,
    model: "sea-lion",
    tokens: data.eval_count || 0,
  };
}

/**
 * Call Grok via xAI API.
 * PAID fallback when Sea-Lion unavailable.
 */
async function callGrok(
  messages: ConversationMessage[]
): Promise<Omit<MouthResponse, "responseTimeMs"> | null> {
  const grokApiKey = process.env.GROK_API_KEY;

  if (!grokApiKey) {
    console.warn("[Mouth] No GROK_API_KEY configured");
    return null;
  }

  // Format for OpenAI-compatible API
  const formattedMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${grokApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-beta",
      messages: formattedMessages,
      max_tokens: 150, // Keep responses short
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Mouth] Grok error: ${response.status} - ${errorText}`);
    return null;
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content: string } }>;
    usage?: { total_tokens?: number };
  };
  const content = data.choices?.[0]?.message?.content || "";

  if (!content) {
    return null;
  }

  return {
    content,
    model: "grok-beta",
    tokens: data.usage?.total_tokens || 0,
  };
}
