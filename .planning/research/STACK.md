# Technology Stack: Kapso Integration Additions

**Project:** my21staff v3.4 Milestone
**Research Date:** 2026-01-27
**Focus:** Stack additions for whatsapp-cloud-inbox UI replacement + agent-skills MCP
**Confidence:** HIGH (verified against Kapso official sources + GitHub)

---

## Executive Summary

The v3.4 milestone requires two distinct integrations:

1. **whatsapp-cloud-inbox UI replacement** — A reference Next.js 15 application, not an npm package. Requires **copying component patterns** from the open-source repo, not adding a dependency.

2. **agent-skills MCP setup** — A development-only MCP server for Claude integration. Requires **MCP client installation** (not a runtime dependency).

**Key finding:** Neither addition requires new production dependencies. The whatsapp-cloud-inbox is a reference implementation to learn from and adapt. The MCP is purely for dev workflow enhancement.

---

## Recommended Stack

### Current Stack (Validated, Keep As-Is)

| Technology | Version | Purpose | Status |
|-----------|---------|---------|--------|
| Next.js | 16.1.1 | Framework | ✓ Current |
| React | 19.2.3 | UI library | ✓ Current |
| TypeScript | 5.x | Type safety | ✓ Current |
| Convex | 1.31.6 | Database + real-time | ✓ Current |
| Clerk | 6.36.9 | Authentication + orgs | ✓ Current |
| Shadcn/ui | Latest | Component system | ✓ Current |
| Tailwind CSS | 4.x | Styling | ✓ Current |
| Lucide React | 0.562.0 | Icons | ✓ Current |
| Radix UI | 1.x | Headless primitives | ✓ Current |

### New Additions: Runtime (None)

**Critical:** The whatsapp-cloud-inbox **does not publish an npm package**. It's a reference implementation on GitHub. You will:
- Study its component patterns
- Adapt and copy components into your codebase (not import as dependency)
- Learn from its Convex integration approach

This avoids version lock-in and allows customization for my21staff specifics.

### New Additions: Development Only

#### MCP Client Installation (Development Workflow Only)

| Tool | Version | Purpose | Installation |
|------|---------|---------|--------------|
| Claude MCP | Latest | Enable agent-skills in Claude Code | Via `claude mcp add` command |

**Installation command:**
```bash
claude mcp add --transport http kapso https://app.kapso.ai/mcp --header "X-API-Key: YOUR_API_KEY"
```

Replaces `YOUR_API_KEY` with your Kapso project API key from Project Settings.

**No npm package required.** The MCP server runs as an HTTP endpoint, not as a local dependency.

### Reference Implementation: whatsapp-cloud-inbox

| Component | Source | Use For |
|-----------|--------|---------|
| GitHub repo | [gokapso/whatsapp-cloud-inbox](https://github.com/gokapso/whatsapp-cloud-inbox) | Reference architecture only |
| Tech stack | Next.js 15.5.9, React 19.1.0, TypeScript 5.9.3 | Version compatibility check |
| UI kit | Radix UI + Tailwind CSS | Component pattern learning |
| Dependencies | date-fns, lucide-react, clsx | Optional for inbox features |

**Note:** Clone/study this repo, don't npm install it. Copy the patterns you need into `src/components/inbox/`.

---

## Architecture Integration Points

### Inbox UI Integration (whatsapp-cloud-inbox → my21staff)

**Current state:** my21staff has custom inbox components
```
src/components/inbox/
├── conversation-list.tsx      # Your implementation
├── message-thread.tsx         # Your implementation
├── message-bubble.tsx         # Your implementation
├── compose-input.tsx          # Your implementation
└── ...
```

**Kapso reference has:**
```
gokapso/whatsapp-cloud-inbox/src/components/
├── inbox/                     # Component patterns to learn from
├── messages/                  # Message rendering patterns
└── conversations/             # Conversation list patterns
```

**Integration approach:**
1. Study Kapso's component structure (don't import)
2. Enhance your existing components with Kapso patterns
3. Maintain Convex integration (Kapso uses different backend)
4. Keep Shadcn/ui + Radix UI (Kapso uses same stack)

**Convex bindings remain unchanged:**
```typescript
// Your existing hook — no changes needed
const conversations = useQuery(api.conversations.listWithFilters, ...)

// Kapso reference uses different backend (Firebase/Supabase)
// You will keep Convex real-time subscriptions
```

### MCP Integration (agent-skills for development)

**What it enables:**
- Claude Code can call Kapso API methods during development
- Agent-skills provide context about WhatsApp capabilities
- Reduces need to manually look up Kapso API docs

**Where it lives:**
- Claude MCP configuration (outside Next.js codebase)
- Not imported into your app code
- Pure IDE/CLI enhancement

**API methods exposed by MCP:**
```
Messaging tools     → Send texts, templates, media
Operator tools      → Inbox management, conversation context
Management tools    → Search/update contacts & conversations
Platform tools      → Customer and setup link management
```

See [Kapso MCP docs](https://docs.kapso.ai/docs/mcp/introduction) for full method list.

---

## Dependency Review: What NOT to Add

| Package | Reason to Skip |
|---------|----------------|
| `@kapso/whatsapp-cloud-inbox` | Not published on npm (GitHub reference only) |
| `@kapso/whatsapp-cloud-api` | Already using raw HTTP via `fetch` for Kapso calls; SDK adds nothing for webhook consumption |
| `@mcp/sdk` | MCP runs as HTTP server, not npm dependency |
| Extra UI libraries | Kapso uses same stack (Radix UI, Tailwind) — no new deps needed |

### Current Kapso Integration (Already Working)

**How you use Kapso today:**
```typescript
// API Routes (sending messages)
fetch('https://api.kapso.ai/meta/whatsapp/v24.0/{phone_number_id}/messages', {
  headers: { 'X-API-Key': apiKey },
  body: JSON.stringify({ to, type: 'text', text: { body } })
})

// Webhooks (receiving messages)
// POST /api/webhook/kapso
```

**This approach stays unchanged** because:
- Works reliably with zero SDK dependency
- Gives you control over request/response handling
- Easier to add logging, error handling, retry logic
- No version lock-in from SDK updates

The `@kapso/whatsapp-cloud-api` SDK is optional — useful if you want typed method calls, but adds a dependency for zero functional gain given your current implementation.

---

## Installation & Setup

### No New npm Dependencies Required

```bash
# Your package.json needs ZERO new entries
# Current stack is sufficient
npm install  # No changes
```

### whatsapp-cloud-inbox Learning (Reference Only)

```bash
# Clone the reference repo to study patterns
git clone https://github.com/gokapso/whatsapp-cloud-inbox.git ./docs/kapso-reference

# Study these files:
# - docs/kapso-reference/src/components/
# - docs/kapso-reference/package.json (for version insights)
# - docs/kapso-reference/src/app/layout.tsx (Next.js 15 patterns)

# Note: DO NOT npm install from this directory
```

### MCP Setup (Development Only)

```bash
# Install Claude Code MCP client
# (Already installed if you use Claude Code)

# Configure Kapso MCP endpoint
claude mcp add --transport http kapso https://app.kapso.ai/mcp \
  --header "X-API-Key: YOUR_API_KEY"

# Replace YOUR_API_KEY with value from Kapso Project Settings
```

Verify setup:
```bash
# In Claude Code or integrated IDE, MCP should appear in context menu
# No code changes required to your Next.js app
```

---

## Version Compatibility Matrix

### Next.js 16 Compatibility Check

| Dependency | Current | whatsapp-cloud-inbox uses | Compatible? |
|-----------|---------|------------------------|------------|
| Next.js | 16.1.1 | 15.5.9 | ✓ Patterns portable |
| React | 19.2.3 | 19.1.0 | ✓ Same major version |
| TypeScript | 5.x | 5.9.3 | ✓ Compatible |
| Radix UI | 1.x | 1.x | ✓ Exact match likely |
| Tailwind CSS | 4.x | 4.x | ✓ Exact match |

**Key insight:** whatsapp-cloud-inbox uses Next.js 15 but patterns are fully portable to Next.js 16. No API breaking changes between these versions.

---

## Recommended Approach: Selective Adoption

Don't do a wholesale "replace inbox with Kapso's inbox." Instead:

### Phase 1: Learn (Week 1)
```
├── Clone whatsapp-cloud-inbox repo
├── Study component structure:
│   ├── How they handle message rendering
│   ├── How they manage conversation state
│   ├── How they handle real-time updates
│   └── How they style with Tailwind
└── Document patterns in ARCHITECTURE.md
```

### Phase 2: Enhance (Week 2)
```
├── Apply learned patterns to your components:
│   ├── Improve message-bubble.tsx styling/UX
│   ├── Enhance conversation-list.tsx filtering
│   ├── Upgrade message-thread.tsx interactions
│   └── Polish compose-input.tsx
├── Keep Convex integration unchanged
├── Keep existing Clerk auth
└── Test all changes locally at localhost:3000/demo
```

### Phase 3: Deploy (Week 3)
```
├── UI improvements go live
├── Feature parity with v2.0 established
└── Ready for production at my21staff.com
```

**What changes:** UI/UX patterns
**What stays:** Convex, Clerk, authentication, real-time subscriptions

---

## MCP Benefits in Development

### Before MCP
```
# To check Kapso message format
1. Open browser → docs.kapso.ai
2. Search for "message sending"
3. Find JSON example
4. Copy into code
```

### After MCP
```
# Claude Code knows Kapso methods
# Ask "How do I send an interactive message?"
# Claude sees method signatures in context
# Auto-complete and suggestions work
```

**Impact:** Faster feature development, fewer doc lookups, better IDE integration.

---

## Avoiding Common Pitfalls

### Pitfall 1: Importing whatsapp-cloud-inbox as npm package
**Problem:** Package doesn't exist on npm
**Solution:** Clone the repo, study components, copy patterns locally
**Prevention:** Treat it as reference docs, not a dependency

### Pitfall 2: Upgrading to the SDK when not needed
**Problem:** `@kapso/whatsapp-cloud-api` adds a dependency for zero functional improvement
**Solution:** Continue using HTTP `fetch` directly
**Prevention:** Only add SDK if you find fetch approach limiting (unlikely)

### Pitfall 3: MCP breaking your app
**Problem:** MCP runs outside Node.js process — can't break your app
**Solution:** MCP is pure development/IDE enhancement
**Prevention:** No code changes needed in Next.js app

### Pitfall 4: Forgetting Convex still owns the inbox state
**Problem:** Trying to import Convex hooks from whatsapp-cloud-inbox (it uses different backend)
**Solution:** Keep your Convex queries, adapt their component patterns
**Prevention:** Read whatsapp-cloud-inbox's backend assumptions before copying code

---

## Success Criteria: How to Know You're Done

- [ ] whatsapp-cloud-inbox repo cloned to `docs/kapso-reference/`
- [ ] Component patterns documented in ARCHITECTURE.md
- [ ] Inbox components enhanced with Kapso-inspired improvements
- [ ] All inbox features work at `localhost:3000/demo` (dev mode)
- [ ] Production inbox features work at `localhost:3000` (with Convex)
- [ ] MCP installed via `claude mcp add` command
- [ ] Claude Code recognizes Kapso methods in suggestions
- [ ] Zero new npm dependencies added
- [ ] Existing tests pass
- [ ] No deployment blockers introduced

---

## Sources

### Primary (HIGH Confidence - Official/Current)

- **Kapso GitHub:** [gokapso/whatsapp-cloud-inbox](https://github.com/gokapso/whatsapp-cloud-inbox) — Reference implementation, verified 2026-01-27
- **Kapso Docs:** [docs.kapso.ai](https://docs.kapso.ai) — Official SDK documentation
- **Kapso MCP:** [docs.kapso.ai/docs/mcp/introduction](https://docs.kapso.ai/docs/mcp/introduction) — Model Context Protocol setup guide
- **Model Context Protocol Spec:** [modelcontextprotocol.io/specification](https://modelcontextprotocol.io/specification/2025-11-25) — Official MCP definition

### Secondary (MEDIUM Confidence - Reference Implementations)

- **MCP GitHub:** [github.com/modelcontextprotocol](https://github.com/modelcontextprotocol) — MCP reference servers and examples
- **whatsapp-cloud-inbox package.json:** Verified Next.js 15.5.9, React 19.1.0, TypeScript 5.9.3 compatibility

### Tertiary (Reference)

- **my21staff codebase:** Current Convex integration verified at `src/app/api/webhook/kapso/route.ts` and inbox components at `src/components/inbox/`

---

## Why This Approach

**"Stack" isn't just npm packages.** It's also:
- Reference implementations to learn from
- Development tools (MCP)
- Architecture patterns
- Integration points

This research treats "stack" holistically:
- What runtime deps you need (none new)
- What dev tools enhance workflow (MCP)
- What reference code teaches patterns (whatsapp-cloud-inbox)
- Where integration happens (Convex queries, Clerk auth stay unchanged)

**Bottom line:** v3.4 succeeds without new dependencies, by applying reference patterns and adding development tools. Your existing stack is sufficient.

---

*Research completed: 2026-01-27*
*Valid for: Next.js 16.x, React 19.x, Convex stable*
*Review date: 2026-02-27 (if Kapso releases major version updates)*
