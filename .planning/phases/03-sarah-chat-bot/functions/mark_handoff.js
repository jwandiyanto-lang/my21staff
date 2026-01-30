async function mark_handoff({ trigger, nodes, env }) {
  const phone = trigger.contact.phone;
  const convexUrl = env.CONVEX_DEPLOYMENT_URL || 'https://intent-otter-212.convex.cloud';

  await fetch(`${convexUrl}/sarah/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contact_phone: phone,
      state: 'handoff',
      lead_score: nodes.get_state.lead_score,
      lead_temperature: 'hot',
      extracted_data: nodes.get_state.extracted_data,
      language: nodes.get_state.language,
      message_count: nodes.get_state.message_count + 1
    })
  });

  return { saved: true };
}
