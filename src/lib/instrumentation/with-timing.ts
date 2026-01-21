import type { NextRequest, NextResponse } from "next/server";

/**
 * Metrics collected for a single API request
 */
export interface RequestMetrics {
  queryCount: number;
  queries: string[];
}

/**
 * Create a fresh metrics object for a new request
 */
export function createRequestMetrics(): RequestMetrics {
  return {
    queryCount: 0,
    queries: [],
  };
}

/**
 * Log a query execution with its duration
 * @param metrics - The metrics object to update
 * @param table - The table name being queried
 * @param durationMs - Query execution time in milliseconds
 */
export function logQuery(metrics: RequestMetrics, table: string, durationMs: number): void {
  metrics.queryCount++;
  metrics.queries.push(`${table}:${durationMs}ms`);
}

/**
 * Higher-order function that wraps API route handlers with timing instrumentation
 * Logs total execution time and status on completion
 *
 * @param routeName - The route path for logging (e.g., '/api/contacts/by-phone')
 * @param handler - The Next.js route handler function
 * @returns Wrapped handler function with timing
 */
export function withTiming<T extends NextResponse>(
  routeName: string,
  handler: (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> },
  ) => Promise<T>,
): (request: NextRequest, context?: { params: Promise<Record<string, string>> }) => Promise<T> {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> },
  ): Promise<T> => {
    const startTime = performance.now();
    const method = request.method;

    try {
      const response = await handler(request, context);
      const durationMs = Math.round(performance.now() - startTime);

      console.log(`[API] ${routeName} ${method} - ${durationMs}ms - ${response.status}`);

      return response;
    } catch (error) {
      const durationMs = Math.round(performance.now() - startTime);
      const errorMessage = error instanceof Error ? error.message : String(error);

      console.log(
        `[API] ${routeName} ${method} - ${durationMs}ms - ERROR: ${errorMessage}`,
      );

      throw error;
    }
  };
}

/**
 * Log a summary of all queries executed for a request
 * @param routeName - The route path for logging context
 * @param metrics - The metrics object containing query data
 */
export function logQuerySummary(routeName: string, metrics: RequestMetrics): void {
  const queriesStr = metrics.queries.join(", ");
  console.log(
    `[Queries] ${routeName} - ${metrics.queryCount} query${metrics.queryCount === 1 ? "" : "ies"}: ${queriesStr}`,
  );
}
