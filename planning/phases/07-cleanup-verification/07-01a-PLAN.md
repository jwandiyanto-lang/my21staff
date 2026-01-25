---
phase: 07-cleanup-verification
plan: 01a
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/auth/callback/route.ts
  - src/app/api/auth/password-changed/route.ts
autonomous: true

must_haves:
  truths:
    - "Auth callback route deleted (Clerk handles OAuth/password reset)"
    - "Password change route deleted (Clerk handles)"
  artifacts:
    - path: "src/app/auth/callback/route.ts"
      status: "deleted"
    - path: "src/app/api/auth/password-changed/route.ts"
      status: "deleted"
  key_links: []
---

<objective>
Delete Supabase auth routes that Clerk now handles.

Purpose: Remove dead code - Clerk handles OAuth callbacks and password resets.
Output: Auth routes deleted, no broken imports
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/02-middleware-provider-auth-ui/02-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Delete Supabase auth callback route</name>
  <files>src/app/auth/callback/route.ts</files>
  <action>
Delete the Supabase OAuth callback route:

1. Delete the file:
```bash
rm src/app/auth/callback/route.ts
```

2. Delete the containing directory if empty:
```bash
rmdir src/app/auth/ 2>/dev/null || true
```

This route is dead code - Clerk handles OAuth callbacks via [[...sign-in]] catch-all.
  </action>
  <verify>
- `ls src/app/auth/callback/route.ts 2>/dev/null || echo "Deleted"` returns "Deleted"
- `npm run build` passes (no broken imports)
  </verify>
  <done>
OAuth callback route deleted, no references remaining
  </done>
</task>

<task type="auto">
  <name>Task 2: Delete Supabase password-changed webhook route</name>
  <files>src/app/api/auth/password-changed/route.ts</files>
  <action>
Delete the Supabase password-changed webhook route:

1. Delete the file:
```bash
rm src/app/api/auth/password-changed/route.ts
```

2. Delete the containing directory if empty:
```bash
rmdir src/app/api/auth/password-changed/ 2>/dev/null || true
rmdir src/app/api/auth/ 2>/dev/null || true
```

This route was a Supabase webhook for password changes. Clerk handles password management internally.
  </action>
  <verify>
- `ls src/app/api/auth/password-changed/route.ts 2>/dev/null || echo "Deleted"` returns "Deleted"
- `npm run build` passes
  </verify>
  <done>
Password webhook route deleted, Clerk handles password management
  </done>
</task>

</tasks>

<verification>
Run full build to verify no broken imports:
```bash
npm run build
```

Check no Supabase auth routes remain:
```bash
ls src/app/auth/ src/app/api/auth/ 2>/dev/null || echo "Auth routes cleaned"
```
</verification>

<success_criteria>
1. Auth callback route deleted
2. Password change route deleted
3. `npm run build` passes
</success_criteria>

<output>
After completion, create `.planning/phases/07-cleanup-verification/07-01a-SUMMARY.md`
</output>
