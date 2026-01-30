async function extract_and_score({ trigger, nodes }) {
  const message = trigger.message.content || '';
  const currentData = nodes.get_state.extracted_data || {};
  let extracted = { ...currentData };

  // Name extraction
  if (!extracted.name && nodes.get_state.state === 'greeting') {
    const words = message.trim().split(/\s+/);
    if (words.length <= 3) extracted.name = message.trim();
  }

  // Business type extraction
  const businessPatterns = [
    /bisnis\s+(.+)/i,
    /jualan\s+(.+)/i,
    /toko\s+(.+)/i,
    /restaurant|cafe|f&b|food|spa|wellness|fashion|online shop|e-commerce/i
  ];
  if (!extracted.business_type) {
    for (const pattern of businessPatterns) {
      const match = message.match(pattern);
      if (match) {
        extracted.business_type = match[1] || match[0];
        break;
      }
    }
  }

  // Team size extraction
  const teamMatch = message.match(/(\d+)\s*(orang|people|person)/i);
  if (teamMatch && !extracted.team_size) {
    extracted.team_size = parseInt(teamMatch[1]);
  }

  // Pain points extraction
  const painKeywords = {
    high: ['kewalahan', 'overwhelmed', 'miss message', 'slow response', 'lambat', 'complaint'],
    medium: ['busy', 'sibuk', 'need help', 'growth', 'growing', 'manual'],
    low: ['curious', 'penasaran', 'checking', 'lihat-lihat', 'maybe']
  };

  if (!extracted.pain_points) extracted.pain_points = [];

  const lowerMessage = message.toLowerCase();
  let urgency = 'low';

  for (const [level, keywords] of Object.entries(painKeywords)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        if (!extracted.pain_points.includes(keyword)) extracted.pain_points.push(keyword);
        if (level === 'high') urgency = 'high';
        else if (level === 'medium' && urgency !== 'high') urgency = 'medium';
      }
    }
  }

  // Goals extraction
  const goalPatterns = [/pengen\s+(.+)/i, /mau\s+(.+)/i, /butuh\s+(.+)/i, /want\s+(.+)/i, /need\s+(.+)/i];
  if (!extracted.goals) {
    for (const pattern of goalPatterns) {
      const match = message.match(pattern);
      if (match) {
        extracted.goals = match[1];
        break;
      }
    }
  }

  // Calculate score (0-100)
  let score = 0;
  if (extracted.name) score += 5;
  if (extracted.business_type) score += 10;
  if (extracted.goals) score += 10;
  if (extracted.team_size >= 3) score += 20;
  else if (extracted.team_size === 2) score += 15;
  else if (extracted.team_size === 1) score += 10;
  if (urgency === 'high') score += 30;
  else if (urgency === 'medium') score += 20;
  else if (extracted.pain_points.length > 0) score += 10;
  score += 15; // Engagement points

  // Determine temperature
  let temperature = 'cold';
  if (score >= 70) temperature = 'hot';
  else if (score >= 40) temperature = 'warm';

  return {
    extracted_data: extracted,
    lead_score: Math.min(score, 100),
    lead_temperature: temperature
  };
}
