async function determine_state({ nodes }) {
  const current = nodes.get_state.state;
  const data = nodes.extract_and_score.extracted_data;
  const score = nodes.extract_and_score.lead_score;

  switch (current) {
    case 'greeting':
      return { next_state: 'qualifying' };
    case 'qualifying':
      const hasAll = data.name && data.business_type && data.team_size !== undefined && data.pain_points && data.pain_points.length > 0 && data.goals;
      return { next_state: hasAll ? 'scoring' : 'qualifying' };
    case 'scoring':
      if (score >= 70) return { next_state: 'handoff' };
      if (score < 40) return { next_state: 'completed' };
      return { next_state: 'scoring' };
    default:
      return { next_state: current };
  }
}
