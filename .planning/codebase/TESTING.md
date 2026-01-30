# Testing Patterns

**Analysis Date:** 2026-01-30

## Test Framework

**Runner:**
- Jest 30.2.0
- Config: `jest.config.*` file not found (uses default Jest config or inline in `package.json`)
- TypeScript support: ts-jest 29.4.6

**Assertion Library:**
- Jest built-in assertions (`expect()`)
- No external assertion library needed

**Run Commands:**
```bash
npm test              # Run all tests via Jest
npm run lint          # ESLint type checking (prerequisite)
npm run type-check    # TypeScript compilation check
npm run pre-commit    # Full validation before commits
```

## Test File Organization

**Location:**
- Co-located with source code in `__tests__` subdirectories
- Test file location: `src/lib/ari/__tests__/scoring.test.ts`

**Naming:**
- Pattern: `[module-name].test.ts`
- Example: `scoring.test.ts` tests `scoring.ts`

**Structure:**
```
src/lib/
├── ari/
│   ├── scoring.ts          (source file)
│   └── __tests__/
│       └── scoring.test.ts  (test file)
```

## Test Structure

**Suite Organization:**

```typescript
describe('calculateLeadScore', () => {
  it('returns low score for empty form and no documents', () => {
    // Test body
  })

  it('returns high score for complete form with documents', () => {
    // Test body
  })
})

describe('getLeadTemperature', () => {
  it('returns hot for 70+', () => {
    // Test body
  })
})
```

**Patterns:**
- Use `describe()` to group related tests by function/feature
- Use `it()` with descriptive test names (not `test()`)
- Each test focuses on single behavior/assertion
- Arrange-Act-Assert pattern (setup, execute, verify)

**Example full test:**
```typescript
it('applies timeline penalty for 2+ year timeline', () => {
  // Arrange
  const formNear = { timeline: '6 bulan', country: 'UK' }
  const formFar = { timeline: '2 tahun lagi', country: 'UK' }

  // Act
  const nearResult = calculateLeadScore(formNear, undefined)
  const farResult = calculateLeadScore(formFar, undefined)

  // Assert
  expect(nearResult.score).toBeGreaterThan(farResult.score)
  expect(nearResult.breakdown.qualification_score).toBe(10)
  expect(farResult.breakdown.qualification_score).toBe(0)
})
```

## Mocking

**Framework:** Jest built-in mocking (no additional library needed)

**What to Mock:**
- External API calls (fetch, HTTP clients)
- Database queries (Convex queries)
- Date/time functions when testing time-dependent logic
- Environment variables for testing different configurations

**What NOT to Mock:**
- Pure utility functions (validation, calculations, formatters)
- Internal helper functions (test behavior not implementation)
- Business logic functions (test actual behavior)

**Pattern for mocking in current codebase:**
- Tests currently use real implementation without mocking external deps
- Example: `scoring.test.ts` tests scoring functions directly without mocking form validation or document APIs
- This works for pure calculation functions; refactor needed for functions with external dependencies

## Fixtures and Factories

**Test Data:**

From `scoring.test.ts`, test data is created inline:
```typescript
const form = {
  name: 'Budi Santoso',
  email: 'budi@test.com',
  english_level: 'IELTS 7.0',
  budget: '50 juta',
  timeline: '6 bulan',
  country: 'Australia',
}
const docs: DocumentStatus = {
  passport: true,
  cv: true,
  english_test: true,
  transcript: true,
}
const result = calculateLeadScore(form, docs)
```

**Location:**
- No centralized test fixtures directory
- Inline test data creation in `__tests__/` files
- Opportunity: Create `__fixtures__/` directories for reusable test data

## Coverage

**Requirements:** Not enforced (no coverage thresholds detected)

**View Coverage:**
```bash
npm test -- --coverage  # Generate coverage report (if Jest configured)
```

**Current Coverage Gaps:**
- Only one test file found: `src/lib/ari/__tests__/scoring.test.ts`
- Large areas untested:
  - API routes (`src/app/api/**/*.ts`) - no tests found
  - React components (`src/components/**/*.tsx`) - no tests found
  - Hooks (`src/lib/queries/use-*.ts`) - no tests found
  - Authentication/authorization (`src/lib/auth/**`) - no tests found

## Test Types

**Unit Tests:**
- Scope: Individual functions in isolation
- Approach: Test function inputs/outputs without dependencies
- Example: `scoring.test.ts` tests `calculateLeadScore`, `getLeadTemperature`, `getScoreReasons` functions
- All tests in codebase are currently unit tests

**Integration Tests:**
- Not currently implemented
- Would test API routes with Convex/database integration

**E2E Tests:**
- Not currently implemented
- Would test full user flows (login, create contact, send message, etc.)

## Common Patterns

**Async Testing:**
- Currently no async tests in codebase
- When needed, Jest supports:
```typescript
it('fetches data', async () => {
  const result = await fetchData()
  expect(result).toBeDefined()
})
```

**Error Testing:**
- Test error conditions with invalid inputs:
```typescript
it('validates email format', () => {
  const validEmail = calculateLeadScore({ email: 'test@example.com' }, undefined)
  const invalidEmail = calculateLeadScore({ email: 'not-an-email' }, undefined)

  // Valid email adds 5 points to basic score
  expect(validEmail.breakdown.basic_score).toBeGreaterThan(invalidEmail.breakdown.basic_score)
})
```

- Test boundary/edge cases:
```typescript
it('clamps engagement score to 0-10', () => {
  const overResult = calculateLeadScore(form, undefined, 15)
  const underResult = calculateLeadScore(form, undefined, -5)

  expect(overResult.breakdown.engagement_score).toBe(10)
  expect(underResult.breakdown.engagement_score).toBe(0)
})
```

**Parameterized Tests:**
- Jest supports snapshot testing and multiple assertions:
```typescript
it('returns correct temperature for different scores', () => {
  expect(getLeadTemperature(70)).toBe('hot')
  expect(getLeadTemperature(55)).toBe('warm')
  expect(getLeadTemperature(20)).toBe('cold')
})
```

## Assertion Patterns

**Common Jest matchers used:**
```typescript
expect(value).toBe(expectedValue)              // Strict equality
expect(value).toEqual(expectedValue)           // Deep equality
expect(value).toBeGreaterThan(number)
expect(value).toBeLessThan(number)
expect(value).toBeGreaterThanOrEqual(number)
expect(value).toBeDefined()
expect(value).toBeNull()
expect(array).toContain(item)
expect(string).toContain(substring)
expect(array.length).toBe(count)
```

## Test Execution

**Running Tests:**
```bash
npm test                    # Run all tests once
npm test -- --watch       # Watch mode (reruns on file changes)
npm test -- --coverage    # Generate coverage report
npm test -- --testNamePattern="pattern"  # Run specific tests
```

**Pre-commit Validation:**
```bash
npm run pre-commit   # Runs: npm run lint && npm run type-check
```
This should ideally also run tests before commits (currently not included).

## Testing Gaps & Priorities

**Critical Gaps (High Priority):**
- **API routes untested**: All endpoints in `src/app/api/**/*.ts` lack tests
  - Impacts: Cannot verify correct error handling, response formats, auth checks
  - Solution: Add test files for all route handlers with mocked Convex/auth

- **React components untested**: No component tests found
  - Impacts: UI regressions undetected, prop validation not verified
  - Solution: Add tests for Dashboard, Inbox, Database UI components using React Testing Library

- **Hooks untested**: All data hooks (`use-contacts.ts`, `use-messages.ts`, etc.) lack tests
  - Impacts: Query logic bugs go unnoticed, cache invalidation issues hidden
  - Solution: Test hooks with React Testing Library + `renderHook`

**Medium Priority:**
- **Error handling consistency**: Need tests verifying all error paths return correct status codes
- **Edge cases**: Form validation, boundary conditions in scoring logic

**Low Priority:**
- **E2E tests**: Would benefit from Playwright/Cypress tests for full user flows
- **Performance tests**: Load testing for API routes under concurrent requests

---

*Testing analysis: 2026-01-30*
