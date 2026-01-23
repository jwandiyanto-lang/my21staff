import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background - same as sign-in */}
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
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-[#2D4B3E]/10 rounded-full blur-2xl" />
      </div>

      <div className="absolute inset-0 backdrop-blur-[2px] bg-black/5" />

      <nav className="relative z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-white drop-shadow-sm">
            21
          </Link>
        </div>
      </nav>

      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/50',
              headerTitle: 'text-3xl font-bold text-gray-900',
              headerSubtitle: 'text-gray-600',
              socialButtonsBlockButton: 'bg-white/50 border-gray-200/50 hover:bg-white/70',
              formButtonPrimary: 'bg-[#2D4B3E] hover:bg-[#243D32] shadow-lg shadow-[#2D4B3E]/20',
              formFieldInput: 'bg-white/50 border-gray-200/50 focus:ring-[#2D4B3E]/30 focus:border-[#2D4B3E]/50 rounded-xl',
              footerActionLink: 'text-[#2D4B3E] font-semibold hover:underline',
            },
          }}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
