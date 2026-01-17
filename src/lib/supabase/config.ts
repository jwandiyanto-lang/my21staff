type Environment = 'production' | 'local' | 'test'

interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

export function getSupabaseConfig(): SupabaseConfig {
  const env = (process.env.SUPABASE_ENV || 'production') as Environment

  switch (env) {
    case 'local':
      return {
        url: process.env.NEXT_PUBLIC_LOCAL_SUPABASE_URL!,
        anonKey: process.env.NEXT_PUBLIC_LOCAL_SUPABASE_ANON_KEY!,
        serviceRoleKey: process.env.LOCAL_SUPABASE_SERVICE_ROLE_KEY,
      }
    case 'test':
      return {
        url: process.env.NEXT_PUBLIC_TEST_SUPABASE_URL!,
        anonKey: process.env.NEXT_PUBLIC_TEST_SUPABASE_ANON_KEY!,
        serviceRoleKey: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY,
      }
    case 'production':
    default:
      return {
        // Fallback values for build time (client will re-fetch at runtime)
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
  }
}

export function getCurrentEnvironment(): Environment {
  return (process.env.SUPABASE_ENV || 'production') as Environment
}
