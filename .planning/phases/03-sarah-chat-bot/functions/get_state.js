async function get_state({ trigger, vars, env }) {
  const phone = trigger.contact.phone;
  const convexUrl = env.CONVEX_DEPLOYMENT_URL || 'https://intent-otter-212.convex.cloud';

  try {
    const response = await fetch(`${convexUrl}/sarah/state?contact_phone=${encodeURIComponent(phone)}`);
    const state = await response.json();

    return {
      state: state.state || 'greeting',
      extracted_data: state.extracted_data || {},
      lead_score: state.lead_score || 0,
      lead_temperature: state.lead_temperature || 'cold',
      language: state.language || 'id',
      message_count: state.message_count || 0
    };
  } catch (error) {
    console.error('Failed to get state:', error);
    return {
      state: 'greeting',
      extracted_data: {},
      lead_score: 0,
      lead_temperature: 'cold',
      language: 'id',
      message_count: 0
    };
  }
}
