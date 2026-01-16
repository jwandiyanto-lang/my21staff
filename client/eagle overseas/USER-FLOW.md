# Eagle Overseas Education - User Flow

## Overview

Eagle Overseas Education is an overseas education consultancy helping Indonesian students study abroad. This document outlines the complete user journey from lead capture to conversion.

---

## Lead Capture Flow

### 1. Lead Entry Points

```
Instagram/Facebook Ad → Google Form → Google Sheets → n8n → Supabase CRM
                                                              ↓
WhatsApp Inquiry → Manual Entry → CRM                    WhatsApp Bot
```

### 2. Google Form Questionnaire

When a prospect fills the form, they answer:

| Field (Indonesian) | Field (English) | Purpose |
|-------------------|-----------------|---------|
| Level Bahasa Inggris | English Level | Assess readiness |
| Budget | Budget | Qualify financially |
| Kapan Mau Berangkat | Timeline | Urgency indicator |
| Aktivitas | Activity | Student/Working |
| Negara Tujuan | Target Country | Match programs |
| Remardk | Notes | Additional context |

### 3. n8n Automation Workflow

```
Google Sheets (New Row)
        ↓
   n8n Trigger
        ↓
Transform Data (normalize fields)
        ↓
Calculate Lead Score (0-100)
        ↓
Supabase Insert/Update
        ↓
WhatsApp Welcome Message (optional)
```

---

## Lead Scoring System

| Criteria | Weight | Scoring Logic |
|----------|--------|---------------|
| English Level | 30 pts | Advanced=30, Intermediate=20, Beginner=10 |
| Budget | 25 pts | High=25, Medium=15, Low=5 |
| Timeline | 20 pts | <3mo=20, 3-6mo=15, 6-12mo=10, >12mo=5 |
| Activity | 15 pts | Working=15, Student=10 |
| Target Country | 10 pts | UK/US/AU=10, Others=5 |

**Score Thresholds:**
- 80-100: Hot Lead (immediate follow-up)
- 60-79: Warm Lead (follow-up within 24h)
- 40-59: Cool Lead (nurture sequence)
- 0-39: Cold Lead (long-term nurture)

---

## CRM Dashboard Flow

### Lead Management

```
Inbox (WhatsApp) ←→ Database (All Leads)
      ↓                    ↓
Conversation View    Lead Detail View
      ↓                    ↓
Quick Replies        Score Breakdown
Merge Contacts       Activity Timeline
AI/Human Toggle      Notes
```

### Lead Status Pipeline

```
Prospect → Contacted → Qualified → Negotiating → Converted
    ↓          ↓           ↓            ↓            ↓
  (New)    (Replied)   (Interested)  (Proposal)   (Enrolled)
```

---

## Conversation Flow

### Initial Contact (AI)

1. Lead fills Google Form
2. WhatsApp welcome message sent automatically
3. AI responds to initial queries
4. AI qualifies based on responses

### Handover to Human

When AI detects:
- Complex questions about specific universities
- Visa/immigration questions
- Pricing negotiations
- Complaints or concerns

Toggle: "AI Aktif" → "Anda merespons"

### Quick Reply Templates

Pre-configured responses for common scenarios:
- Greeting / Introduction
- Program information request
- Consultation booking
- Follow-up reminder

---

## Activity Timeline

Each lead has an activity history:

| Activity Type | Description |
|--------------|-------------|
| Form Submission | Initial questionnaire completed |
| WhatsApp Message | Inbound/outbound messages |
| Status Change | Pipeline movement |
| Score Update | Lead score recalculation |
| Note Added | Staff notes/comments |
| Merge | Contact merged from duplicate |

---

## Key User Actions

### For Staff

1. **Monitor Inbox** - New messages appear with unread count
2. **View Lead Details** - Click contact to see full profile
3. **Check Score Breakdown** - Understand lead quality
4. **Add Notes** - Document conversations/decisions
5. **Merge Duplicates** - Combine contacts if same person
6. **Toggle AI/Human** - Take over or return to AI

### For Leads

1. Fill Google Form (captured)
2. Receive WhatsApp welcome
3. Chat with AI/Human
4. Book consultation
5. Receive proposal
6. Enroll

---

## Metrics to Track

| Metric | Definition |
|--------|------------|
| Response Time | Time from inquiry to first response |
| Conversion Rate | Leads → Enrolled students |
| Lead Score Accuracy | High score → Conversion correlation |
| AI Deflection Rate | % queries handled by AI |
| Follow-up Compliance | % leads followed up on time |

---

*Last updated: 2026-01-16*
