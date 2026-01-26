# 05-01 Webhook Verification Test Results

Date: 2026-01-26
Endpoint: https://intent-otter-212.convex.site/webhook/n8n

## Test 1: Create New Lead

**Request:**
```bash
curl -X POST https://intent-otter-212.convex.site/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead Phase5",
    "phone": "+6281234500001",
    "email": "test-phase5@example.com",
    "lead_score": 65,
    "metadata": {
      "form_answers": {
        "Level Bahasa Inggris": "Menengah",
        "Budget": "100-300jt",
        "Negara Tujuan": "UK"
      },
      "source": "phase-5-verification"
    }
  }'
```

**Response:**
- HTTP Status: 200
- Body: `{"success":true,"status":"created","contact_id":"j972rhnsv20nj8hvpxr57kt9a17zyjgy"}`

**Result:** ✅ PASS - Lead created successfully

## Test 2: Duplicate Detection

**Request:**
```bash
curl -X POST https://intent-otter-212.convex.site/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead Phase5 Duplicate",
    "phone": "+6281234500001",
    "email": "duplicate@example.com",
    "lead_score": 80,
    "metadata": {
      "source": "phase-5-duplicate-test"
    }
  }'
```

**Response:**
- HTTP Status: 200
- Body: `{"success":true,"status":"exists","contact_id":"j972rhnsv20nj8hvpxr57kt9a17zyjgy"}`

**Result:** ✅ PASS - Duplicate detected, same contact_id returned

## Verification Summary

✅ n8n webhook endpoint responds with 200 on valid lead data
✅ Lead created via webhook appears in Convex database
✅ Duplicate phone numbers return 'exists' status (not error)
✅ Idempotent behavior confirmed (no error on duplicate)

**Next Step:** Human verification in Convex dashboard and Contact Database UI
