# Phase 22: Settings Page (CSV, Team Invites, Pricing Form) - Research

**Researched:** 2026-01-17
**Domain:** Data management, team invitations, SMTP email, form API
**Confidence:** HIGH

## Summary

This phase implements three key settings features: CSV import/export for contacts and notes, team member invitation via email with magic links, and a public API endpoint for the pricing form to capture leads directly into the CRM.

The project already has robust patterns for:
- User creation with `createAdminClient()` (bypasses RLS)
- Zod validation schemas for contacts
- Workspace membership verification
- Contact upsert via webhook (phone-based deduplication)

**Primary recommendation:** Use PapaParse for CSV (fastest, most forgiving), Nodemailer for SMTP (Hostinger settings verified), and leverage Supabase's `generateLink()` for invitation tokens rather than `inviteUserByEmail()` since we want custom SMTP via Nodemailer.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| papaparse | ^5.4.x | CSV parsing and generation | Fastest browser/node CSV parser, handles malformed data gracefully |
| nodemailer | ^6.9.x | SMTP email sending | De-facto Node.js email library, works with any SMTP provider |
| zod | ^4.3.5 | Already in project | Input validation for CSV rows and form data |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | ^2.90.1 | Already in project | Admin client for user creation, generateLink for invites |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PapaParse | csv-parse | csv-parse more configurable but slower, PapaParse handles edge cases better |
| Nodemailer | Resend SDK | Resend requires external account; Nodemailer works with existing Hostinger SMTP |
| Custom invite | Supabase inviteUserByEmail | inviteUserByEmail requires Supabase SMTP config; we want custom SMTP for branding |

**Installation:**
```bash
npm install papaparse nodemailer
npm install -D @types/papaparse @types/nodemailer
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── leads/
│   │   │   └── route.ts           # Public endpoint for pricing form
│   │   ├── contacts/
│   │   │   ├── export/
│   │   │   │   └── route.ts       # CSV export endpoint
│   │   │   └── import/
│   │   │       └── route.ts       # CSV import endpoint
│   │   └── invitations/
│   │       ├── route.ts           # Create invitation
│   │       └── accept/
│   │           └── route.ts       # Accept invitation (magic link handler)
│   └── (dashboard)/
│       └── [workspace]/
│           └── settings/
│               ├── page.tsx       # Settings overview
│               ├── data/
│               │   └── page.tsx   # CSV import/export UI
│               └── team/
│                   └── page.tsx   # Team member management
├── lib/
│   ├── email/
│   │   └── transporter.ts         # Nodemailer configuration
│   └── validations/
│       ├── csv.ts                 # CSV row validation schemas
│       └── invitation.ts          # Invitation validation
└── types/
    └── database.ts                # Add Invitation type
```

### Pattern 1: CSV Import with Preview

**What:** Two-step import: upload for preview, then confirm to import
**When to use:** When importing data that might have errors
**Example:**
```typescript
// Source: PapaParse docs + existing webhook pattern
import Papa from 'papaparse'
import { z } from 'zod'

const contactRowSchema = z.object({
  name: z.string().max(255).optional(),
  phone: z.string().regex(/^\+?\d{10,15}$/),  // Required, validates phone
  email: z.string().email().optional().nullable(),
  tags: z.string().optional(),  // Comma-separated, will be split
  lead_status: z.enum(['new', 'hot', 'warm', 'cold', 'converted', 'lost']).optional(),
  lead_score: z.coerce.number().int().min(0).max(100).optional(),
})

// Preview endpoint - validate but don't save
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const text = await file.text()

  const { data, errors, meta } = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, '_'),
  })

  const validatedRows = data.map((row, index) => {
    const result = contactRowSchema.safeParse(row)
    return {
      row: index + 1,
      data: row,
      valid: result.success,
      errors: result.success ? [] : result.error.issues,
    }
  })

  return NextResponse.json({
    totalRows: data.length,
    validRows: validatedRows.filter(r => r.valid).length,
    preview: validatedRows.slice(0, 10),
    parseErrors: errors,
  })
}
```

### Pattern 2: Batch Upsert with Progress

**What:** Insert or update contacts based on phone uniqueness per workspace
**When to use:** Importing contacts that may already exist
**Example:**
```typescript
// Source: Existing webhook contact creation pattern
async function batchUpsertContacts(
  supabase: SupabaseClient,
  workspaceId: string,
  rows: ValidatedRow[]
): Promise<{ created: number; updated: number; errors: Error[] }> {
  const results = { created: 0, updated: 0, errors: [] as Error[] }

  // Process in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50)
    const phones = batch.map(r => r.phone)

    // Get existing contacts
    const { data: existing } = await supabase
      .from('contacts')
      .select('id, phone')
      .eq('workspace_id', workspaceId)
      .in('phone', phones)

    const existingPhones = new Set(existing?.map(c => c.phone) || [])

    // Split into inserts and updates
    const toInsert = batch.filter(r => !existingPhones.has(r.phone))
    const toUpdate = batch.filter(r => existingPhones.has(r.phone))

    // Batch insert
    if (toInsert.length > 0) {
      const { error } = await supabase
        .from('contacts')
        .insert(toInsert.map(r => ({
          workspace_id: workspaceId,
          phone: r.phone,
          name: r.name || null,
          email: r.email || null,
          tags: r.tags?.split(',').map(t => t.trim()) || [],
          lead_status: r.lead_status || 'new',
          lead_score: r.lead_score || 0,
        })))

      if (error) results.errors.push(error)
      else results.created += toInsert.length
    }

    // Individual updates (to handle different fields per row)
    for (const row of toUpdate) {
      const existingContact = existing?.find(c => c.phone === row.phone)
      if (!existingContact) continue

      const { error } = await supabase
        .from('contacts')
        .update({
          name: row.name || undefined,
          email: row.email || undefined,
          tags: row.tags?.split(',').map(t => t.trim()) || undefined,
          lead_status: row.lead_status || undefined,
          lead_score: row.lead_score || undefined,
        })
        .eq('id', existingContact.id)

      if (error) results.errors.push(error)
      else results.updated++
    }
  }

  return results
}
```

### Pattern 3: Team Invitation Flow

**What:** Generate invite link, send via Nodemailer, track pending invitations
**When to use:** Inviting team members to workspace
**Example:**
```typescript
// Source: Supabase generateLink docs + Nodemailer + existing admin client pattern
import { createApiAdminClient } from '@/lib/supabase/server'
import { sendInvitationEmail } from '@/lib/email/transporter'

export async function POST(request: NextRequest) {
  const { email, workspaceId, role = 'member' } = await request.json()

  const adminClient = createApiAdminClient()

  // Generate invitation link (creates user if not exists)
  const { data: linkData, error } = await adminClient.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/invitation/accept`,
    },
  })

  if (error) throw error

  // Store invitation record in workspace_invitations table
  const { data: invitation } = await adminClient
    .from('workspace_invitations')
    .insert({
      workspace_id: workspaceId,
      email,
      role,
      token: linkData.properties.hashed_token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      status: 'pending',
    })
    .select()
    .single()

  // Send email via Nodemailer
  await sendInvitationEmail({
    to: email,
    inviteLink: linkData.properties.action_link,
    workspaceName: 'Your Workspace', // Fetch from DB
    inviterName: 'Admin', // Current user
  })

  return NextResponse.json({ invitation })
}
```

### Pattern 4: Nodemailer Transporter

**What:** Reusable SMTP transporter for Hostinger
**When to use:** All email sending
**Example:**
```typescript
// Source: Nodemailer docs + Hostinger SMTP settings
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,      // smtp.hostinger.com
  port: parseInt(process.env.SMTP_PORT || '587'),  // 587 for TLS
  secure: process.env.SMTP_PORT === '465',  // true for 465, false for 587
  auth: {
    user: process.env.SMTP_USER,    // Full email: no-reply@my21staff.com
    pass: process.env.SMTP_PASS,
  },
})

export async function sendInvitationEmail({
  to,
  inviteLink,
  workspaceName,
  inviterName,
}: {
  to: string
  inviteLink: string
  workspaceName: string
  inviterName: string
}) {
  await transporter.sendMail({
    from: `"my21staff" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `Anda diundang ke ${workspaceName}`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Undangan Bergabung</h2>
        <p>${inviterName} mengundang Anda untuk bergabung ke <strong>${workspaceName}</strong> di my21staff.</p>
        <p>
          <a href="${inviteLink}"
             style="display: inline-block; background: #F7931A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
            Terima Undangan
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">Link ini berlaku selama 7 hari.</p>
      </div>
    `,
  })
}
```

### Pattern 5: Public API for Pricing Form

**What:** Unauthenticated endpoint that creates contacts in a specific workspace
**When to use:** Form submissions from public landing page
**Example:**
```typescript
// Source: Existing webhook pattern + admin client
const MY21STAFF_WORKSPACE_ID = '0318fda5-22c4-419b-bdd8-04471b818d17'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validate input
  const { nama, whatsapp, jenisBisnis, paket, ...metadata } = body

  if (!nama || !whatsapp) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const adminClient = createApiAdminClient()

  // Normalize phone number
  const phone = whatsapp.replace(/\D/g, '').replace(/^0/, '+62')

  // Check if contact exists
  const { data: existing } = await adminClient
    .from('contacts')
    .select('id')
    .eq('workspace_id', MY21STAFF_WORKSPACE_ID)
    .eq('phone', phone)
    .single()

  if (existing) {
    // Update existing contact, add tags
    const { data: contact } = await adminClient
      .from('contacts')
      .update({
        name: nama,
        metadata: { ...metadata, jenisBisnis, paket },
        tags: ['pricing-form', paket.toLowerCase()],
      })
      .eq('id', existing.id)
      .select()
      .single()

    return NextResponse.json({ contact, status: 'updated' })
  }

  // Create new contact
  const { data: contact, error } = await adminClient
    .from('contacts')
    .insert({
      workspace_id: MY21STAFF_WORKSPACE_ID,
      phone,
      name: nama,
      lead_status: 'new',
      lead_score: 50,  // Interested enough to fill form
      tags: ['pricing-form', paket.toLowerCase()],
      metadata: { ...metadata, jenisBisnis, paket },
    })
    .select()
    .single()

  if (error) {
    console.error('Lead creation error:', error)
    return NextResponse.json({ error: 'Failed to save lead' }, { status: 500 })
  }

  // Optional: Send Telegram notification
  // await sendTelegramNotification({ contact, paket })

  return NextResponse.json({ contact, status: 'created' })
}
```

### Anti-Patterns to Avoid

- **Reading entire file into memory:** Use streaming for large CSV files if needed (PapaParse supports step mode)
- **Sending invites with inviteUserByEmail:** Requires Supabase SMTP config; use generateLink + Nodemailer for custom branding
- **Storing plain passwords:** Use Supabase magic link flow, never temp passwords (unless user explicitly requests)
- **Processing imports synchronously:** For large files, consider background processing with progress updates
- **Not validating phone format:** Different countries have different formats; normalize to E.164 (+[country][number])

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSV parsing | Custom string splitting | PapaParse | Handles quotes, escapes, malformed data |
| SMTP email | HTTP to SMTP gateway | Nodemailer | Handles auth, TLS, attachments properly |
| Invitation tokens | Custom UUID tokens | Supabase generateLink | Secure, built-in expiry, handles user creation |
| Phone normalization | Regex per country | Normalize to E.164 format | International standard |
| CSV generation | Manual string building | Papa.unparse() | Proper escaping, handles special characters |

**Key insight:** CSV and email are deceptively complex. Edge cases (quoted values, special characters, SMTP authentication) are handled by mature libraries.

## Common Pitfalls

### Pitfall 1: CSV Header Mismatch

**What goes wrong:** Users upload CSV with different headers (Name vs name, Phone Number vs phone)
**Why it happens:** No standardization of export sources
**How to avoid:** Normalize headers with `transformHeader` option in PapaParse
**Warning signs:** Empty columns, "undefined" values in preview

### Pitfall 2: Duplicate Phone Numbers in Import

**What goes wrong:** Same phone appears multiple times in CSV, causing unique constraint violations
**Why it happens:** User exports from multiple sources
**How to avoid:** Deduplicate in preview step, show warning
**Warning signs:** Import errors on batch insert

### Pitfall 3: Invitation Links Expire

**What goes wrong:** User clicks old invite link, gets error
**Why it happens:** Default Supabase link expiry is short
**How to avoid:** Store expiry in workspace_invitations table, check before accepting
**Warning signs:** "Invalid token" errors, support requests

### Pitfall 4: SMTP Connection Failures

**What goes wrong:** Emails don't send, no error visible to user
**Why it happens:** Wrong port, firewall, credentials expired
**How to avoid:** Test SMTP on startup, log errors, show invitation status
**Warning signs:** All invitations stuck in "pending"

### Pitfall 5: Phone Number Format Inconsistency

**What goes wrong:** Same person imported as +6281234567890 and 081234567890
**Why it happens:** Different sources, different formats
**How to avoid:** Normalize all phones to E.164 format before storage
**Warning signs:** Duplicate contacts, failed deduplication

## Code Examples

### CSV Export Endpoint

```typescript
// Source: PapaParse unparse + Next.js streaming
import Papa from 'papaparse'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspace')
  const type = searchParams.get('type') // 'contacts' | 'notes'

  // Auth check...

  const supabase = await createClient()

  if (type === 'contacts') {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('name, phone, email, lead_status, lead_score, tags, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    const csv = Papa.unparse(contacts?.map(c => ({
      ...c,
      tags: c.tags?.join(', ') || '',
    })) || [])

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts-${Date.now()}.csv"`,
      },
    })
  }

  // Handle notes export similarly...
}
```

### CSV Template Download

```typescript
const CONTACTS_TEMPLATE_HEADERS = [
  'name',
  'phone',
  'email',
  'tags',
  'lead_status',
  'lead_score',
]

const CONTACTS_TEMPLATE_EXAMPLE = [
  {
    name: 'John Doe',
    phone: '+6281234567890',
    email: 'john@example.com',
    tags: 'hot-lead, instagram',
    lead_status: 'warm',
    lead_score: '75',
  },
]

export async function GET() {
  const csv = Papa.unparse({
    fields: CONTACTS_TEMPLATE_HEADERS,
    data: CONTACTS_TEMPLATE_EXAMPLE,
  })

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="contacts-template.csv"',
    },
  })
}
```

### Invitation Status Tracking

```typescript
// Check invitation status before accepting
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  const supabase = createApiAdminClient()

  const { data: invitation } = await supabase
    .from('workspace_invitations')
    .select('*, workspace:workspaces(name)')
    .eq('token', token)
    .single()

  if (!invitation) {
    return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
  }

  if (invitation.status !== 'pending') {
    return NextResponse.json({ error: 'Invitation already used' }, { status: 400 })
  }

  if (new Date(invitation.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation expired' }, { status: 400 })
  }

  return NextResponse.json({ invitation })
}
```

## Database Schema for Invitations

```sql
-- Migration: 19_workspace_invitations.sql
CREATE TABLE workspace_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'expired', 'cancelled'
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_workspace ON workspace_invitations(workspace_id);
CREATE INDEX idx_invitations_email ON workspace_invitations(email);
CREATE INDEX idx_invitations_token ON workspace_invitations(token);
CREATE INDEX idx_invitations_status ON workspace_invitations(status);

-- RLS: Only workspace admins/owners can view invitations
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invitations" ON workspace_invitations
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage invitations" ON workspace_invitations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

## Environment Variables

```bash
# SMTP Configuration (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=no-reply@my21staff.com
SMTP_PASS=your-email-password
SMTP_FROM=no-reply@my21staff.com

# App URL for invite links
NEXT_PUBLIC_APP_URL=https://app.my21staff.com
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SMTP in Supabase dashboard | generateLink + custom Nodemailer | 2024 | Full control over email branding |
| Temp password invites | Magic link invites | 2023 | More secure, better UX |
| Full file read for CSV | Streaming with step callback | Always available | Handle large files |

**Deprecated/outdated:**
- Port 25 for SMTP: Blocked by most providers, use 587 or 465
- HTTP basic auth for APIs: Use proper bearer tokens or API keys

## Open Questions

1. **Large CSV handling**
   - What we know: PapaParse supports streaming via step callback
   - What's unclear: Whether to implement background processing for 10k+ rows
   - Recommendation: Start with synchronous, add background if needed

2. **Telegram notifications for leads**
   - What we know: Scope mentions it as optional
   - What's unclear: Which Telegram bot, notification format
   - Recommendation: Defer to separate phase or implement as n8n webhook

## Sources

### Primary (HIGH confidence)
- PapaParse official docs (https://www.papaparse.com/docs) - Parsing/unparsing API
- Supabase JS reference - generateLink, inviteUserByEmail
- Hostinger SMTP settings (https://www.hostinger.com/support/)

### Secondary (MEDIUM confidence)
- Nodemailer with Next.js tutorials (mailtrap.io, dev.to)
- Supabase custom SMTP docs

### Tertiary (LOW confidence)
- WebSearch for best practices (verified with official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Libraries verified with official docs
- Architecture: HIGH - Based on existing codebase patterns
- Pitfalls: MEDIUM - Based on common issues in similar implementations

**Research date:** 2026-01-17
**Valid until:** 2026-02-17 (30 days - stable libraries)
