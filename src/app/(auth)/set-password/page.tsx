'use client'

import { useState, Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

function SetPasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const hasSubmitted = useRef(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationToken = searchParams.get('invitation')

  // Check if already completed (persisted in sessionStorage)
  useEffect(() => {
    const completed = sessionStorage.getItem(`invitation_${invitationToken}`)
    if (completed) {
      setSuccess(true)
      setRedirecting(true)
      const data = JSON.parse(completed)
      router.replace(data.workspaceSlug ? `/${data.workspaceSlug}` : '/dashboard')
    }
  }, [invitationToken, router])

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
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

    // Prevent double submission
    if (loading || success || hasSubmitted.current) {
      return
    }

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

    if (!invitationToken) {
      setError('Invalid invitation link. Please request a new invitation.')
      return
    }

    // Mark as submitted immediately
    hasSubmitted.current = true
    setLoading(true)

    try {
      // Call our API to set password (doesn't require Supabase auth)
      const response = await fetch('/api/invitations/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationToken,
          password: newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        hasSubmitted.current = false
        throw new Error(data.error || 'Failed to set password')
      }

      // Persist success state to prevent re-showing form on re-render
      sessionStorage.setItem(`invitation_${invitationToken}`, JSON.stringify({
        email: data.email,
        workspaceSlug: data.workspaceSlug,
      }))

      setSuccess(true)
      setRedirecting(true)

      // Redirect to landing page for manual login (cleaner user flow)
      router.replace('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set password')
      setLoading(false)
    }
  }

  // No invitation token - show error
  if (!invitationToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#9CB99C] via-[#A8C5A8] to-[#B5D1B5]">
        <div className="w-full max-w-md px-4">
          <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/50 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
            <p className="text-gray-600 mb-6">
              This invitation link is invalid or has expired. Please request a new invitation from your team admin.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 rounded-xl bg-[#2D4B3E] text-white font-semibold hover:bg-[#243D32] transition-all"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (success || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#9CB99C] via-[#A8C5A8] to-[#B5D1B5]">
        <div className="w-full max-w-md px-4">
          <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/50 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Account created!</h1>
            <p className="text-gray-600 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to login...
            </p>
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
          <span className="text-2xl font-black text-white drop-shadow-sm">21</span>
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
                <div className="w-16 h-16 rounded-full bg-[#F7931A]/10 flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-[#F7931A]" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome to my21staff!
                </h1>
                <p className="text-gray-600">
                  Set your password to complete your account setup
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
                    Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Create a password"
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
                    placeholder="Confirm your password"
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
                    <li>At least 8 characters long</li>
                    <li>At least one uppercase letter</li>
                    <li>At least one lowercase letter</li>
                    <li>At least one number</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#F7931A] text-white font-semibold hover:bg-[#E8850F] focus:outline-none focus:ring-2 focus:ring-[#F7931A]/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#F7931A]/20"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Setting password...
                    </span>
                  ) : (
                    'Set Password & Join Team'
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

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#9CB99C] via-[#A8C5A8] to-[#B5D1B5]" />}>
      <SetPasswordForm />
    </Suspense>
  )
}
