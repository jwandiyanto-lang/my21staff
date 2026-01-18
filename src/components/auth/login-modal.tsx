'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
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

    onOpenChange(false)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0 border-0 overflow-hidden bg-transparent"
        style={{ boxShadow: 'none' }}
      >
        {/* Glass card */}
        <div
          className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
          style={{
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.5)'
          }}
        >
          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <DialogTitle className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Sign in to your my21staff account
              </DialogDescription>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="p-4 text-sm text-red-700 bg-red-100/80 backdrop-blur rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="modal-email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="modal-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/50 border border-gray-200/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#2D4B3E]/30 focus:border-[#2D4B3E]/50 transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="modal-password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="modal-password"
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

              <div className="text-center pt-2">
                <Link
                  href="/forgot-password"
                  className="text-sm text-[#2D4B3E] hover:underline"
                  onClick={() => onOpenChange(false)}
                >
                  Forgot password?
                </Link>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
