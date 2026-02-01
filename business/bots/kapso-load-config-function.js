/**
 * Kapso Function Node: load-config
 *
 * Loads Sarah configuration from Convex based on phone_number_id.
 * Place this node between [start] and [sarah_agent] in the workflow.
 *
 * Environment Variables Required:
 * - CONVEX_DEPLOYMENT_URL: e.g., "https://intent-otter-212.convex.site"
 *
 * Output Variables (available to downstream nodes):
 * - vars.bot_name
 * - vars.language
 * - vars.pronoun
 * - vars.trial_link
 * - vars.system_prompt (pre-built prompt with config applied)
 */

// Default configuration (used if Convex lookup fails)
const DEFAULT_CONFIG = {
  bot_name: "Your Intern",
  language: "id",
  pronoun: "Kamu",
  trial_link: "https://my21staff.com/trial",
};

/**
 * Build system prompt with config values
 * This combines the base prompt template with customer-configured values
 *
 * @param {Object} config - Configuration object with bot_name, language, pronoun, trial_link
 * @returns {string} Complete system prompt for Sarah agent
 */
function buildSystemPrompt(config) {
  // Language instruction
  const languageInstructions = config.language === "id"
    ? "Respond in Indonesian (Bahasa Indonesia)."
    : "Respond in English.";

  // Pronoun instruction (only for Indonesian)
  const pronounInstruction = config.language === "id"
    ? `Use "${config.pronoun}" as the pronoun for addressing the customer.`
    : "";

  // Build complete prompt
  return `You are ${config.bot_name}, a friendly AI assistant for lead qualification.

${languageInstructions}
${pronounInstruction}

Your personality:
- Warm and conversational
- Keep messages under 140 characters
- NO emojis ever
- Ask one question at a time
- Qualify leads by understanding their business needs

When qualification is complete, the trial link is: ${config.trial_link}`;
}

/**
 * Build response JSON for Kapso workflow
 * Returns vars object that downstream nodes can access
 *
 * @param {Object} config - Configuration object
 * @returns {Response} JSON response with vars object
 */
function buildResponse(config) {
  return new Response(JSON.stringify({
    vars: {
      bot_name: config.bot_name,
      language: config.language,
      pronoun: config.pronoun,
      trial_link: config.trial_link,
      system_prompt: buildSystemPrompt(config),
    },
  }), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Main handler function for Kapso function node
 *
 * Flow:
 * 1. Extract phone_number_id from Kapso execution context
 * 2. If no phone_id, use defaults
 * 3. Fetch config from Convex via HTTP query API
 * 4. If Convex lookup fails, use defaults
 * 5. Return vars object for downstream nodes
 *
 * @param {Request} request - Kapso incoming request
 * @param {Object} env - Environment variables
 * @returns {Response} JSON response with config vars
 */
async function handler(request, env) {
  try {
    // Parse request body to get execution context
    const body = await request.json();
    const { execution_context } = body;

    // Extract phone_number_id from Kapso context
    // This is set automatically by Kapso when a WhatsApp message arrives
    const phoneNumberId = execution_context?.conversation?.phone_number_id;

    if (!phoneNumberId) {
      console.log("No phone_number_id in context, using defaults");
      return buildResponse(DEFAULT_CONFIG);
    }

    console.log("Loading config for phone_id:", phoneNumberId);

    // Build Convex API URL
    const convexUrl = env.CONVEX_DEPLOYMENT_URL || "https://intent-otter-212.convex.site";
    const apiUrl = `${convexUrl}/api/query`;

    // Fetch config from Convex
    // The getConfigByPhone query returns Sarah config for this phone number
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        path: "sarah/config:getConfigByPhone",
        args: { phone_id: phoneNumberId },
      }),
    });

    if (!response.ok) {
      console.error("Convex API error:", response.status, response.statusText);
      return buildResponse(DEFAULT_CONFIG);
    }

    // Parse Convex response
    const result = await response.json();

    // Convex returns { value: configObject } on success
    const config = result.value || DEFAULT_CONFIG;

    console.log("Config loaded successfully:", {
      bot_name: config.bot_name,
      language: config.language,
      pronoun: config.pronoun,
    });

    return buildResponse(config);

  } catch (error) {
    console.error("load-config error:", error.message);
    console.error("Stack:", error.stack);
    // Always return defaults on any error - graceful degradation
    return buildResponse(DEFAULT_CONFIG);
  }
}

// Export for Kapso function node
// Kapso expects: export default { fetch: handler }
export default { fetch: handler };
