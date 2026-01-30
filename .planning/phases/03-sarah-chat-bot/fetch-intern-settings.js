async function fetch_settings({ trigger, vars, env }) {
  const deploymentUrl = env.CONVEX_DEPLOYMENT_URL || 'https://fluent-panda-464.convex.cloud';
  const workspaceId = env.WORKSPACE_ID || '1fda0f3d-a913-4a82-bc1f-a07e1cb5213c';

  try {
    const response = await fetch(`${deploymentUrl}/api/workspaces/${workspaceId}/intern-config`);

    if (response.ok) {
      const settings = await response.json();
      return {
        success: true,
        settings: settings
      };
    } else {
      return {
        success: false,
        settings: {
          persona: {
            greetingStyle: 'friendly',
            language: 'indonesian',
            tone: ['supportive', 'clear'],
            customPrompt: ''
          },
          behavior: {
            autoRespondNewLeads: true,
            handoffKeywords: ['human', 'operator', 'manager', 'cs', 'customer service'],
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
            maxMessagesBeforeHuman: 10
          },
          response: {
            maxMessageLength: 280,
            emojiUsage: 'moderate',
            priceMentions: 'ranges',
            responseDelay: 'instant'
          }
        }
      };
    }
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return {
      success: false,
      settings: {
        persona: {
          greetingStyle: 'friendly',
          language: 'indonesian',
          tone: ['supportive', 'clear'],
          customPrompt: ''
        },
        behavior: {
          autoRespondNewLeads: true,
          handoffKeywords: ['human', 'operator', 'manager'],
          quietHoursEnabled: false,
          quietHoursStart: '22:00',
          quietHoursEnd: '08:00',
          maxMessagesBeforeHuman: 10
        },
        response: {
          maxMessageLength: 280,
          emojiUsage: 'moderate',
          priceMentions: 'ranges',
          responseDelay: 'instant'
        }
      }
    };
  }
}
