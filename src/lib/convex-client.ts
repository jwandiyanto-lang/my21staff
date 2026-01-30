/**
 * Convex client for API routes
 *
 * Provides a lightweight wrapper for Convex queries in server contexts (API routes).
 * Avoids Edge runtime issues by dynamically importing cv fetchData.
 */

import type { Id } from './_generated/dataModel'
import type { FunctionArgs, FunctionReference } from 'convex/server'

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
export async function convexQuery<
  T extends QueryFunc,
  A extends FunctionArgs<T>
>(
  query: T,
  args: A
): Promise<Awaited<ReturnType<T>>> {
  const { fetchQuery } = await import('convex/nextjs/server')
  return fetchQuery(query, args) as Promise<Awaited<ReturnType<T>>>
}

/**
 * Execute a Convex mutation from a server context (API route)
 *
 * @param mutation - The Convex mutation function to execute
 * @param args - Arguments to pass to the mutation
 * @returns The mutation result
 */
export async function convexMutation<
  T extends FunctionReference<'mutation', 'public'>,
  A extends FunctionArgs<T>
>(
  mutation: T,
  args: A
): Promise<Awaited<ReturnType<T>>> {
  const { fetchMutation } = await import('convex/nextjs/server')
  return fetchMutation(mutation, args) as Promise<Awaited<ReturnType<T>>>
}
