import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { getSupabaseConfig } from './config'

export async function createClient() {
  const cookieStore = await cookies()
  const config = getSupabaseConfig()

  return createServerClient<Database>(
    config.url,
    config.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Admin client for server-side operations (bypasses RLS)
// Note: This uses createServerClient which still works but with empty cookies
export function createAdminClient() {
  const config = getSupabaseConfig()
  return createServerClient<Database>(
    config.url,
    config.serviceRoleKey!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}

// Admin client for API routes/webhooks (no cookies needed)
// Uses the standard Supabase client directly
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createApiAdminClient() {
  const config = getSupabaseConfig()
  if (!config.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createSupabaseClient<Database>(
    config.url,
    config.serviceRoleKey
  )
}
