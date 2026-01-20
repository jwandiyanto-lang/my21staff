/**
 * ARI AI Router
 *
 * Routes AI requests to appropriate model (Grok or Sea-Lion)
 * with deterministic A/B selection based on contact ID
 */

import type OpenAI from 'openai';
import type { AIResponse, AIModelType } from './types';
import { generateGrokResponse, type GrokOptions } from './clients/grok';
import { generateSealionResponse, type SealionOptions } from './clients/sealion';

/**
 * Hash a string to a number between 0-99
 * Uses djb2-like hash for deterministic distribution
 *
 * @param str - String to hash (typically contact ID)
 * @returns Number between 0-99
 */
function hashString(str: string): number {
  const hash = str.split('').reduce((acc, char) =>
    ((acc << 5) - acc) + char.charCodeAt(0), 0
  );
  return Math.abs(hash) % 100;
}

/**
 * Select AI model deterministically based on contact ID
 *
 * This ensures the same contact always gets the same model,
 * preventing A/B test contamination where a lead might
 * experience both models during their journey.
 *
 * @param contactId - Unique contact identifier
 * @param grokWeight - Percentage of traffic to Grok (default: 50)
 * @returns Selected AI model type
 *
 * @example
 * ```ts
 * // 50/50 split (default)
 * selectModel('abc-123') // Always returns same model for this ID
 *
 * // 70% Grok, 30% Sea-Lion
 * selectModel('abc-123', 70)
 * ```
 */
export function selectModel(contactId: string, grokWeight: number = 50): AIModelType {
  const hash = hashString(contactId);
  return hash < grokWeight ? 'grok' : 'sealion';
}

/**
 * Common options for AI generation
 */
export interface AIGenerationOptions {
  /** Maximum tokens in response (default: 150) */
  maxTokens?: number;
  /** Temperature for response creativity (default: 0.8) */
  temperature?: number;
  /** System prompt to prepend */
  systemPrompt?: string;
  /** Model-specific options */
  grokModel?: 'grok-3' | 'grok-4';
}

/**
 * Generate a response using the specified AI model
 *
 * @param model - Which AI model to use
 * @param messages - Chat messages in OpenAI format
 * @param options - Generation options
 * @returns AI response with content, token count, and timing
 *
 * @example
 * ```ts
 * const model = selectModel(contact.id);
 * const response = await generateResponse(model, [
 *   { role: 'user', content: 'Halo, saya tertarik kuliah di Australia' }
 * ], {
 *   systemPrompt: 'You are ARI, a friendly education consultant...',
 *   maxTokens: 150
 * });
 * ```
 */
export async function generateResponse(
  model: AIModelType,
  messages: OpenAI.ChatCompletionMessageParam[],
  options: AIGenerationOptions = {}
): Promise<AIResponse> {
  const { maxTokens, temperature, systemPrompt, grokModel } = options;

  if (model === 'grok') {
    const grokOptions: GrokOptions = {
      model: grokModel,
      maxTokens,
      temperature,
      systemPrompt,
    };
    return generateGrokResponse(messages, grokOptions);
  } else {
    const sealionOptions: SealionOptions = {
      maxTokens,
      temperature,
      systemPrompt,
    };
    return generateSealionResponse(messages, sealionOptions);
  }
}

/**
 * Generate a response with automatic model selection
 *
 * Convenience function that combines selectModel and generateResponse
 *
 * @param contactId - Contact ID for deterministic model selection
 * @param messages - Chat messages in OpenAI format
 * @param options - Generation options
 * @param grokWeight - Percentage of traffic to Grok (default: 50)
 * @returns AI response with content, token count, timing, and selected model
 */
export async function generateResponseForContact(
  contactId: string,
  messages: OpenAI.ChatCompletionMessageParam[],
  options: AIGenerationOptions = {},
  grokWeight: number = 50
): Promise<AIResponse> {
  const model = selectModel(contactId, grokWeight);
  return generateResponse(model, messages, options);
}
