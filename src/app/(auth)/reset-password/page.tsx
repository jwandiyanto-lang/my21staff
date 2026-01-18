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
          setError('Link reset password tidak valid atau sudah kadaluarsa. Silakan minta link baru.')
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
          setError('Link reset password tidak valid. Silakan minta link baru.')
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
      setError('Link reset password tidak valid. Silakan minta link baru dari halaman lupa password.')
      setCheckingAuth(false)
    }
    checkAuth()
  }, [supabase])

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password harus minimal 8 karakter'
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password harus memiliki minimal satu huruf besar'
    }
    if (!/[a-z]/.test(password)) {
      return 'Password harus memiliki minimal satu huruf kecil'
    }
    if (!/[0-9]/.test(password)) {
      return 'Password harus memiliki minimal satu angka'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Password tidak cocok')
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
      setError(err instanceof Error ? err.message : 'Gagal mengubah password')
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password berhasil diubah!</h1>
            <p className="text-gray-600">Mengalihkan ke halaman login...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Link tidak valid</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/forgot-password"
              className="inline-block py-3 px-6 rounded-xl bg-[#2D4B3E] text-white font-semibold hover:bg-[#243D32] transition-all"
            >
              Minta link baru
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
                  Masukkan password baru Anda
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
                    Password Baru
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Masukkan password baru"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#2D4B3E]/30 focus:border-[#2D4B3E]/50 transition-all placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Konfirmasi Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Ulangi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#2D4B3E]/30 focus:border-[#2D4B3E]/50 transition-all placeholder:text-gray-400"
                  />
                </div>

                {/* Password requirements */}
                <div className="p-3 bg-gray-50/50 rounded-xl text-xs text-gray-600">
                  <p className="font-medium mb-1">Syarat password:</p>
                  <ul className="space-y-0.5 list-disc list-inside">
                    <li>Minimal 8 karakter</li>
                    <li>Minimal satu huruf besar</li>
                    <li>Minimal satu huruf kecil</li>
                    <li>Minimal satu angka</li>
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
                      Menyimpan...
                    </span>
                  ) : (
                    'Simpan Password Baru'
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
