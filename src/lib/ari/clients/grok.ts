/**
 * Grok AI Client
 *
 * Uses OpenAI SDK to connect to Grok API (x.ai)
 * Supports grok-3 (faster) and grok-4 models
 */

import OpenAI from 'openai';
import type { AIResponse, AIModelType } from '../types';

// Grok API client (x.ai uses OpenAI-compatible API)
const grokClient = new OpenAI({
  apiKey: process.env.GROK_API_KEY || '',
  baseURL: 'https://api.x.ai/v1',
});

/** Grok model options */
export type GrokModel = 'grok-3' | 'grok-4';

/** Options for Grok response generation */
export interface GrokOptions {
  /** Model to use (default: grok-3) */
  model?: GrokModel;
  /** Maximum tokens in response (default: 150 for WhatsApp brevity) */
  maxTokens?: number;
  /** Temperature for response creativity (default: 0.8) */
  temperature?: number;
  /** System prompt to prepend */
  systemPrompt?: string;
}

/**
 * Generate a response using Grok AI
 *
 * @param messages - Chat messages in OpenAI format
 * @param options - Generation options
 * @returns AI response with content, token count, and timing
 */
export async function generateGrokResponse(
  messages: OpenAI.ChatCompletionMessageParam[],
  options: GrokOptions = {}
): Promise<AIResponse> {
  const {
    model = 'grok-3',
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
    const completion = await grokClient.chat.completions.create({
      model,
      messages: allMessages,
      max_tokens: maxTokens,
      temperature,
    });

    const responseTimeMs = Date.now() - startTime;
    const content = completion.choices[0]?.message?.content || '';
    const tokens = completion.usage?.total_tokens || null;

    console.log(`[Grok] Response in ${responseTimeMs}ms, ${tokens || 'unknown'} tokens`);

    return {
      content,
      tokens,
      responseTimeMs,
      model: 'grok' as AIModelType,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    console.error(`[Grok] Error after ${responseTimeMs}ms:`, error);

    // Return fallback message on error
    return {
      content: 'Maaf, saya sedang mengalami kesalahan teknis. Mohon tunggu sebentar atau hubungi tim kami.',
      tokens: null,
      responseTimeMs,
      model: 'grok' as AIModelType,
    };
  }
}

/**
 * Check if Grok API is configured and accessible
 */
export async function checkGrokHealth(): Promise<boolean> {
  if (!process.env.GROK_API_KEY) {
    console.warn('[Grok] GROK_API_KEY not configured');
    return false;
  }

  try {
    // Simple test call
    await grokClient.chat.completions.create({
      model: 'grok-3',
      messages: [{ role: 'user', content: 'Hi' }],
      max_tokens: 5,
    });
    return true;
  } catch (error) {
    console.error('[Grok] Health check failed:', error);
    return false;
  }
}

export { grokClient };
