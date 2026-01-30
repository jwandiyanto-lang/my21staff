/**
 * Convex client for API routes
 *
 * Provides a lightweight wrapper for Convex queries in server contexts (API routes).
 * Avoids Edge runtime issues by dynamically importing cv fetchData.
 */

import type { Id } from 'convex/_generated/dataModel'
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server'

type QueryFunc = FunctionReference<'query', 'public'>

/**
 * Execute a Convex query from a server context (API route)
 *
 * This helper function runs Convex queries in server contexts where
 * useQuery hook is not available.
 *
 * @param query - The Convex query function to execute
 * @param args - Arguments to pass to the query
 * @returns The query result
 */
export async function convexQuery<T extends QueryFunc>(
  query: T,
  args: FunctionArgs<T>
): Promise<FunctionReturnType<T>> {
  const { fetchQuery } = await import('convex/nextjs')
  return fetchQuery(query, args)
}

/**
 * Execute a Convex mutation from a server context (API route)
 *
 * @param mutation - The Convex mutation function to execute
 * @param args - Arguments to pass to the mutation
 * @returns The mutation result
 */
export async function convexMutation<T extends FunctionReference<'mutation', 'public'>>(
  mutation: T,
  args: FunctionArgs<T>
): Promise<FunctionReturnType<T>> {
  const { fetchMutation } = await import('convex/nextjs')
  return fetchMutation(mutation, args)
}
