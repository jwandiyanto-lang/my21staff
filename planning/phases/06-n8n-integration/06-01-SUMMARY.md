# Summary: 06-01 n8n Webhook Endpoint + Workflow Update

**Status:** Complete
**Completed:** 2026-01-24

## What Was Built

Created Convex HTTP endpoint for n8n lead webhook and connected Eagle's Google Sheets workflow, restoring their lead capture flow that was broken during the Supabase → Convex migration.

## Deliverables

| Artifact | Description |
|----------|-------------|
| `convex/n8n.ts` | createLead mutation with phone normalization and duplicate detection |
| `convex/http.ts` | HTTP endpoint at `/webhook/n8n` with workspace slug resolution |
| n8n workflow | Updated to POST to `intent-otter-212.convex.site/webhook/n8n` |

## Technical Details

**HTTP Endpoint:**
- Path: `/webhook/n8n`
- Method: POST
- Workspace resolution: Queries by slug "eagle-overseas" in HTTP handler
- Response: `{ success: true, status: "created"|"exists", contact_id }`

**createLead Mutation:**
- Phone normalization: Handles +62 and 0 prefix for Indonesian numbers
- Duplicate detection: Checks by_workspace_phone index, returns "exists" if found
- New contacts: Created with source="n8n", tags=["google-form"]
- Metadata: Stores full form answers (Pendidikan, Jurusan, Aktivitas, Negara, Budget, etc.)

**n8n Workflow Configuration:**
- URL: `https://intent-otter-212.convex.site/webhook/n8n`
- Body: JSON.stringify($json) sends all fields including nested metadata
- Headers: Content-Type: application/json

## Commits

| Hash | Message |
|------|---------|
| 9c7acc5 | feat(06-01): add n8n webhook endpoint for lead creation |
| 11b685e | feat(06): n8n webhook + database page Convex migration |

## Verification

- [x] Convex compiles without errors
- [x] HTTP endpoint accessible at /webhook/n8n
- [x] Test POST returns success response
- [x] Duplicate phone numbers return "exists" status
- [x] New leads appear in Eagle's CRM
- [x] Metadata preserved correctly (form answers included)
- [x] Human verified end-to-end flow

## Notes

- URL uses intent-otter-212 deployment (not pleasant-antelope)
- n8n workflow uses JSON.stringify($json) for body to avoid parsing issues
- This is a temporary bridge until Eagle's website connects directly to CRM
