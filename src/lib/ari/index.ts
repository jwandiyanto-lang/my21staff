/**
 * ARI (AI Receptionist Indonesia) Module
 *
 * Multi-LLM AI system for lead qualification and conversation management
 */

// Types
export type {
  AIModelType,
  AIResponse,
  ARIState,
  LeadTemperature,
  LeadData,
  ScoreBreakdown,
  ARIContext,
  ARITone,
  ARIConfig,
  ARIDestination,
  ARIConversation,
  ARIMessage,
  ARIPayment,
  ARIAppointment,
  ARIAIComparison,
  ARIConfigInsert,
  ARIConfigUpdate,
  ARIConversationInsert,
  ARIConversationUpdate,
  ARIMessageInsert,
} from './types';

export { STATE_TRANSITIONS } from './types';

// AI Router
export {
  selectModel,
  generateResponse,
  generateResponseForContact,
  type AIGenerationOptions,
} from './ai-router';

// Individual clients (for direct access if needed)
export {
  generateGrokResponse,
  checkGrokHealth,
  grokClient,
  type GrokOptions,
} from './clients/grok';

export {
  generateSealionResponse,
  checkSealionHealth,
  sealionClient,
  SEALION_MODEL,
  type SealionOptions,
} from './clients/sealion';
