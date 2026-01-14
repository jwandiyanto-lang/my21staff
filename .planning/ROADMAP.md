# Roadmap: my21staff v2

## Overview

Rebuild of my21staff with focus on completing core CRM features: a proper lead database view, functional two-way WhatsApp messaging via Kapso, and a Website Manager for content-driven lead generation. Foundation copied from v1, then systematically completing what was half-built.

## Domain Expertise

None

## Phases

- [ ] **Phase 1: Foundation** - Auth, workspace, database schema from v1
- [ ] **Phase 2: Database View** - Lead table with form answers, status badges, filters
- [ ] **Phase 3: Inbox Core** - Load message history, conversation list, filtering
- [ ] **Phase 4: Inbox Send** - Wire Kapso Send API, optimistic UI
- [ ] **Phase 5: Website Manager** - CMS for articles/webinars, registration flows

## Phase Details

### Phase 1: Foundation
**Goal**: Working auth, workspace architecture, and database schema copied from v1
**Depends on**: Nothing (first phase)
**Research**: Unlikely (copying established v1 patterns)
**Plans**: TBD

### Phase 2: Database View
**Goal**: Lead table showing all contacts with form submission answers, status badges (Hot/Warm/Cold/Converted), expandable detail sheet, and filters
**Depends on**: Phase 1
**Research**: Unlikely (internal UI patterns)
**Plans**: TBD

### Phase 3: Inbox Core
**Goal**: Conversation list with message history loaded from Kapso, filtering by lead status
**Depends on**: Phase 2
**Research**: Likely (Kapso API integration)
**Research topics**: Kapso API docs for fetching messages, pagination patterns, webhook handling
**Plans**: TBD

### Phase 4: Inbox Send
**Goal**: Wire up Send button to Kapso API with optimistic UI for sent messages
**Depends on**: Phase 3
**Research**: Likely (Kapso send API)
**Research topics**: Kapso send message endpoint, request format, rate limits, error handling
**Plans**: TBD

### Phase 5: Website Manager
**Goal**: CMS for articles and webinars with public pages, webinar registration flows that create contacts in CRM
**Depends on**: Phase 1 (only needs foundation)
**Research**: Unlikely (standard CMS patterns with Supabase)
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-01-14 |
| 2. Database View | 3/3 | Complete | 2026-01-14 |
| 3. Inbox Core | 1/3 | In progress | - |
| 4. Inbox Send | 0/TBD | Not started | - |
| 5. Website Manager | 0/TBD | Not started | - |
