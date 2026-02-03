---
phase: quick
plan: 001
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/api/contacts/[id]/notes/route.ts
autonomous: true

must_haves:
  truths:
    - "Production build completes without TypeScript errors"
    - "Vercel deployment succeeds after push"
    - "Notes API still functions correctly for existing features"
  artifacts:
    - path: "src/app/api/contacts/[id]/notes/route.ts"
      provides: "Notes API without title field"
      contains: "convex.mutation(api.contactNotes.create"
  key_links:
    - from: "src/app/api/contacts/[id]/notes/route.ts"
      to: "convex/contactNotes.ts"
      via: "mutation args must match schema"
      pattern: "contact_id.*content.*user_id"
---

<objective>
Fix production build error by removing the `title` field from the notes API route.

Purpose: The live site is showing 404 because Vercel build fails with TypeScript error - the API passes a `title` field that doesn't exist in the Convex mutation schema.

Output: Working production build, restored live site functionality.
</objective>

<execution_context>
@/home/jfransisco/.claude/get-shit-done/workflows/execute-plan.md
@/home/jfransisco/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/app/api/contacts/[id]/notes/route.ts
@convex/contactNotes.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Remove title field from notes API route</name>
  <files>src/app/api/contacts/[id]/notes/route.ts</files>
  <action>
  In src/app/api/contacts/[id]/notes/route.ts:

  1. Remove the title validation block (lines 76-81):
     ```typescript
     if (!body.title || !body.title.trim()) {
       return NextResponse.json(
         { error: 'Note title is required' },
         { status: 400 }
       )
     }
     ```

  2. Remove `title: body.title.trim(),` from the mutation call at line 93.
     The mutation call should only pass: contact_id, content, user_id, due_date.

  3. Keep the dev mode mock response as-is (line 59) - it's fine to return extra fields in mock data.

  The resulting mutation call should look like:
  ```typescript
  const note = await convex.mutation(api.contactNotes.create, {
    contact_id: id as any,
    content: body.content.trim(),
    user_id: userId,
    due_date: body.due_date ? new Date(body.due_date).getTime() : undefined,
  })
  ```
  </action>
  <verify>
  Run TypeScript check:
  ```bash
  npx tsc --noEmit
  ```
  Should complete without errors on the notes route file.
  </verify>
  <done>
  - TypeScript compiles without errors
  - Mutation call only passes fields that exist in Convex schema (contact_id, content, user_id, due_date)
  </done>
</task>

<task type="auto">
  <name>Task 2: Verify build and push to trigger deployment</name>
  <files>src/app/api/contacts/[id]/notes/route.ts</files>
  <action>
  1. Run production build locally to confirm fix:
     ```bash
     npm run build
     ```

  2. If build succeeds, commit and push:
     ```bash
     git add src/app/api/contacts/[id]/notes/route.ts
     git commit -m "fix(api): remove title field from notes mutation

     The Convex contactNotes.create mutation doesn't accept a title field.
     Removing it fixes the TypeScript build error blocking production."
     git push origin master
     ```

  3. Monitor Vercel deployment (check https://vercel.com/dashboard or wait ~2 min).
  </action>
  <verify>
  - `npm run build` completes successfully
  - Git push triggers Vercel deployment
  - https://my21staff.vercel.app loads without 404 error
  </verify>
  <done>
  - Production build passes
  - Changes pushed to master
  - Live site restored
  </done>
</task>

</tasks>

<verification>
1. TypeScript check passes: `npx tsc --noEmit`
2. Production build passes: `npm run build`
3. Live site loads: https://my21staff.vercel.app returns 200
</verification>

<success_criteria>
- Production build completes without TypeScript errors
- Vercel deployment succeeds
- Live site is accessible (no 404)
</success_criteria>

<output>
After completion, create `.planning/quick/001-fix-production-build-error-in-contacts-n/001-SUMMARY.md`
</output>
