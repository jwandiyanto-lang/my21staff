async function check_keywords({ trigger }) {
  const message = (trigger.message.content || '').toLowerCase();

  const handoffKeywords = ['human', 'manusia', 'person', 'sales', 'consultant', 'talk to someone', 'operator', 'cs', 'customer service'];
  const wantsHandoff = handoffKeywords.some(k => message.includes(k));

  const notInterestedKeywords = ['not interested', 'tidak tertarik', 'no thanks', 'ga jadi', 'nggak dulu'];
  const notInterested = notInterestedKeywords.some(k => message.includes(k));

  return {
    wants_handoff: wantsHandoff,
    not_interested: notInterested,
    is_image: trigger.message.type === 'image'
  };
}
