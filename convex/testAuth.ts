import { mutation, query } from "./_generated/server";

/**
 * Test Clerk authentication integration.
 * This mutation verifies that:
 * 1. Clerk JWT is received by Convex
 * 2. JWT validates against auth.config.ts
 * 3. User identity is accessible via ctx.auth.getUserIdentity()
 *
 * Usage: Call from authenticated context after Phase 2 UI is complete.
 * For Phase 1, manually test via Convex Dashboard logs.
 */
export const testClerkAuth = mutation({
  handler: async (ctx) => {
    // Log to Convex Dashboard -> Logs
    console.log("Testing Clerk authentication...");

    const identity = await ctx.auth.getUserIdentity();
    console.log("Identity:", identity);

    if (!identity) {
      throw new Error(
        "Not authenticated - Clerk JWT validation failed. Check: 1) JWT template named 'convex', 2) Issuer URL matches CLERK_JWT_ISSUER_DOMAIN, 3) Token not expired"
      );
    }

    return {
      success: true,
      message: "Clerk -> Convex authentication working!",
      userId: identity.subject,
      issuer: identity.issuer,
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});

/**
 * Query version for read-only auth testing.
 */
export const checkAuth = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    return {
      isAuthenticated: !!identity,
      userId: identity?.subject ?? null,
      issuer: identity?.issuer ?? null,
    };
  },
});
