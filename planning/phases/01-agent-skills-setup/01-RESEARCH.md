# Phase 1: Agent Skills Setup - Research

**Researched:** 2026-01-27
**Domain:** Development tooling, MCP servers, Agent Skills
**Confidence:** HIGH

## Summary

Agent Skills are a development tool for extending Claude Code's capabilities through the Model Context Protocol (MCP). The Kapso agent-skills package provides five specialized skill sets for WhatsApp automation, messaging, and platform management. Skills use progressive disclosure to load instructions only when needed, optimizing context usage.

The installation process uses `npx skills add gokapso/agent-skills` which registers the skills with Claude Code. The Kapso MCP server requires API key authentication via the `X-API-Key` header and communicates over HTTP streamable transport at `https://app.kapso.ai/mcp`.

This is a development tool installation phase—no application code changes are required. The skills provide Claude Code with specialized knowledge about Kapso APIs and WhatsApp automation patterns, making subsequent implementation phases more efficient.

**Primary recommendation:** Install agent-skills first, then configure MCP server separately. Verify each installation step before proceeding.

## Standard Stack

The established tools for extending Claude Code with external capabilities:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Model Context Protocol (MCP) | Latest (2026) | Standard protocol for AI-tool integrations | Official Anthropic protocol, supported across Claude ecosystem |
| Claude Code CLI | Built-in | MCP server management | Native installation and configuration management |
| Agent Skills | Latest | Progressive disclosure skill system | Open standard (agentskills.io), context-efficient |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| npx (Node.js) | 16+ | Package execution without installation | Required for agent-skills installation |
| MCP Inspector | Latest | MCP server debugging | When troubleshooting connection or tool issues |
| HTTP transport | MCP standard | Remote MCP server communication | For cloud-based servers like Kapso |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTTP transport | STDIO transport | STDIO requires local server process; HTTP works for remote services |
| Agent Skills | Direct MCP tools | Skills provide progressive disclosure; raw MCP loads all tools upfront |
| Kapso MCP | Custom integration | MCP server provides 26 tools out-of-box; custom would require maintenance |

**Installation:**
```bash
# Agent Skills installation
npx skills add gokapso/agent-skills

# MCP server configuration (Claude Code)
claude mcp add --transport http kapso https://app.kapso.ai/mcp \
  --header "X-API-Key: YOUR_API_KEY"
```

## Architecture Patterns

### Recommended Approach: Two-Layer Configuration

Agent Skills and MCP servers serve complementary purposes:

```
Layer 1: Agent Skills (Knowledge)
├── Progressive disclosure of instructions
├── Task-specific guidance loaded on-demand
└── No authentication required

Layer 2: MCP Server (Execution)
├── Live API access to Kapso platform
├── Authenticated tool execution
└── Real-time data access
```

### Pattern 1: Skills-First Installation
**What:** Install agent-skills before configuring MCP server
**When to use:** All new integrations
**Why:** Skills provide context about what the MCP server can do; helps Claude understand when to use MCP tools

**Example workflow:**
```bash
# Step 1: Install skills (knowledge layer)
npx skills add gokapso/agent-skills

# Step 2: Verify skills loaded
/plugin list  # In Claude Code

# Step 3: Configure MCP server (execution layer)
claude mcp add --transport http kapso https://app.kapso.ai/mcp \
  --header "X-API-Key: ${KAPSO_API_KEY}"

# Step 4: Test MCP connection
/mcp  # In Claude Code - should show 26 Kapso tools
```

### Pattern 2: Environment Variable Expansion
**What:** Store API keys in environment, reference in MCP config
**When to use:** Production deployments, team environments
**Why:** Separates secrets from configuration files

**Example:**
```bash
# Export API key
export KAPSO_API_KEY="52ec95ff42ce9db848e54c6a16fa73c3e20f50c2b0296563fd8707039fead2c8"

# Use variable in MCP config
claude mcp add --transport http kapso https://app.kapso.ai/mcp \
  --header "X-API-Key: ${KAPSO_API_KEY}"
```

### Pattern 3: Progressive Disclosure Loading
**What:** Skills load in three stages: metadata → overview → details
**When to use:** Automatically handled by agent-skills system
**Why:** Minimizes context window usage; loads full instructions only when task matches

**Loading sequence:**
1. Startup: Load skill names and descriptions only
2. Task match: Load SKILL.md file content
3. Deep dive: Load references/, scripts/, assets/ as needed

### Project Structure
```
.claude/
├── mcp-servers.json       # MCP server configurations
└── settings.json          # Claude Code settings

~/.claude/
└── skills/                # Installed agent skills
    └── gokapso-agent-skills/
        ├── kapso-automation/
        │   └── SKILL.md
        ├── whatsapp-messaging/
        │   └── SKILL.md
        ├── whatsapp-flows/
        │   └── SKILL.md
        ├── kapso-api/
        │   └── SKILL.md
        └── kapso-ops/
            └── SKILL.md
```

### Anti-Patterns to Avoid
- **Installing MCP server before skills:** Limits Claude's understanding of tool capabilities
- **Hard-coding API keys in commands:** Use environment variables or config files instead
- **Skipping verification steps:** Each installation step should be tested before proceeding
- **Using STDIO for remote services:** HTTP transport is correct for cloud-based MCP servers

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MCP server management | Custom shell scripts | `claude mcp add/list/remove` | Built-in CLI handles config files, scopes, and verification |
| API authentication | Manual header injection | MCP config `--header` flag | Standardized auth pattern; supports OAuth 2.0 for advanced cases |
| Context optimization | Loading all docs upfront | Agent Skills progressive disclosure | 3-level loading reduces token usage by ~47% (per 2026 research) |
| MCP debugging | Console logs and guessing | MCP Inspector tool | Controlled testing environment; shows exact tool calls and responses |
| Skills installation | Cloning repos manually | `npx skills add` | Handles skill discovery, version management, and updates |

**Key insight:** The MCP ecosystem is mature (2+ years old as of 2026). Standard tooling exists for every common task. Custom solutions add maintenance burden and miss security/compatibility improvements from official tools.

## Common Pitfalls

### Pitfall 1: stdout/stderr Confusion (STDIO servers only)
**What goes wrong:** When building custom MCP servers, writing logs to stdout breaks JSON-RPC protocol
**Why it happens:** Developers treat stdout as general logging stream
**How to avoid:** This phase uses HTTP transport (not affected), but note for future: JSON-RPC messages → stdout, debug logs → stderr
**Warning signs:** "Protocol error: invalid JSON-RPC message" when server seems to work

**Note:** This pitfall does NOT apply to Kapso MCP server (HTTP transport), included for completeness.

### Pitfall 2: API Key Format Issues
**What goes wrong:** MCP server authentication fails with "401 Unauthorized"
**Why it happens:** Extra whitespace, newlines, or quotes in API key value
**How to avoid:**
- Verify API key format: `echo "$KAPSO_API_KEY" | cat -A` (shows hidden characters)
- Remove trailing newlines: `KAPSO_API_KEY=$(echo "$KAPSO_API_KEY" | tr -d '\n')`
- Use single value, not wrapped in additional quotes
**Warning signs:** MCP server shows in `claude mcp list` but all tool calls fail with auth error

### Pitfall 3: Scope Confusion (Local vs Project vs User)
**What goes wrong:** MCP server configured in wrong scope; other team members can't see it or config conflicts
**Why it happens:** Default scope is "local" (project-specific, your user only)
**How to avoid:**
- Development tools like Kapso: Use `--scope user` (available across all projects)
- Team-shared servers: Use `--scope project` (creates `.mcp.json` in repo)
- Personal/experimental: Use `--scope local` (default)
**Warning signs:** "Works on my machine" but teammate can't access MCP server

### Pitfall 4: Skipping Verification Between Steps
**What goes wrong:** Installation appears successful but tools aren't available in Claude Code
**Why it happens:** Silent failures during skill registration or MCP server startup
**How to avoid:** Test each step:
1. After skills install: `/plugin list` → verify gokapso-agent-skills appears
2. After MCP config: `claude mcp list` → verify "kapso" server listed
3. In conversation: `/mcp` → verify 26 Kapso tools appear
**Warning signs:** Commands succeed but features don't work later

### Pitfall 5: Prompt Injection via MCP Tools (Security)
**What goes wrong:** Malicious data from external sources (DB, API) gets interpreted as instructions
**Why it happens:** MCP tools return user-generated content that Claude treats as trusted input
**How to avoid:**
- Kapso MCP server returns WhatsApp message content (user input) — treat as untrusted
- Use `response_format: "concise"` by default (reduces injection surface)
- Never pass raw message content directly to tool inputs without validation
**Warning signs:** Unexpected behavior after processing certain messages

## Code Examples

Verified patterns from official sources:

### Installation: Agent Skills
```bash
# Source: https://github.com/gokapso/agent-skills
# Install Kapso agent-skills package
npx skills add gokapso/agent-skills

# Expected output:
# ✓ Skills added from gokapso/agent-skills
# - kapso-automation
# - whatsapp-messaging
# - whatsapp-flows
# - kapso-api
# - kapso-ops
```

### Configuration: MCP Server with Environment Variable
```bash
# Source: https://docs.kapso.ai/docs/mcp/introduction
# Store API key in environment
export KAPSO_API_KEY="52ec95ff42ce9db848e54c6a16fa73c3e20f50c2b0296563fd8707039fead2c8"

# Add MCP server with user scope (available across projects)
claude mcp add --transport http \
  --scope user \
  --header "X-API-Key: ${KAPSO_API_KEY}" \
  kapso https://app.kapso.ai/mcp

# Alternative: Using literal key (less secure, for testing)
claude mcp add --transport http \
  --header "X-API-Key: 52ec95ff42ce9db848e54c6a16fa73c3e20f50c2b0296563fd8707039fead2c8" \
  kapso https://app.kapso.ai/mcp
```

### Verification: Check Installation Status
```bash
# Source: https://code.claude.com/docs/en/mcp
# List configured MCP servers
claude mcp list
# Expected: Shows "kapso" server with HTTP transport

# Get server details
claude mcp get kapso
# Expected: Shows URL, headers (X-API-Key: ***), scope

# Within Claude Code conversation:
/mcp
# Expected: Shows authentication status and available tools (26 Kapso tools)
```

### Testing: Basic Command Execution
```
# Source: Kapso MCP documentation
# Within Claude Code, after MCP server configured:

> Can you list my Kapso contacts?

# Claude should use whatsapp_search_contacts tool
# Response format: concise (default)

> Show me my WhatsApp inbox conversations

# Claude should use whatsapp_get_inbox tool
# Returns conversation list with basic metadata
```

### Debugging: MCP Inspector (if issues occur)
```bash
# Source: https://code.claude.com/docs/en/mcp
# Start MCP Inspector for detailed debugging
npx @anthropic/mcp-inspector

# Navigate to: http://localhost:5173
# Connect to: https://app.kapso.ai/mcp
# Headers: X-API-Key: <your-key>
# Test individual tool calls in isolation
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom API wrappers | MCP servers | 2024 (MCP release) | Standardized integration pattern; 100+ pre-built servers available |
| Load all docs into context | Progressive disclosure (Skills) | 2025-2026 | 46.9% token reduction in multi-tool scenarios |
| Manual tool descriptions | Agent Skills SKILL.md | 2025 | Structured metadata; better task matching |
| SSE transport | HTTP streamable | 2025-2026 | SSE deprecated; HTTP is recommended standard |
| API key in config files | Environment variables | Ongoing best practice | Secrets separation; better security |

**Deprecated/outdated:**
- **SSE (Server-Sent Events) transport:** Replaced by HTTP streamable; Kapso uses HTTP (current standard)
- **Manual skill registration:** Old approach required editing config files; `npx skills add` is current method
- **STDIO for remote services:** STDIO is for local servers only; HTTP transport is correct for cloud services

## Open Questions

Things that couldn't be fully resolved:

1. **Agent Skills Update Mechanism**
   - What we know: Skills are installed via `npx skills add`, versioned by repository
   - What's unclear: How to update skills when gokapso/agent-skills releases new versions
   - Recommendation: Document current version during installation; check for updates manually via `npx skills update` (if supported) or re-run `npx skills add`

2. **MCP Server Timeout Configuration**
   - What we know: Default timeout exists; can override with `MCP_TIMEOUT` environment variable
   - What's unclear: Optimal timeout for Kapso API calls (network latency, API response time)
   - Recommendation: Start with default; increase if timeout errors occur: `MCP_TIMEOUT=10000 claude` (10 seconds)

3. **Skills vs MCP Tools Overlap**
   - What we know: Skills provide knowledge, MCP provides execution; both reference "Kapso"
   - What's unclear: Which operations are in Skills vs MCP server tools
   - Recommendation: Install both layers; Claude will use skills for guidance and MCP for execution

4. **Project-Scope MCP Security**
   - What we know: `--scope project` creates `.mcp.json` in repo; supports environment variable expansion
   - What's unclear: Whether to commit `.mcp.json` with `${KAPSO_API_KEY}` placeholder or keep as local-only
   - Recommendation: For this project (blocked from git push per CLAUDE.md), use `--scope user`; avoid project scope

## Sources

### Primary (HIGH confidence)
- [Model Context Protocol - Official Introduction](https://modelcontextprotocol.io/)
- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp)
- [Kapso MCP Server Documentation](https://docs.kapso.ai/docs/mcp/introduction)
- [gokapso/agent-skills Repository](https://github.com/gokapso/agent-skills)
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)

### Secondary (MEDIUM confidence)
- [MCP Server Best Practices 2026](https://www.cdata.com/blog/mcp-server-best-practices-2026)
- [Awesome MCP Servers - Kapso Entry](https://mcpservers.org/servers/docs-kapso-ai-docs-mcp-introduction)
- [MCP Best Practices: Architecture & Implementation](https://modelcontextprotocol.info/docs/best-practices/)
- [Claude Code Best Practices for Agentic Coding](https://www.anthropic.com/engineering/claude-code-best-practices)

### Tertiary (LOW confidence - WebSearch only)
- [Agent Skills Progressive Disclosure Article](https://aipositive.substack.com/p/progressive-disclosure-matters) - 2026, describes progressive disclosure benefits
- [MCP Security Survival Guide](https://towardsdatascience.com/the-mcp-security-survival-guide-best-practices-pitfalls-and-real-world-lessons/) - Prompt injection warnings
- [Troubleshooting MCP Servers Guide](https://superagi.com/how-to-troubleshoot-common-mcp-server-issues-like-a-pro-step-by-step-guide/) - Common pitfalls

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Anthropic MCP documentation, Kapso official docs, verified installation commands
- Architecture: HIGH - Patterns verified from official documentation and best practices guides
- Pitfalls: MEDIUM - Mix of official documentation (stdout/stderr, scope) and community experience (API key format)

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (30 days) - MCP ecosystem is stable; agent-skills is alpha (rapid changes possible)

**Key verification notes:**
- API key confirmed in project `.env.production.local` file (ready for use)
- MCP HTTP transport verified as current standard (SSE deprecated)
- Agent Skills installation command verified from official repository
- 26 Kapso MCP tools count verified from official documentation
