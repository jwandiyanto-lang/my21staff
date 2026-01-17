'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { X } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirect || '/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Landing page background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#9CB99C] via-[#A8C5A8] to-[#B5D1B5]">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Floating shapes for depth */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-[#2D4B3E]/10 rounded-full blur-2xl" />
      </div>

      {/* Frosted overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-black/5" />

      {/* Navigation */}
      <nav className="relative z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-white drop-shadow-sm">
            21
          </Link>
        </div>
      </nav>

      {/* Glass login card */}
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Glass card */}
          <div
            className="relative backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.5)'
            }}
          >
            {/* Close button */}
            <Link
              href="/"
              className="absolute top-4 right-4 p-2 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </Link>

            {/* Content */}
            <div className="p-8 pt-12">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back
                </h1>
                <p className="text-gray-600">
                  Sign in to your my21staff account
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                  <div className="p-4 text-sm text-red-700 bg-red-100/80 backdrop-blur rounded-xl border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#2D4B3E]/30 focus:border-[#2D4B3E]/50 transition-all placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#2D4B3E]/30 focus:border-[#2D4B3E]/50 transition-all placeholder:text-gray-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#2D4B3E] text-white font-semibold hover:bg-[#243D32] focus:outline-none focus:ring-2 focus:ring-[#2D4B3E]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#2D4B3E]/20"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <Link
                    href={redirect ? `/signup?redirect=${encodeURIComponent(redirect)}` : '/signup'}
                    className="font-semibold text-[#2D4B3E] hover:underline"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Subtle reflection effect */}
          <div
            className="h-16 bg-gradient-to-b from-white/20 to-transparent rounded-b-3xl mx-4 blur-sm"
            style={{ transform: 'scaleY(-0.3) translateY(-100%)' }}
          />
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#9CB99C] via-[#A8C5A8] to-[#B5D1B5]" />}>
      <LoginForm />
    </Suspense>
  )
}
