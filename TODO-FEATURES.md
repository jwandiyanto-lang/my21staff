# Feature Roadmap — my21staff

**Last Updated:** 2026-01-15

Features to build based on competitor analysis (SleekFlow) and market needs.

---

## Priority 1: Must-Have

| Feature | Why | Competitor Has | Effort |
|---------|-----|----------------|--------|
| **Click-to-WhatsApp Ads trigger** | Core for lead gen businesses, auto-qualify from Meta ads | SleekFlow Premium | High |
| **Basic analytics dashboard** | Clients need to see ROI, conversation stats | SleekFlow Pro | Medium |
| **Instagram DM integration** | Second most used channel in Indonesia | SleekFlow Pro | High |
| **Facebook Messenger integration** | Complete Meta ecosystem, many SMEs use FB | SleekFlow Pro | High |

---

## Priority 2: Should-Have

| Feature | Why | Competitor Has | Effort |
|---------|-----|----------------|--------|
| **Visual Flow Builder** | Competitive parity, no-code automation | SleekFlow Pro | Very High |
| **Payment links in chat** | Close sales directly in conversation | SleekFlow (Stripe) | Medium |
| **Free tier** | Acquisition funnel, lower barrier | SleekFlow Free | Low |
| **Ad source tracking** | Know which campaign generated each lead | SleekFlow Premium | Medium |

---

## Priority 3: Nice-to-Have

| Feature | Why | Competitor Has | Effort |
|---------|-----|----------------|--------|
| **AI chatbot** | Auto-qualify leads 24/7 | SleekFlow AgentFlow | High |
| **Shopify integration** | eCommerce clients | SleekFlow | High |
| **Team performance reports** | Track agent productivity | SleekFlow Premium | Medium |
| **Role-based access (RBAC)** | Enterprise security | SleekFlow Premium | Medium |
| **Webhooks & API** | Developer integrations | SleekFlow Premium | Medium |

---

## Channel Expansion

### Current Channels
- [x] WhatsApp (via Kapso)
- [x] Telegram (via Kapso)

### To Add

| Channel | Priority | Approach | Notes |
|---------|----------|----------|-------|
| **Instagram DM** | P1 | Meta Graph API (build) | Second most popular in Indonesia |
| **Facebook Messenger** | P1 | Meta Graph API (build) | Completes Meta ecosystem |
| LINE | P3 | TBD | Important in Thailand, less so Indonesia |
| WeChat | P3 | TBD | Mostly China market |
| SMS | P3 | TBD | Expensive, declining usage |
| Webchat | P2 | TBD | Website visitor engagement |
| Email | P2 | TBD | Still relevant for B2B |

### Provider Research (2026-01-15)

| Provider | WhatsApp | Instagram | FB Messenger | Notes |
|----------|----------|-----------|--------------|-------|
| **Kapso** | ✅ | ❌ | ❌ | WhatsApp only |
| Respond.io | ✅ | ✅ | ✅ | $79+/mo, enterprise |
| Callbell | ✅ | ✅ | ✅ | €14/user, simpler |
| Trengo | ✅ | ✅ | ✅ | ~€25/user |

**Decision:** Build Instagram DM and Facebook Messenger using Meta Graph API directly. Keep Kapso for WhatsApp.

---

## Instagram DM Integration (Build with Meta Graph API)

### Requirements

| Requirement | Details |
|-------------|---------|
| **Receive DMs** | See Instagram DMs in CRM inbox |
| **Reply to DMs** | Send replies from CRM |
| **Media support** | Images, stories mentions, reels comments |
| **Contact sync** | Create CRM contact from IG conversation |
| **Story mentions** | Notify when someone mentions you |

### Technical Implementation

**Approach:** Direct Meta Graph API integration

| Component | Technology |
|-----------|------------|
| API | Meta Graph API (Instagram Messaging) |
| Auth | OAuth 2.0 with Facebook Login |
| Real-time | Webhooks |
| Storage | Supabase (conversations, messages) |

### Meta App Setup

1. Create Meta App at developers.facebook.com
2. Add "Instagram" product
3. Add "Webhooks" product
4. Request permissions:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_manage_metadata`
   - `pages_read_engagement`

### Customer Requirements

Each customer must:
1. Have Instagram Professional Account (Business or Creator)
2. Connect Instagram to a Facebook Page
3. Authorize my21staff app via OAuth

### API Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| Get conversations | `/{ig-user-id}/conversations` | GET |
| Get messages | `/{conversation-id}/messages` | GET |
| Send message | `/{ig-user-id}/messages` | POST |
| Get user profile | `/{ig-user-id}` | GET |

### Webhook Events

| Event | Description |
|-------|-------------|
| `messages` | New message received |
| `messaging_postbacks` | User clicked button |
| `messaging_seen` | Message read receipt |
| `messaging_reactions` | User reacted to message |

### Send Message Format

```json
POST /{ig-user-id}/messages
{
  "recipient": {
    "id": "{user-id}"
  },
  "message": {
    "text": "Hello from my21staff!"
  }
}
```

### Media Message

```json
{
  "recipient": { "id": "{user-id}" },
  "message": {
    "attachment": {
      "type": "image",
      "payload": {
        "url": "https://example.com/image.jpg"
      }
    }
  }
}
```

### Database Schema (Supabase)

```sql
-- Instagram connections
CREATE TABLE instagram_connections (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  ig_user_id TEXT NOT NULL,
  ig_username TEXT,
  page_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instagram conversations
CREATE TABLE instagram_conversations (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  ig_conversation_id TEXT NOT NULL,
  ig_user_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  participant_username TEXT,
  contact_id UUID REFERENCES contacts(id),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instagram messages
CREATE TABLE instagram_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES instagram_conversations(id),
  ig_message_id TEXT NOT NULL,
  direction TEXT NOT NULL, -- 'inbound' or 'outbound'
  message_type TEXT NOT NULL, -- 'text', 'image', 'story_mention', etc.
  content TEXT,
  media_url TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### App Review Requirements

| Permission | Use Case | Review Required |
|------------|----------|-----------------|
| `instagram_manage_messages` | Read/send DMs | Yes |
| `pages_manage_metadata` | Page info | Yes |

**Review timeline:** 2-4 weeks

---

## Facebook Messenger Integration (Build with Meta Graph API)

### Requirements

| Requirement | Details |
|-------------|---------|
| **Receive messages** | See FB Messenger in CRM inbox |
| **Reply to messages** | Send replies from CRM |
| **Page inbox** | Connect to Facebook Page |
| **Media support** | Images, attachments |
| **Contact sync** | Create CRM contact from FB conversation |

### Technical Implementation

**Approach:** Direct Meta Graph API integration (same Meta App as Instagram)

### Meta App Permissions (Additional)

Add to existing Meta App:
- `pages_messaging`
- `pages_read_user_content`

### Customer Requirements

Each customer must:
1. Have a Facebook Page (not personal profile)
2. Be admin of the Page
3. Authorize my21staff app via OAuth

### API Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| Get conversations | `/{page-id}/conversations` | GET |
| Get messages | `/{conversation-id}/messages` | GET |
| Send message | `/{page-id}/messages` | POST |
| Get user profile | `/{user-id}` | GET |

### Webhook Events

| Event | Description |
|-------|-------------|
| `messages` | New message received |
| `messaging_postbacks` | User clicked button |
| `messaging_optins` | User opted in |
| `message_reads` | Message read receipt |

### Send Message Format

```json
POST /{page-id}/messages
{
  "recipient": {
    "id": "{user-psid}"
  },
  "message": {
    "text": "Hello from my21staff!"
  },
  "messaging_type": "RESPONSE"
}
```

### Messaging Types

| Type | When to Use |
|------|-------------|
| `RESPONSE` | Reply within 24hr window |
| `UPDATE` | Non-promotional update |
| `MESSAGE_TAG` | Specific use cases (e.g., account update) |

### Database Schema (Supabase)

```sql
-- Facebook page connections
CREATE TABLE facebook_connections (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  page_id TEXT NOT NULL,
  page_name TEXT,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facebook conversations
CREATE TABLE facebook_conversations (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),
  fb_conversation_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  participant_psid TEXT NOT NULL,
  participant_name TEXT,
  contact_id UUID REFERENCES contacts(id),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facebook messages
CREATE TABLE facebook_messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES facebook_conversations(id),
  fb_message_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  message_type TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Unified Inbox Architecture

### Goal

Single inbox showing all channels: WhatsApp (Kapso) + Instagram + Facebook Messenger

### Unified Conversation Model

```sql
-- Unified conversations view
CREATE VIEW unified_conversations AS
SELECT
  'whatsapp' as channel,
  id, organization_id, contact_id, last_message_at
FROM whatsapp_conversations
UNION ALL
SELECT
  'instagram' as channel,
  id, organization_id, contact_id, last_message_at
FROM instagram_conversations
UNION ALL
SELECT
  'facebook' as channel,
  id, organization_id, contact_id, last_message_at
FROM facebook_conversations
ORDER BY last_message_at DESC;
```

### UI Components

| Component | Purpose |
|-----------|---------|
| Channel selector | Filter by WA/IG/FB |
| Unified inbox | All conversations sorted by recent |
| Conversation view | Messages from selected conversation |
| Contact sidebar | Contact info, linked conversations |

---

## Click-to-WhatsApp Ads (CTWA)

### What It Does

1. User clicks WhatsApp ad on Facebook/Instagram
2. Opens WhatsApp chat with your business
3. CRM captures: ad ID, campaign, ad set, creative
4. Auto-start qualification flow
5. Track conversion: ad click → lead → customer

### Requirements

| Requirement | Details |
|-------------|---------|
| **Detect CTWA entry** | Identify when conversation started from ad |
| **Capture ad metadata** | Store ad_id, campaign_id, adset_id |
| **Attribution** | Link lead to specific campaign |
| **ROI tracking** | Calculate cost per lead per campaign |

### Technical Approach

Meta passes referral data in the webhook when user clicks CTWA:
```json
{
  "referral": {
    "source_url": "https://fb.me/...",
    "source_type": "ad",
    "source_id": "ad_id",
    "headline": "Ad headline",
    "body": "Ad body text"
  }
}
```

---

## Analytics Dashboard

### MVP Metrics

| Metric | Description |
|--------|-------------|
| **Conversations** | Total, new, by channel |
| **Response time** | Average first response |
| **Leads by status** | Hot/Warm/Cold/Converted counts |
| **Conversion rate** | Lead → Customer % |
| **Messages sent** | Total outbound, by type |

### Phase 2 Metrics

| Metric | Description |
|--------|-------------|
| **Campaign attribution** | Leads per ad campaign |
| **Agent performance** | Messages handled per agent |
| **Revenue attribution** | Sales from each channel |
| **Funnel analysis** | Drop-off at each stage |

---

## Visual Flow Builder

### What It Does

No-code automation builder:
- Trigger: New message, keyword, CTWA, schedule
- Actions: Send message, update contact, assign agent, wait
- Conditions: If/else based on contact data or response

### Example Flows

1. **CTWA Welcome**: Ad click → Welcome message → Qualification questions → Route to sales
2. **Follow-up**: No reply 24hr → Send reminder → No reply 48hr → Mark cold
3. **FAQ Bot**: Keyword match → Send relevant answer → Offer human agent

### Effort: Very High

This is a significant engineering effort. Consider:
- Use existing flow builder (n8n integration?)
- Build simple rule-based automation first
- Full visual builder in v2

---

## Implementation Order

### Phase 1: Meta Channels (Next 2-3 months)

| Step | Task | Effort |
|------|------|--------|
| 1.1 | Create Meta App, configure webhooks | 1 day |
| 1.2 | Build OAuth flow for customer authorization | 3-5 days |
| 1.3 | Instagram DM: webhook → store messages | 3-5 days |
| 1.4 | Instagram DM: display in CRM inbox | 3-5 days |
| 1.5 | Instagram DM: send from inbox | 2-3 days |
| 1.6 | Facebook Messenger: webhook → store | 2-3 days |
| 1.7 | Facebook Messenger: display + send | 2-3 days |
| 1.8 | Unified inbox (WA + IG + FB) | 3-5 days |
| 1.9 | Submit for Meta App Review | 2-4 weeks wait |

**Total estimate:** 3-4 weeks dev + 2-4 weeks review

### Phase 2: Analytics + CTWA (3-6 months)

| Step | Task | Effort |
|------|------|--------|
| 2.1 | Basic analytics dashboard | 1-2 weeks |
| 2.2 | Click-to-WhatsApp Ads trigger | 1 week |
| 2.3 | Ad source tracking + attribution | 1 week |
| 2.4 | Simple automation rules | 2 weeks |

### Phase 3: Advanced (6-12 months)

| Step | Task | Effort |
|------|------|--------|
| 3.1 | Visual Flow Builder | 4-6 weeks |
| 3.2 | Payment links | 1-2 weeks |
| 3.3 | Free tier | 1 week |
| 3.4 | AI chatbot | 2-4 weeks |

---

## Notes

- ~~Check if Kapso supports Instagram/FB Messenger~~ → **Confirmed: Kapso is WhatsApp only**
- **Decision:** Build Instagram DM + FB Messenger with Meta Graph API directly
- Meta app review can take 2-4 weeks
- Same Meta App can handle both Instagram and Facebook Messenger
- Consider n8n for workflow automation backend
- Analytics can start with Google Sheets export before dashboard

---

## Resources

### Meta Developer Docs

| Resource | URL |
|----------|-----|
| Instagram Messaging API | https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging-api |
| Messenger Platform | https://developers.facebook.com/docs/messenger-platform |
| Webhooks Setup | https://developers.facebook.com/docs/graph-api/webhooks |
| App Review | https://developers.facebook.com/docs/app-review |

### Implementation Order

1. Create Meta App + configure webhooks
2. Build OAuth flow for customer authorization
3. Instagram DM: receive → store → display in inbox
4. Instagram DM: send from inbox
5. Facebook Messenger: receive → store → display
6. Facebook Messenger: send from inbox
7. Unified inbox view
8. Contact linking across channels

---

*Last updated: 2026-01-15*
