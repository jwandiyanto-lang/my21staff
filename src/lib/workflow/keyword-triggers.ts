import type { KeywordTrigger, RuleMatch, FAQTemplate } from './types';

/**
 * Normalize text for matching (lowercase, trim whitespace)
 */
function normalizeText(text: string, caseSensitive: boolean): string {
  const trimmed = text.trim();
  return caseSensitive ? trimmed : trimmed.toLowerCase();
}

/**
 * Check if message matches a keyword based on match mode
 */
function matchesKeyword(
  message: string,
  keyword: string,
  matchMode: 'exact' | 'contains' | 'starts_with',
  caseSensitive: boolean
): boolean {
  const normalizedMessage = normalizeText(message, caseSensitive);
  const normalizedKeyword = normalizeText(keyword, caseSensitive);

  switch (matchMode) {
    case 'exact':
      return normalizedMessage === normalizedKeyword;
    case 'contains':
      return normalizedMessage.includes(normalizedKeyword);
    case 'starts_with':
      return normalizedMessage.startsWith(normalizedKeyword);
    default:
      return false;
  }
}

/**
 * Match message against keyword triggers
 * Returns the first matching trigger, or null if no match
 */
export function matchKeywordTrigger(
  message: string,
  triggers: KeywordTrigger[]
): RuleMatch {
  for (const trigger of triggers) {
    if (!trigger.enabled) continue;

    for (const keyword of trigger.keywords) {
      if (matchesKeyword(message, keyword, trigger.match_mode, trigger.case_sensitive)) {
        return {
          matched: true,
          rule_id: trigger.id,
          action: trigger.action,
          response: trigger.response_template,
          metadata: { matched_keyword: keyword },
        };
      }
    }
  }

  return {
    matched: false,
    rule_id: null,
    action: 'pass_through',
  };
}

/**
 * Match message against FAQ templates
 * Returns matching FAQ response or null
 */
export function matchFAQTemplate(
  message: string,
  templates: FAQTemplate[]
): RuleMatch {
  const normalizedMessage = message.toLowerCase().trim();

  for (const template of templates) {
    if (!template.enabled) continue;

    for (const keyword of template.trigger_keywords) {
      if (normalizedMessage.includes(keyword.toLowerCase())) {
        return {
          matched: true,
          rule_id: template.id,
          action: 'faq_response',
          response: template.response,
          metadata: { matched_keyword: keyword },
        };
      }
    }
  }

  return {
    matched: false,
    rule_id: null,
    action: 'pass_through',
  };
}

/**
 * Check if message is a command (starts with ! or /)
 */
export function isCommand(message: string): boolean {
  const trimmed = message.trim();
  return trimmed.startsWith('!') || trimmed.startsWith('/');
}
