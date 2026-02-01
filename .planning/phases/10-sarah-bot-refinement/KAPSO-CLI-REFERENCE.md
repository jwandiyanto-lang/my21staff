# Kapso CLI & API Reference for my21staff

This document provides a complete reference for modifying Kapso workflows in the my21staff project, including what can be automated via API/CLI and what requires manual Dashboard interaction.

---

## Project Context

**Project:** my21staff
**Project ID:** `1fda0f3d-a913-4a82-bc1f-a07e1cb5213c`
**Kapso API Key:** (stored in `.kapso-project.env`)

**Workflows:**

| Workflow | ID | Purpose |
|----------|-----|---------|
| Rules Engine - Keyword Triggers | `6cae069e-7d5c-4fbb-834d-79e1f66e4672` | Main routing workflow |
| Sarah Chat Bot | `048c075f-bab4-4ccd-920c-fe5e9a3435b5` | Lead qualification bot |

**Phone Configuration:**

- **Number:** +62 813-1859-025
- **Phone Number ID:** 957104384162113
- **Config ID:** `827ce387-4f0a-4ca7-9e5a-0a3af01c9320`

**Convex Deployment:** `https://intent-otter-212.convex.cloud`

---

## What CAN Be Done via API/CLI

The Kapso Platform API supports the following operations:

### Workflow Operations (READ ONLY)

**Get workflow definition:**
```bash
curl -X GET "https://app.kapso.ai/api/v1/workflows/048c075f-bab4-4ccd-920c-fe5e9a3435b5" \
  -H "X-API-Key: ${KAPSO_API_KEY}"
```

Returns complete workflow graph including:
- Nodes (start, function, agent, decide, send_text)
- Edges (connections between nodes)
- Lock version (for optimistic locking)

**List all workflows in project:**
```bash
curl -X GET "https://app.kapso.ai/api/v1/projects/1fda0f3d-a913-4a82-bc1f-a07e1cb5213c/workflows" \
  -H "X-API-Key: ${KAPSO_API_KEY}"
```

### Function Operations (CREATE & READ)

**Create new function:**
```bash
curl -X POST "https://app.kapso.ai/api/v1/projects/1fda0f3d-a913-4a82-bc1f-a07e1cb5213c/functions" \
  -H "X-API-Key: ${KAPSO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-function",
    "slug": "my-function",
    "description": "Function description",
    "code": "export default async function handler(request) { ... }"
  }'
```

**Note:** Function slugs must be lowercase alphanumeric with hyphens only (no underscores).

**Deploy function:**
```bash
curl -X POST "https://app.kapso.ai/api/v1/functions/${FUNCTION_ID}/deploy" \
  -H "X-API-Key: ${KAPSO_API_KEY}"
```

**Read function code:**
```bash
curl -X GET "https://app.kapso.ai/api/v1/functions/${FUNCTION_ID}" \
  -H "X-API-Key: ${KAPSO_API_KEY}"
```

**List all functions in project:**
```bash
curl -X GET "https://app.kapso.ai/api/v1/projects/1fda0f3d-a913-4a82-bc1f-a07e1cb5213c/functions" \
  -H "X-API-Key: ${KAPSO_API_KEY}"
```

### Testing via API

**Send test WhatsApp message (requires phone number):**
```bash
curl -X POST "https://app.kapso.ai/api/v1/whatsapp/send" \
  -H "X-API-Key: ${KAPSO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+62xxx",
    "type": "text",
    "text": { "body": "Test message" }
  }'
```

---

## What CANNOT Be Done via API/CLI (Dashboard Only)

The following operations are NOT supported by the Kapso Platform API and require manual Dashboard interaction:

### Workflow Editing

- **Edit workflow graph** (add/remove nodes, modify edges)
- **Edit Agent node system prompt**
- **Edit function code in existing workflow** (must create new function and update reference)
- **Change workflow trigger configuration**
- **Set workflow status** (draft → active)
- **Delete nodes from workflow**

### Configuration Management

- **Set environment variables** (workflow-level or project-level)
- **Manage project secrets** (e.g., GEMINI_API_KEY, CONVEX_DEPLOYMENT_URL)
- **Configure phone number settings**
- **Update webhook configurations**

### Agent Node Configuration

- **Change AI model** (Gemini, OpenAI, etc.)
- **Update system prompt**
- **Modify temperature/max tokens**
- **Change max iterations**

### Function Node Configuration

- **Update function code inline** (must create new function resource)
- **Change timeout settings**
- **Modify environment variable bindings**

---

## MCP Tools Available (when connected to project)

**Current Status:** MCP server is connected to Eagle project, not my21staff.

To use MCP tools for my21staff, you would need to:
1. Stop current MCP server
2. Reconfigure with my21staff API key
3. Restart MCP server

**Available MCP Tools (when connected):**

### whatsapp_send_text_message
Send test messages to verify Sarah's behavior.

**Usage:**
```typescript
mcp__kapso__whatsapp_send_text_message({
  to: "+62xxx",
  body: "Halo"
})
```

### whatsapp_get_contact_context
Check conversation state for debugging.

**Usage:**
```typescript
mcp__kapso__whatsapp_get_contact_context({
  contact_phone: "+62xxx"
})
```

### whatsapp_search_conversations
Find specific conversations.

**Usage:**
```typescript
mcp__kapso__whatsapp_search_conversations({
  query: "keyword",
  limit: 10
})
```

### whatsapp_configs_overview
List all phone configurations in project.

**Usage:**
```typescript
mcp__kapso__whatsapp_configs_overview()
```

**Note:** These tools provide a higher-level interface than raw API calls, with automatic authentication and response parsing.

---

## Testing Sarah Changes

After updating Sarah's system prompt or check-keywords function in the Kapso Dashboard, follow this testing workflow:

### Step 1: Update Dashboard

1. Open https://app.kapso.ai
2. Navigate to: Workflows → Sarah Chat Bot
3. Click on the "Sarah (Gemini 2.5 Flash)" Agent node
4. Update System Prompt from `Sarah-Kapso-Prompt.md`
5. Navigate to check-keywords function node
6. Update handoff keywords array
7. Save workflow
8. Ensure workflow is **Active** (not Draft)

### Step 2: Test via WhatsApp

Send messages to: **+62 813-1859-025**

**Test 1: Basic tone**
```
You: Halo
Sarah: [Should use "kamu", no emojis, under 140 chars]
```

**Test 2: Slot order**
```
You: Halo
Sarah: [Greeting + how are you]
You: Baik
Sarah: [Should ask for NAME first]
```

**Test 3: Handoff trigger**
```
You: mau bicara dengan orang
Sarah: [Should transfer immediately, NOT continue bot flow]
```

**Test 4: Stall detection**
```
You: hmm
You: ok
You: menarik
Sarah: [After 3+ stalls, should recognize and offer handoff]
```

### Step 3: Check Convex State

Verify state is being saved correctly:

```bash
curl "https://intent-otter-212.convex.cloud/sarah/state?contact_phone=+62xxx"
```

Expected response:
```json
{
  "state": "qualifying",
  "extracted_data": {
    "name": "User Name",
    "business_type": null,
    ...
  },
  "lead_score": 0,
  "language": "id",
  "message_count": 3
}
```

### Step 4: Debug Workflow Execution

If Sarah's behavior is unexpected:

1. **Check workflow is active:**
   ```bash
   curl -X GET "https://app.kapso.ai/api/v1/workflows/048c075f-bab4-4ccd-920c-fe5e9a3435b5" \
     -H "X-API-Key: ${KAPSO_API_KEY}" | jq '.status'
   ```

2. **Check recent function deployments:**
   ```bash
   curl -X GET "https://app.kapso.ai/api/v1/functions?project_id=1fda0f3d-a913-4a82-bc1f-a07e1cb5213c" \
     -H "X-API-Key: ${KAPSO_API_KEY}" | jq '.[] | select(.name | contains("check-keywords"))'
   ```

3. **View execution logs in Dashboard:**
   - Go to: Workflows → Sarah Chat Bot → Executions tab
   - Click on recent execution
   - Inspect each node's input/output

---

## Workflow Modification Pattern

When you need to modify Sarah's behavior:

### For Prompt Changes (System Prompt, Tone, Phrasing)

**Location:** Agent node system prompt
**Method:** Manual Dashboard edit
**Steps:**
1. Update `Sarah-Kapso-Prompt.md` locally
2. Copy updated prompt
3. Open Kapso Dashboard → Workflows → Sarah Chat Bot
4. Click on Sarah Agent node
5. Paste new system prompt
6. Save workflow
7. Test via WhatsApp

### For Logic Changes (Handoff Keywords, Conditions)

**Location:** Function node code
**Method:** Create new function version OR manual Dashboard edit

**Option A: Create new function (versioned)**
```bash
# 1. Create new function
curl -X POST "https://app.kapso.ai/api/v1/projects/1fda0f3d-a913-4a82-bc1f-a07e1cb5213c/functions" \
  -H "X-API-Key: ${KAPSO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @new-function.json

# 2. Deploy function
curl -X POST "https://app.kapso.ai/api/v1/functions/${NEW_FUNCTION_ID}/deploy" \
  -H "X-API-Key: ${KAPSO_API_KEY}"

# 3. Update workflow graph to reference new function (Dashboard only)
```

**Option B: Edit inline (faster for small changes)**
1. Open Kapso Dashboard → Workflows → Sarah Chat Bot
2. Click on function node (e.g., check-keywords)
3. Edit code directly
4. Save workflow
5. Test via WhatsApp

### For State Management Changes

**Location:** Convex HTTP endpoints
**Method:** Edit Convex function code

**Steps:**
1. Edit `convex/sarah/*.ts` files locally
2. Deploy to Convex: `npx convex deploy`
3. No Kapso changes needed (functions call Convex endpoints)
4. Test via WhatsApp

---

## Troubleshooting

### Issue: Sarah doesn't respond

**Check 1: Workflow is active**
```bash
curl -X GET "https://app.kapso.ai/api/v1/workflows/048c075f-bab4-4ccd-920c-fe5e9a3435b5" \
  -H "X-API-Key: ${KAPSO_API_KEY}" | jq '.status'
```
Expected: `"active"` (not `"draft"`)

**Check 2: Phone config is connected**
```bash
curl -X GET "https://app.kapso.ai/api/v1/whatsapp/configs/827ce387-4f0a-4ca7-9e5a-0a3af01c9320" \
  -H "X-API-Key: ${KAPSO_API_KEY}"
```

**Check 3: Rules Engine routes to Sarah**
- Dashboard → Workflows → Rules Engine
- Verify `ai_fallback` path connects to Sarah Chat Bot

### Issue: Sarah responses are wrong

**Check 1: System prompt is updated**
- Dashboard → Workflows → Sarah Chat Bot → Sarah Agent node
- Verify system prompt matches `Sarah-Kapso-Prompt.md`

**Check 2: check-keywords function has new keywords**
- Dashboard → Workflows → Sarah Chat Bot → check-keywords node
- Verify handoff keywords array is updated

**Check 3: Convex state is clean**
```bash
# Reset conversation state for testing
curl -X POST "https://intent-otter-212.convex.cloud/sarah/reset" \
  -H "Content-Type: application/json" \
  -d '{"contact_phone": "+62xxx"}'
```

### Issue: Handoff not working

**Check 1: check-keywords function deployed**
```bash
curl -X GET "https://app.kapso.ai/api/v1/functions?project_id=1fda0f3d-a913-4a82-bc1f-a07e1cb5213c" \
  -H "X-API-Key: ${KAPSO_API_KEY}" | jq '.[] | select(.slug == "check-keywords") | .deployed_at'
```

**Check 2: Workflow routing**
- Dashboard → Workflows → Sarah Chat Bot → check-keywords node
- Verify output routes to `route-decision` node
- Verify `route-decision` has handoff branch

### Issue: State not persisting

**Check 1: Convex environment variable set**
- Dashboard → Workflows → Sarah Chat Bot → Settings → Environment Variables
- Verify `CONVEX_DEPLOYMENT_URL = https://intent-otter-212.convex.cloud`

**Check 2: save-state function works**
```bash
# Check recent state saves in Convex
curl "https://intent-otter-212.convex.cloud/sarah/state?contact_phone=+62xxx"
```

---

## API Limitations Discovered

During Phase 03-03 implementation, we discovered these API limitations:

1. **Workflow variables:** API does not support CRUD operations for workflow environment variables (discovery only)
2. **Agent node prompts:** Cannot update system prompt via API (Dashboard only)
3. **Function code in workflow:** Cannot update function code inline via API (must create new function resource)
4. **Workflow activation:** Cannot change workflow status from draft to active via API
5. **Secrets management:** Cannot set project secrets via API (Dashboard only)

**Workaround:** For these operations, use Kapso Dashboard UI. Automation is limited to:
- Creating new functions
- Deploying functions
- Reading workflow definitions
- Sending test messages

---

## Example: Complete Sarah Update Workflow

This is the recommended workflow for updating Sarah's behavior:

### Local Changes
```bash
# 1. Update system prompt locally
vim business_21/03_bots/Sarah-Kapso-Prompt.md

# 2. Commit changes
git add business_21/03_bots/Sarah-Kapso-Prompt.md
git commit -m "feat: update Sarah handoff keywords"
```

### Dashboard Changes
1. Open https://app.kapso.ai
2. Navigate to: my21staff project → Workflows → Sarah Chat Bot
3. **Update Agent node:**
   - Click "Sarah (Gemini 2.5 Flash)" node
   - Copy content from `Sarah-Kapso-Prompt.md` (Instructions section)
   - Paste into System Prompt field
   - Verify Max Tokens = 150, Temperature = 0.7
   - Click Save
4. **Update check-keywords function:**
   - Click "check-keywords" function node
   - Copy handoff keywords array from `Sarah-Kapso-Prompt.md`
   - Update the keywords array in function code
   - Click Save
5. **Verify workflow status:**
   - Ensure workflow shows "Active" (green indicator)
6. **Save workflow:**
   - Click "Save Workflow" button in top right

### Testing
```bash
# 1. Send test message via WhatsApp
# Message to: +62 813-1859-025
# Content: "Halo"

# 2. Verify response matches new behavior
# Expected: Uses "kamu", no emojis, under 140 chars

# 3. Test handoff trigger
# Message: "mau bicara dengan orang"
# Expected: Immediate handoff, no bot continuation

# 4. Check Convex state
curl "https://intent-otter-212.convex.cloud/sarah/state?contact_phone=+62xxx"
```

### Verification
- [ ] Agent node system prompt matches local file
- [ ] check-keywords function has updated handoff keywords
- [ ] Workflow is Active
- [ ] WhatsApp responses show correct behavior
- [ ] Handoff triggers work immediately
- [ ] Convex state persists correctly

---

## Quick Reference Commands

**Get Sarah workflow definition:**
```bash
curl -s -X GET "https://app.kapso.ai/api/v1/workflows/048c075f-bab4-4ccd-920c-fe5e9a3435b5" \
  -H "X-API-Key: ${KAPSO_API_KEY}" | jq '.graph'
```

**List all functions:**
```bash
curl -s -X GET "https://app.kapso.ai/api/v1/projects/1fda0f3d-a913-4a82-bc1f-a07e1cb5213c/functions" \
  -H "X-API-Key: ${KAPSO_API_KEY}" | jq '.[] | {name, slug, deployed_at}'
```

**Check Convex state:**
```bash
curl -s "https://intent-otter-212.convex.cloud/sarah/state?contact_phone=+62xxx" | jq
```

**Test message via API:**
```bash
curl -X POST "https://app.kapso.ai/api/v1/whatsapp/send" \
  -H "X-API-Key: ${KAPSO_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"to": "+62xxx", "type": "text", "text": {"body": "Halo"}}'
```

---

**Last updated:** 2026-02-01
**Source:** Phase 03-03 implementation experience + Phase 10-01 CLI investigation
**Related files:**
- `.planning/phases/03-sarah-chat-bot/IMPLEMENTATION-STATUS.md`
- `business_21/03_bots/Sarah-Kapso-Prompt.md`
- `.kapso-project.env`
