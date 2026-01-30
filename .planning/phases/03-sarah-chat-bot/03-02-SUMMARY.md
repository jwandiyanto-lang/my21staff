---
phase: 03-sarah-chat-bot
plan: 02
subsystem: database
tags: [convex, database, api, http-endpoints, kapso]

# Dependency graph
requires:
  - phase: 02_5-settings-and-configuration
    provides: Kapso webhook infrastructure and Convex database setup
provides:
  - sarahConversations table for conversation state storage
  - HTTP endpoints for Kapso Function node integration
  - Dashboard query functions for lead list and analytics
affects:
  - Phase 03-03: Sarah Kapso workflow integration
  - Phase 06: Dashboard lead display

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "HTTP action pattern for external service integration"
    - "Phone-indexed document storage for conversation state"

key-files:
  created:
    - convex/sarah.ts
  modified:
    - convex/schema.ts
    - convex/http.ts

key-decisions:
  - "Created dedicated sarahConversations table with phone as primary identifier"
  - "Used HTTP actions for Kapso integration instead of scheduler-based polling"
  - "Exported 4 public functions: getSarahConversation, upsertSarahState, getSarahLeads, getSarahStats"

patterns-established:
  - "HTTP endpoint pattern: GET returns state, POST upserts state"
  - "Dashboard query pattern: filterable list + aggregate stats"

# Metrics
duration: 3min
completed: 2026-01-30
---

# Phase 3 Plan 2: Sarah Convex Data Layer Summary

**Convex schema and HTTP endpoints for Sarah bot state storage, enabling Kapso workflow integration and dashboard lead display.**

## Overview

This plan establishes the data persistence layer for Sarah, the Indonesian SME qualification bot. The implementation enables Kapso workflows to save and retrieve conversation state via HTTP endpoints, and provides query functions for the dashboard to display lead data and analytics.

## Implementation Details

### Schema: sarahConversations Table

The new `sarahConversations` table stores all Sarah conversation state:

| Field | Type | Description |
|-------|------|-------------|
| `contact_phone` | string | Primary identifier (normalized phone) |
| `workspace_id` | optional string | Workspace reference |
| `state` | string | Flow state: greeting, qualifying, scoring, handoff, completed |
| `lead_score` | number | 0-100 qualification score |
| `lead_temperature` | string | hot, warm, or cold |
| `extracted_data` | object | 4-slot extraction: name, business_type, team_size, pain_points, goals |
| `language` | string | id or en |
| `message_count` | number | Total messages exchanged |
| `created_at` | number | Conversation start timestamp |
| `updated_at` | number | Last update timestamp |
| `last_message_at` | number | Last message timestamp |

**Indexes:** by_phone, by_temperature, by_score

### HTTP Endpoints for Kapso

**GET /sarah/state?contact_phone=+62xxx**
- Returns current conversation state or default state for new conversations
- Called by Kapso before processing each message

**POST /sarah/state**
- Body: { contact_phone, state, lead_score, lead_temperature, extracted_data, language, message_count }
- Upserts conversation record (create if new, update if exists)
- Called by Kapso after each message

### Dashboard Query Functions

- `getSarahLeads(temperature?, limit?)` - Filtered lead list by temperature
- `getSarahStats()` - Aggregate statistics: total, hot, warm, cold, avgScore
- `getSarahConversation(contact_phone)` - Single conversation details

## Exported API

```typescript
// Query functions (for dashboard)
export const getSarahConversation: QueryArgs<{ contact_phone: string }>
export const getSarahLeads: QueryArgs<{ temperature?: string; limit?: number }>
export const getSarahStats: QueryArgs<{}>

// HTTP actions (for Kapso integration)
export const getSarahState: HttpAction
export const upsertSarahState: HttpAction
```

## Usage in Kapso Workflow

Kapso Function nodes can call the Convex HTTP endpoints:

```javascript
// After processing a message
await fetch('https://[deployment].convex.cloud/sarah/state', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contact_phone: message.from,
    state: 'qualifying',
    lead_score: 45,
    lead_temperature: 'warm',
    extracted_data: { name: 'Budi', business_type: 'restaurant', team_size: 5 },
    language: 'id',
    message_count: 3
  })
});
```

## Deviations from Plan

None - plan executed exactly as written. The existing ariConversations table was not extended; instead, a dedicated sarahConversations table was created for cleaner separation of concerns.

## Verification

- [x] Convex schema deploys without errors
- [x] HTTP endpoint GET /sarah/state returns conversation state
- [x] HTTP endpoint POST /sarah/state upserts state
- [x] getSarahLeads returns leads filtered by temperature
- [x] getSarahStats returns aggregate statistics
- [x] All functions work with `npx convex dev`

## Next Steps

This plan completes the data layer. Phase 03-03 will integrate Sarah with Kapso workflows using these endpoints.
