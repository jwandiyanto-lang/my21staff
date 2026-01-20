/**
 * ARI (AI Receptionist Indonesia) Module
 *
 * Multi-LLM AI system for lead qualification and conversation management
 */

// ===========================================
// Types
// ===========================================

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

// ===========================================
// State Machine
// ===========================================

export {
  STATE_TRANSITIONS,
  canTransition,
  getNextState,
  shouldAutoHandoff,
  getStateDescription,
} from './state-machine';

// ===========================================
// Context Builder
// ===========================================

export {
  getTimeBasedGreeting,
  extractFormAnswers,
  buildSystemPrompt,
  buildMessageHistory,
  buildChatMessages,
  type PromptContext,
  type ChatMessage,
} from './context-builder';

// ===========================================
// AI Router
// ===========================================

export {
  selectModel,
  generateResponse,
  generateResponseForContact,
  type AIGenerationOptions,
} from './ai-router';

// ===========================================
// Individual Clients (for direct access if needed)
// ===========================================

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

// ===========================================
// Form Validation & Qualification
// ===========================================

export {
  // Field detection
  REQUIRED_FIELDS,
  IMPORTANT_FIELDS,
  getMissingFields,
  hasAllRequiredFields,
  getFieldLabel,
  getFollowUpQuestion,
  // Document tracking
  INITIAL_DOCUMENT_STATUS,
  getDocumentQuestions,
  parseDocumentResponse,
  updateDocumentStatus,
  getNextDocumentQuestion,
  getNextDocumentKey,
  allDocumentsAsked,
  getDocumentSummary,
  // Types
  type RequiredField,
  type ImportantField,
  type MissingFieldsResult,
  type DocumentStatus,
} from './qualification';
