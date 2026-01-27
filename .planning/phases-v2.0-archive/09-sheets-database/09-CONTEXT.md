# Phase 9: Google Sheets to Database via n8n

## Goal

Sync Google Sheets data to the application database using n8n workflows for automated data import/export.

## Background

- n8n instance running at: `http://100.113.96.25:5678` (Tailscale)
- Current database: SQLite (dev) / Supabase (prod target)
- Use case: Import leads, contacts, or business data from spreadsheets

## Requirements

1. **n8n Workflow — Sheet to Database**
   - Trigger: Schedule (hourly/daily) or manual
   - Read from Google Sheets
   - Transform data to match database schema
   - Upsert to database (insert or update)

2. **n8n Workflow — Database to Sheet** (optional)
   - Export database records to Google Sheets
   - Useful for reporting/sharing with non-technical users

3. **Schema Mapping**
   - Define column mappings: Sheet columns → DB fields
   - Handle data types (dates, numbers, strings)
   - Validation and error handling

## Technical Details

### n8n Nodes Required

1. **Google Sheets Node** — Read/write spreadsheet data
2. **Code Node** — Transform and validate data
3. **HTTP Request Node** — Call API endpoint or direct DB
4. **Postgres/MySQL Node** — Direct database connection (if using Supabase)

### Workflow Structure

```
[Schedule Trigger / Webhook]
    → [Google Sheets: Read]
    → [Code: Transform & Validate]
    → [HTTP Request: API Upsert] or [Postgres: Upsert]
    → [IF: Error?]
        → [Slack/Email: Notify on failure]
```

### Sample Data Mapping

| Sheet Column | DB Field | Type | Notes |
|--------------|----------|------|-------|
| Name | name | string | Required |
| Phone | phone | string | Format: +62xxx |
| Email | email | string | Validate format |
| Status | status | enum | Map to valid values |
| Created | created_at | date | Parse DD/MM/YYYY |

## Success Criteria

- [ ] n8n workflow created and tested
- [ ] Google Sheets OAuth connected
- [ ] Data successfully imports to database
- [ ] Handles duplicates (upsert logic)
- [ ] Error notifications configured
- [ ] Scheduled sync running (if needed)

## Dependencies

- n8n instance (running on Tailscale)
- Google account with Sheets access
- Database credentials/API endpoint
- Sheet structure defined

## Considerations

- Rate limits on Google Sheets API
- Batch size for large imports
- Conflict resolution strategy
- Audit trail for imports

## Notes

- Start with one-way sync (Sheets → DB)
- Add export workflow later if needed
- Consider using n8n credentials store for API keys
