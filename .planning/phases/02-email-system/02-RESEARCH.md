# Phase 2: Email System + Member Onboarding - Research

**Researched:** 2026-01-18
**Domain:** Transactional email, member invitations, onboarding flows
**Confidence:** HIGH

## Summary

This phase replaces the broken nodemailer/SMTP setup with Resend's HTTP API for reliable email delivery from Vercel. The member invitation flow already exists but needs email delivery fixed and templates upgraded to React Email for branded, reusable components.

The current implementation uses Supabase's `generateLink()` with type `recovery` for password setup links - this is the correct pattern when using custom email sending. Resend is already installed (`^6.7.0`) but not configured. The invitation database schema and API routes are complete.

**Primary recommendation:** Replace `nodemailer` with Resend SDK for email sending, create React Email templates for branded emails, and enhance the onboarding UX for invited members. DNS authentication (SPF, DKIM, DMARC) via Resend dashboard is required for reliable delivery.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| resend | ^6.7.0 | HTTP email API | Already installed; works from Vercel (no SMTP DNS issues) |
| @react-email/components | ^0.0.x | Email template components | Official pairing with Resend; tested on Gmail/Outlook/Apple Mail |
| react-email | ^3.0.x (dev) | Preview server for templates | Local development preview of emails |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @supabase/supabase-js | ^2.90.1 | Already in project | generateLink for invite/recovery tokens |
| zod | ^4.3.5 | Already in project | Validate email addresses, invitation data |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | SendGrid, Postmark | Resend has best React integration; already installed |
| React Email | MJML, email-templates | React Email uses familiar JSX; native Resend integration |
| generateLink | inviteUserByEmail | inviteUserByEmail requires Supabase SMTP; generateLink allows custom sender |

**Installation:**
```bash
npm install @react-email/components
npm install -D react-email
```

**Remove nodemailer (no longer needed):**
```bash
npm uninstall nodemailer @types/nodemailer
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── emails/                          # React Email templates
│   ├── components/
│   │   ├── base-layout.tsx          # Shared layout (logo, footer)
│   │   ├── button.tsx               # Branded CTA button
│   │   └── heading.tsx              # Styled headings
│   ├── invitation.tsx               # Team invitation email
│   └── password-reset.tsx           # Password reset email
├── lib/
│   └── email/
│       ├── resend.ts                # Resend client instance
│       └── send.ts                  # Typed send functions
├── app/
│   ├── api/
│   │   ├── invitations/
│   │   │   ├── route.ts             # Create invitation (exists)
│   │   │   └── accept/
│   │   │       └── route.ts         # Accept invitation (exists)
│   │   └── send/
│   │       └── route.ts             # (Optional) Generic email endpoint
│   └── (auth)/
│       ├── set-password/
│       │   └── page.tsx             # Password setup after invite (exists)
│       └── welcome/
│           └── page.tsx             # Post-onboarding welcome page (new)
```

### Pattern 1: Resend Client Singleton

**What:** Single Resend instance with typed send functions
**When to use:** All email sending
**Example:**
```typescript
// src/lib/email/resend.ts
import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

// Default sender for all emails
export const FROM_EMAIL = 'Kia dari my21staff <kia@my21staff.com>'
```

### Pattern 2: React Email Base Template

**What:** Shared layout component with logo, footer, brand colors
**When to use:** All email types inherit from this
**Example:**
```typescript
// src/emails/components/base-layout.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Img,
  Text,
  Link,
  Hr,
  Tailwind,
} from '@react-email/components'

const brandConfig = {
  theme: {
    extend: {
      colors: {
        'brand-forest': '#2D4B3E',
        'brand-text': '#2D2A26',
        'brand-muted': '#8C7E74',
      },
    },
  },
}

interface BaseLayoutProps {
  preview: string
  children: React.ReactNode
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html lang="id">
      <Head />
      <Tailwind config={brandConfig}>
        <Body className="bg-white font-sans">
          <Container className="mx-auto max-w-[600px] px-4 py-8">
            {/* Logo */}
            <Section className="mb-8">
              <Img
                src="https://my21staff.com/logo.png"
                alt="my21staff"
                width={120}
                height={40}
              />
            </Section>

            {/* Content */}
            {children}

            {/* Footer */}
            <Hr className="my-6 border-gray-200" />
            <Section className="text-center">
              <Text className="text-xs text-brand-muted">
                &copy; {new Date().getFullYear()} my21staff
              </Text>
              <Link
                href="https://wa.me/628XXXXXXXXX"
                className="text-xs text-brand-muted"
              >
                Hubungi via WhatsApp
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
```

### Pattern 3: Typed Email Sending

**What:** Type-safe functions for each email type
**When to use:** Ensures correct data passed to templates
**Example:**
```typescript
// src/lib/email/send.ts
import { resend, FROM_EMAIL } from './resend'
import { InvitationEmail } from '@/emails/invitation'
import { PasswordResetEmail } from '@/emails/password-reset'

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
  const { data, error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Anda diundang ke ${workspaceName}`,
    react: InvitationEmail({ inviteLink, workspaceName, inviterName }),
  })

  if (error) {
    console.error('Failed to send invitation email:', error)
    throw new Error(`Email failed: ${error.message}`)
  }

  return data
}
```

### Pattern 4: Invitation Flow (Existing User vs New User)

**What:** Handle both cases when inviting a member
**When to use:** Member invitation API
**Example:**
```typescript
// Current flow (already implemented, just needs email fix):
// 1. Check if user exists in auth.users
// 2. If new: createUser with email_confirm: true
// 3. Generate recovery link with redirect to /set-password
// 4. Store invitation in workspace_invitations
// 5. Send email via Resend (replacing nodemailer)

// The key insight: Use 'recovery' type because:
// - It works for both new and existing users
// - New users set their first password
// - Existing users can reset if needed
// - The invitation token tracks workspace membership separately
```

### Pattern 5: Onboarding Context Display

**What:** Show workspace info on first login
**When to use:** After accepting invitation, before dashboard
**Example:**
```typescript
// After successful password set or login via invitation:
// 1. Check for pending invitation token in URL/session
// 2. Accept invitation (add to workspace_members)
// 3. Show welcome screen with:
//    - Workspace name they joined
//    - Who invited them
//    - Brief feature tour or "Go to inbox" CTA
```

### Anti-Patterns to Avoid

- **Inline HTML strings for emails:** Use React Email components; they handle client compatibility
- **Hardcoded colors in templates:** Use Tailwind config for consistency
- **Sending emails synchronously:** Don't block the API response on email send success
- **SMTP from Vercel serverless:** DNS resolution fails; use HTTP APIs like Resend
- **Using inviteUserByEmail:** Requires Supabase SMTP config; use generateLink for custom sender

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Email HTML rendering | String templates | React Email | Handles Gmail/Outlook quirks, tested on all clients |
| Email delivery | nodemailer/SMTP | Resend HTTP API | Works from serverless, handles bounces/complaints |
| Invitation tokens | Custom UUIDs | Supabase generateLink | Secure, expiring, handles user creation |
| Email validation | Regex | Zod email schema | Proper RFC compliance |
| DNS records | Manual SPF/DKIM | Resend dashboard | Auto-generates correct records |

**Key insight:** Email client compatibility is a nightmare. React Email components are tested across Gmail, Outlook, Apple Mail, Yahoo - don't hand-code HTML that works in one and breaks in another.

## Common Pitfalls

### Pitfall 1: Tailwind Classes Not Rendering in Email Clients

**What goes wrong:** CSS classes work in preview but not in Gmail/Outlook
**Why it happens:** Email clients strip `<style>` tags; need inline styles
**How to avoid:** React Email's Tailwind component converts to inline styles automatically; use the pixelBasedPreset
**Warning signs:** Email looks broken in Gmail but fine in preview

### Pitfall 2: Images Not Displaying

**What goes wrong:** Logo shows as broken image in email
**Why it happens:** Relative URLs, blocked by email client, or not HTTPS
**How to avoid:** Use absolute HTTPS URLs for all images; host on same domain or CDN
**Warning signs:** Images work in preview but not in actual emails

### Pitfall 3: Invitation Link Expired

**What goes wrong:** User clicks link days later, gets error
**Why it happens:** Supabase recovery links expire in 1 hour by default
**How to avoid:** Store custom expiry in workspace_invitations (7 days), check before accepting
**Warning signs:** Users report "invalid link" errors

### Pitfall 4: Email Goes to Spam

**What goes wrong:** Invitation emails not reaching inbox
**Why it happens:** Missing DNS authentication (SPF, DKIM, DMARC)
**How to avoid:** Complete Resend domain verification with all DNS records
**Warning signs:** Low open rates, users saying they didn't receive email

### Pitfall 5: Existing User Can't Accept Invite

**What goes wrong:** User with account clicks invite, session doesn't work
**Why it happens:** Recovery link creates new session for email, but they might be logged into different account
**How to avoid:** Check logged-in user's email matches invitation email; if mismatch, prompt to log out
**Warning signs:** "Email mismatch" errors

### Pitfall 6: Color Syntax in Email Tailwind

**What goes wrong:** Custom colors don't render correctly
**Why it happens:** Email clients don't support modern CSS color syntax (rgb with spaces)
**How to avoid:** Use hex colors in Tailwind config; React Email converts automatically
**Warning signs:** Background colors not showing

## Code Examples

### Invitation Email Template

```typescript
// src/emails/invitation.tsx
import {
  Button,
  Heading,
  Text,
  Section,
  Preview,
} from '@react-email/components'
import { BaseLayout } from './components/base-layout'

interface InvitationEmailProps {
  inviteLink: string
  workspaceName: string
  inviterName: string
}

export function InvitationEmail({
  inviteLink,
  workspaceName,
  inviterName,
}: InvitationEmailProps) {
  return (
    <BaseLayout preview={`${inviterName} mengundang Anda ke ${workspaceName}`}>
      <Heading className="text-xl font-semibold text-brand-text mb-4">
        Undangan Bergabung
      </Heading>

      <Text className="text-brand-text leading-6 mb-4">
        <strong>{inviterName}</strong> mengundang Anda untuk bergabung ke{' '}
        <strong>{workspaceName}</strong> di my21staff.
      </Text>

      <Section className="my-8 text-center">
        <Button
          href={inviteLink}
          className="bg-brand-forest text-white px-6 py-3 rounded-lg font-semibold"
        >
          Terima Undangan
        </Button>
      </Section>

      <Text className="text-sm text-brand-muted">
        Link ini berlaku selama 7 hari. Jika Anda tidak mengenal pengirim,
        abaikan email ini.
      </Text>
    </BaseLayout>
  )
}

// For preview in react-email dev server
export default InvitationEmail
```

### Resend Integration in Invitation API

```typescript
// Update src/app/api/invitations/route.ts
// Replace nodemailer import with:
import { sendInvitationEmail } from '@/lib/email/send'

// Replace the try/catch block for email sending:
try {
  await sendInvitationEmail({
    to: normalizedEmail,
    inviteLink,
    workspaceName: workspace.name,
    inviterName,
  })
} catch (emailError) {
  console.error('Failed to send invitation email:', emailError)
  // Still return success - invitation is created, email can be resent
  return NextResponse.json({
    success: true,
    warning: 'Invitation created but email failed to send',
    invitation: { ... },
  })
}
```

### Development Preview Setup

```json
// Add to package.json scripts:
{
  "scripts": {
    "email:dev": "email dev --dir src/emails --port 3001"
  }
}
```

### DNS Authentication Example Records

```
# Required Resend DNS records for my21staff.com:

# SPF Record (TXT)
Host: send._domainkey
Value: v=DKIM1; k=rsa; p=MIGf... (provided by Resend)

# MX Record (for bounces)
Host: send
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10

# TXT Record (SPF)
Host: send
Value: v=spf1 include:amazonses.com ~all

# DMARC (recommended, add to root domain)
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@my21staff.com
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| nodemailer SMTP | Resend HTTP API | 2024 | Works from serverless, better deliverability |
| HTML string templates | React Email components | 2023 | Type-safe, tested on all clients |
| inviteUserByEmail | generateLink + custom email | 2024 | Full control over sender, branding |
| Manual SPF/DKIM setup | Resend auto-generates | 2024 | Simpler DNS setup |

**Deprecated/outdated:**
- nodemailer from Vercel: DNS resolution issues make it unreliable
- Supabase built-in email: Limited customization, can't match brand
- Inline HTML for emails: Breaks in various email clients

## Open Questions

1. **Logo hosting location**
   - What we know: Need absolute HTTPS URL for email images
   - What's unclear: Host on Vercel or separate CDN?
   - Recommendation: Use /public folder on Vercel (becomes absolute URL)

2. **Email analytics**
   - What we know: Resend free tier has 1-day data retention
   - What's unclear: Do we need longer retention for debugging?
   - Recommendation: Start with free tier, upgrade if needed

3. **Resend rate limits**
   - What we know: 2 requests/second, 100/day on free tier
   - What's unclear: Expected invitation volume
   - Recommendation: Free tier sufficient for launch; monitor usage

## Sources

### Primary (HIGH confidence)
- [Resend + Next.js documentation](https://resend.com/docs/send-with-nextjs) - Official integration guide
- [React Email components](https://react.email/docs/components/html) - Component API reference
- [Supabase generateLink API](https://supabase.com/docs/reference/javascript/auth-admin-generatelink) - Token generation
- [Resend domain setup](https://resend.com/docs/dashboard/domains/introduction) - DNS requirements

### Secondary (MEDIUM confidence)
- [React Email Tailwind component](https://react.email/docs/components/tailwind) - Styling in emails
- [Resend pricing/limits](https://resend.com/docs/knowledge-base/account-quotas-and-limits) - Rate limits
- [SaaS onboarding patterns](https://userpilot.com/blog/onboard-invited-users-saas/) - UX best practices

### Tertiary (LOW confidence)
- Various WebSearch results on email client compatibility (verified with official docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Resend already installed, React Email is official pairing
- Architecture: HIGH - Based on existing codebase patterns + official docs
- Pitfalls: HIGH - Well-documented email client issues
- Onboarding UX: MEDIUM - Based on industry patterns, needs validation

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stable libraries)
