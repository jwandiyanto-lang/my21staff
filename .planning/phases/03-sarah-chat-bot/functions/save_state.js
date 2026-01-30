async function save_state({ trigger, nodes, env }) {
  const phone = trigger.contact.phone;
  const convexUrl = env.CONVEX_DEPLOYMENT_URL || 'https://intent-otter-212.convex.cloud';

  // Detect language from message
  const message = (trigger.message.content || '').toLowerCase();
  const indonesianPatterns = /halo|hai|selamat|ada|nggak|gak|ya|yah|sih|kakak/;
  const englishPatterns = /hi|hello|hey|yeah|okay|sure|thanks/;

  let language = nodes.get_state.language || 'id';
  if (englishPatterns.test(message) && !indonesianPatterns.test(message)) {
    language = 'en';
  } else if (indonesianPatterns.test(message)) {
    language = 'id';
  }

  try {
    await fetch(`${convexUrl}/sarah/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contact_phone: phone,
        state: nodes.determine_state.next_state,
        lead_score: nodes.extract_and_score.lead_score,
        lead_temperature: nodes.extract_and_score.lead_temperature,
        extracted_data: nodes.extract_and_score.extracted_data,
        language: language,
        message_count: nodes.get_state.message_count + 1
      })
    });
    return { saved: true };
  } catch (error) {
    console.error('Save failed:', error);
    return { saved: false };
  }
}
