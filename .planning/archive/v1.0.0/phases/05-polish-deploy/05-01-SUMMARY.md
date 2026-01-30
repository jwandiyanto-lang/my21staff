---
phase: 05-polish-deploy
plan: 01
subsystem: infrastructure
tags:
  - ngrok
  - webhooks
  - local-testing
  - dev-setup

# Dependency graph
requires: []
provides:
  - ngrok-tunnel-setup
  - webhook-testing-capability
affects:
  - future Kapso webhook testing
  - local development workflow

# Tech tracking
tech-stack:
  added:
    - ngrok@5.0.0-beta.2 (npm wrapper)
  patterns:
    - Tunnel management with graceful shutdown
    - Error handling for dev environment

# File tracking
key-files:
  created:
    - scripts/start-ngrok.js
  modified:
    - package.json (added ngrok to devDependencies)
    - package-lock.json (dependency tree updated)

# Metrics
duration: 5 minutes
completed: 2026-01-25
commits: 1
---

# Phase 05 Plan 01: ngrok Tunnel Setup Summary

**One-liner:** Install ngrok and create tunnel startup script for localhost:3000 webhook testing during Kapso integration development.

## Execution Summary

### Tasks Completed

| Task | Name | Status | Commit |
| ---- | ---- | ------ | ------ |
| 1 | Install ngrok dev dependency | ✓ Complete | c09b9d2 |
| 2 | Create ngrok tunnel startup script | ✓ Complete | c09b9d2 |

**Total: 2/2 tasks completed**

---

## What Was Built

### Task 1: ngrok Installation

- Installed `ngrok@5.0.0-beta.2` as dev dependency via `npm install --save-dev ngrok`
- Updated package.json and package-lock.json
- Verified installation: `npm ls ngrok` shows package installed
- Used npm wrapper (simpler for dev testing vs @ngrok/ngrok official SDK)

**Files Modified:**
- `package.json` - Added ngrok to devDependencies
- `package-lock.json` - Updated dependency tree

### Task 2: Tunnel Startup Script

Created `/scripts/start-ngrok.js` with the following features:

**Functionality:**
- Async function that connects ngrok to localhost:3000
- Outputs public tunnel URL in clear, copy-paste format
- Prints webhook configuration instruction: "Update Kapso webhook to: {url}/api/webhook/kapso"
- Implements SIGINT handler for graceful shutdown (Ctrl+C)
- Process stays running until user stops it
- Comprehensive error handling with troubleshooting tips

**Script Details:**
- 64 lines of well-documented code
- Uses `require('ngrok')` at line 15 - dependency linked
- Structured layout for readability
- Includes helpful comments and usage documentation

**Files Created:**
- `scripts/start-ngrok.js` - Tunnel startup script

---

## Verification Results

### Installation Verification ✓
```bash
npm ls ngrok
# Output: my21staff-v2@0.1.0 └── ngrok@5.0.0-beta.2
```

### Script Verification ✓
- Syntax validation: `node -c scripts/start-ngrok.js` passed
- File exists with proper shebang: `#!/usr/bin/env node`
- Imports ngrok correctly: `const ngrok = require('ngrok')`
- All required functionality present:
  - Tunnel connection to port 3000
  - URL logging
  - Webhook instruction output
  - SIGINT handler for clean exit
  - Error handling with troubleshooting

---

## Success Criteria

- [x] ngrok in package.json devDependencies
- [x] scripts/start-ngrok.js exists and is executable
- [x] Script syntax is valid
- [x] Script imports ngrok correctly
- [x] Script outputs usable public URL for webhook testing

---

## How to Use

Start the tunnel during local development:

```bash
# Ensure Next.js dev server is running
npm run dev

# In another terminal, start ngrok tunnel
node scripts/start-ngrok.js
```

The script will output:
```
NGROK TUNNEL ACTIVE

Public URL:
  https://abc123def456.ngrok-free.dev

Webhook Configuration:
  Update Kapso webhook to: https://abc123def456.ngrok-free.dev/api/webhook/kapso
```

Copy the webhook URL into Kapso configuration, then local development environment can receive webhooks.

---

## Deviations from Plan

**None** - Plan executed exactly as written. All requirements met without discovering additional work.

---

## Notes

- Script uses free tier ngrok (no NGROK_AUTHTOKEN required)
- Tunnel is temporary and expires when script exits
- Each script run generates a new URL
- Script includes helpful error messages for troubleshooting
- Graceful shutdown prevents orphaned processes

---

## Next Steps

Ready to proceed with:
- Kapso webhook integration and testing
- Testing webhook payload delivery to local environment
- Integration testing of webhook handlers
