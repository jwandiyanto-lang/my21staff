# Phase 21 Research: Direct Form to CRM + Telegram Notifications

## 1. Current Form Implementation

**Location:** `src/app/pricing/page.tsx`

The pricing page already has a fully featured modal form that collects:
- **Nama** (name)
- **WhatsApp** (with country code selector: +62, +971, +65, +60, +1)
- **Jenis Bisnis** (business type)
- **Dari mana tahu my21staff** (referral source dropdown)
- **Lead sources** (multiselect: WhatsApp langsung, Instagram DM, Website/Form, Referral, Iklan, etc.)
- **Current tracking method** (how they manage leads now)
- **Leads per month** (volume estimation)
- **Biggest business problem** (pain point dropdown)
- **Team size** (people count dropdown)

**Current submission:** Form POSTs to `NEXT_PUBLIC_N8N_WEBHOOK_URL` (environment variable) with all fields as JSON. Currently connects to n8n webhook for Google Sheet storage.

---

## 2. Contacts Table Schema

**Location:** `src/types/database.ts` (lines 72-116)

```typescript
contacts: {
  Row: {
    id: string
    workspace_id: string          // Multi-tenant key
    phone: string                 // Normalized phone (+62xxx)
    name: string | null
    email: string | null
    lead_score: number            // 0-100
    lead_status: string           // 'new', 'active', 'converted', 'lost'
    tags: string[]                // Array of tag strings
    assigned_to: string | null    // User ID
    metadata: Json                // Flexible object storage
    created_at: string
    updated_at: string
  }
}
```

**Key insight:** Schema perfectly structured for form submissions. The `metadata` field can store rich data (form source, business type, pain points, team size, etc.).

---

## 3. API Route Patterns

### Pattern 1: Public Lead Submission (Webinar Registration - Template)
**Location:** `src/app/api/webinars/register/route.ts`

This endpoint is ideal to follow:
1. **Rate limiting** — IP-based rate limit (10 requests/min per IP)
2. **Phone normalization** — `phone.trim().replace(/\s+/g, '')`
3. **Contact lookup** — Checks if contact exists by workspace + phone
4. **Contact creation** — If new: inserts with defaults (lead_score: 50, lead_status: 'new', tags: ['webinar-lead'])
5. **Metadata storage** — Includes source info in metadata field
6. **Error handling** — Comprehensive error responses

### Pattern 2: Public Form Validation
**Location:** `src/lib/validations/` and `src/lib/rate-limit.ts`

Uses:
- **Zod schemas** for validation (`validateBody` function)
- **In-memory rate limiting** with `rateLimit(request, options)`
- **Phone validation patterns** available

---

## 4. Workspace Association

**Critical for multi-tenant safety:**

The pricing page form is **public and unauthenticated**.

**Decision for Phase 21:** Use **fixed workspace context** via environment variable.

```env
NEXT_PUBLIC_PRICING_WORKSPACE_ID=workspace-123-abc
```

This is MVP approach. Can upgrade to URL-param based workspace when multi-workspace landing pages are needed.

---

## 5. Telegram Bot Setup

**Steps:**
1. Create bot via @BotFather → get `TELEGRAM_BOT_TOKEN`
2. Get admin's chat ID → `TELEGRAM_CHAT_ID`

**API Pattern:**
```
POST https://api.telegram.org/bot{TOKEN}/sendMessage
{
  "chat_id": "123456789",
  "text": "New lead: John Doe (WhatsApp: +62812345678)",
  "parse_mode": "HTML"
}
```

**Recommended:** Direct API call from route (like Kapso pattern in `/api/messages/send/route.ts`).

---

## 6. Implementation Architecture

```
Pricing Form (Client)
    |
    v
POST /api/leads (New endpoint)
    |
    +---> Validate input (Zod schema)
    +---> Rate limit (IP-based)
    +---> Check if contact exists (by workspace + phone)
    +---> Create new contact (or update existing)
    +---> Send Telegram notification
    +---> Return success response
```

---

## 7. Environment Variables Needed

```env
# Telegram bot credentials
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=123456789

# Pricing form default workspace
NEXT_PUBLIC_PRICING_WORKSPACE_ID=workspace-123-abc
```

---

## 8. Files to Change

| File | Change | Scope |
|------|--------|-------|
| `src/app/api/leads/route.ts` | Create new endpoint | +150 LOC |
| `src/app/pricing/page.tsx` | Change form endpoint | ~3 LOC |
| `src/lib/telegram/client.ts` | New Telegram service | +40 LOC |
| `.env.example` | Add telegram vars | +2 LOC |

---

## 9. Code Patterns to Follow

### Rate Limiting:
```typescript
import { rateLimit } from '@/lib/rate-limit'

const rateLimitResponse = rateLimit(request, { limit: 10, windowMs: 60 * 1000 })
if (rateLimitResponse) return rateLimitResponse
```

### Validation:
```typescript
import { validateBody, z } from '@/lib/validations'

const leadSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^\+?\d{10,15}$/),
  // ... other fields
})
```

### Database Insert (from webinar endpoint):
```typescript
const { data: newContact, error } = await supabase
  .from('contacts')
  .insert({
    workspace_id: workspaceId,
    phone: normalizedPhone,
    name: name.trim(),
    lead_score: 50,
    lead_status: 'new',
    tags: ['pricing-form-lead'],
    metadata: {
      source: 'pricing_form',
      business_type: jenisBisnis,
      // ... other form fields
    },
  })
```

---

## 10. Success Criteria

- [ ] Form submission creates contact in Supabase
- [ ] Contact lookup prevents duplicates (same phone = update, not create)
- [ ] Telegram notification sends within 2 seconds
- [ ] Rate limiting works (10+ submissions = 429)
- [ ] Phone normalization handles all country codes
- [ ] Error responses are clear
