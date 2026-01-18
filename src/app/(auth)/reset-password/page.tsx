'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Lock, Loader2, CheckCircle } from 'lucide-react'

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function checkAuth() {
      // Check if there's a code in URL to exchange (PKCE flow)
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')

      if (code) {
        // Exchange code for session
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          console.error('Code exchange error:', exchangeError)
          setError('Reset password link is invalid or expired. Please request a new link.')
          setCheckingAuth(false)
          return
        }

        // Remove code from URL to prevent re-exchange on refresh
        url.searchParams.delete('code')
        window.history.replaceState({}, '', url.toString())

        setCheckingAuth(false)
        return
      }

      // Check for tokens in URL hash (implicit flow fallback)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (sessionError) {
          console.error('Session error:', sessionError)
          setError('Reset password link is invalid. Please request a new link.')
          setCheckingAuth(false)
          return
        }

        // Clear hash from URL
        window.history.replaceState({}, '', window.location.pathname + window.location.search)

        setCheckingAuth(false)
        return
      }

      // Check if already has a session (e.g., page refresh after code exchange)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCheckingAuth(false)
        return
      }

      // No session, no code, no tokens - invalid state
      setError('Reset password link is invalid. Please request a new link from the forgot password page.')
      setCheckingAuth(false)
    }
    checkAuth()
  }, [supabase])

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    const validationError = validatePassword(newPassword)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        throw updateError
      }

      setSuccess(true)

      // Redirect to login after short delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#9CB99C] via-[#A8C5A8] to-[#B5D1B5]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#9CB99C] via-[#A8C5A8] to-[#B5D1B5]">
        <div className="w-full max-w-md px-4">
          <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/50 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password updated!</h1>
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show error state with link to forgot password
  if (error && checkingAuth === false && !newPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#9CB99C] via-[#A8C5A8] to-[#B5D1B5]">
        <div className="w-full max-w-md px-4">
          <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/50 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid link</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/forgot-password"
              className="inline-block py-3 px-6 rounded-xl bg-[#2D4B3E] text-white font-semibold hover:bg-[#243D32] transition-all"
            >
              Request new link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#9CB99C] via-[#A8C5A8] to-[#B5D1B5]">
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
        <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>

      {/* Frosted overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px] bg-black/5" />

      {/* Navigation */}
      <nav className="relative z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-black text-white drop-shadow-sm">
            21
          </Link>
        </div>
      </nav>

      {/* Card */}
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div
            className="relative backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.5)'
            }}
          >
            <div className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#2D4B3E]/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-[#2D4B3E]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Reset Password
                </h1>
                <p className="text-gray-600">
                  Enter your new password
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-4 text-sm text-red-700 bg-red-100/80 backdrop-blur rounded-xl border border-red-200">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#2D4B3E]/30 focus:border-[#2D4B3E]/50 transition-all placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#2D4B3E]/30 focus:border-[#2D4B3E]/50 transition-all placeholder:text-gray-400"
                  />
                </div>

                {/* Password requirements */}
                <div className="p-3 bg-gray-50/50 rounded-xl text-xs text-gray-600">
                  <p className="font-medium mb-1">Password requirements:</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>At least 8 characters</li>
                    <li>At least one uppercase letter</li>
                    <li>At least one lowercase letter</li>
                    <li>At least one number</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#2D4B3E] text-white font-semibold hover:bg-[#243D32] focus:outline-none focus:ring-2 focus:ring-[#2D4B3E]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#2D4B3E]/20"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </span>
                  ) : (
                    'Save New Password'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#9CB99C] via-[#A8C5A8] to-[#B5D1B5]" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
