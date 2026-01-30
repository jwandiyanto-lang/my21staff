# Phase 2.5: Settings & Configuration - Context

**Gathered:** 2026-01-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the CRM UI for Kapso integration:
1. **Inbox tab** — Embed forked Kapso whatsapp-cloud-inbox with brand overrides
2. **Your Team tab** — Bot configuration for Intern & Brain with settings boxes
3. **Settings tab** — Bot name configuration that applies to both bots

Plain Language wizard deferred to future phase.
</domain>

<decisions>
## Implementation Decisions

### Inbox Integration
- Fork Kapso's `whatsapp-cloud-inbox` repo as the working base
- Override styling only via CSS/component customization
- Keep core functionality intact (reply buttons, names, all features work)
- Apply my21staff black/white + Geist Mono branding
- Integration with existing my21staff auth/database

### Sidebar Structure
```
├── Inbox           (forked Kapso inbox, branded)
├── Your Team       (bot configuration)
│   ├── Intern      (Sarah - chat bot settings)
│   └── Brain       (Grok - manager bot settings)
└── Settings        (bot names, general config)
```

### Bot Configuration (Intern & Brain)
**Each bot has a settings box with:**
- Persona/prompt editor
- Behavior rules (when to respond, when to handoff)
- Response settings (length, emoji usage, price rules)
- Slot extraction config (for Intern: name, service, budget, timeline)
- Summary/scoring config (for Brain)

### Bot Name Settings
- Single configuration that applies to both Intern & Brain
- Editable in Settings tab
- Updates persona references across both bots

### Deferred Ideas
- Plain Language wizard (conversational config flow) — future phase
- Configuration history with rollback — future phase
- Bulk operations for workflows/triggers — future phase
- Test panel for workflow triggers — future phase

</decisions>

<specifics>
## Specific Ideas

- "Kapso does things for a reason" — don't reinvent core functionality
- Fork approach preserves working features (reply buttons, names display)
- Only override styling, keep all WhatsApp logic intact
- Settings boxes should be editable text areas for prompts/rules

</specifics>

<deferred>
## Deferred Ideas

- Plain Language wizard — conversational bot config in natural language
- Configuration history with rollback capability
- Test panel to send test messages and verify workflow responses
- Bulk workflow operations (create/edit/delete multiple triggers)

</deferred>

---

*Phase: 02_5-settings-configuration*
*Context gathered: 2026-01-30*
