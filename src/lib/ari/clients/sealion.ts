/**
 * Sea-Lion AI Client
 *
 * Uses OpenAI SDK to connect to Ollama running Sea-Lion model
 * via Tailscale (http://100.113.96.25:11434)
 */

import OpenAI from 'openai';
import type { AIResponse, AIModelType } from '../types';

// Default Ollama endpoint via Tailscale
const SEALION_URL = process.env.SEALION_URL || 'http://100.113.96.25:11434/v1';

// Sea-Lion client (Ollama uses OpenAI-compatible API)
const sealionClient = new OpenAI({
  apiKey: 'ollama', // Ollama doesn't require a real API key
  baseURL: SEALION_URL,
});

/** Sea-Lion model identifier */
export const SEALION_MODEL = 'aisingapore/Gemma-SEA-LION-v4-27B-IT';

/** Options for Sea-Lion response generation */
export interface SealionOptions {
  /** Model to use (default: Sea-Lion) */
  model?: string;
  /** Maximum tokens in response (default: 150 for WhatsApp brevity) */
  maxTokens?: number;
  /** Temperature for response creativity (default: 0.8) */
  temperature?: number;
  /** System prompt to prepend */
  systemPrompt?: string;
}

/**
 * Generate a response using Sea-Lion AI
 *
 * @param messages - Chat messages in OpenAI format
 * @param options - Generation options
 * @returns AI response with content, token count, and timing
 */
export async function generateSealionResponse(
  messages: OpenAI.ChatCompletionMessageParam[],
  options: SealionOptions = {}
): Promise<AIResponse> {
  const {
    model = SEALION_MODEL,
    maxTokens = 150,
    temperature = 0.8,
    systemPrompt,
  } = options;

  const startTime = Date.now();

  // Prepend system prompt if provided
  const allMessages: OpenAI.ChatCompletionMessageParam[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  try {
    const completion = await sealionClient.chat.completions.create({
      model,
      messages: allMessages,
      max_tokens: maxTokens,
      temperature,
    });

    const responseTimeMs = Date.now() - startTime;
    const content = completion.choices[0]?.message?.content || '';
    const tokens = completion.usage?.total_tokens || null;

    console.log(`[Sea-Lion] Response in ${responseTimeMs}ms, ${tokens || 'unknown'} tokens`);

    return {
      content,
      tokens,
      responseTimeMs,
      model: 'sealion' as AIModelType,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error(`[Sea-Lion] Error after ${responseTimeMs}ms:`, error);

    // Return fallback message on error
    return {
      content: 'Maaf, saya sedang mengalami kesalahan teknis. Mohon tunggu sebentar atau hubungi tim kami.',
      tokens: null,
      responseTimeMs,
      model: 'sealion' as AIModelType,
    };
  }
}

/**
 * Check if Sea-Lion/Ollama is accessible
 */
export async function checkSealionHealth(): Promise<boolean> {
  try {
    // Simple test call
    await sealionClient.chat.completions.create({
      model: SEALION_MODEL,
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    });
    return true;
  } catch (error) {
    console.error('[Sea-Lion] Health check failed:', error);
    return false;
  }
}

export { sealionClient };
