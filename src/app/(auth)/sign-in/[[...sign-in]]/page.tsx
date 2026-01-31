import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export default function SignInPage() {
  // Dev mode: skip sign-in, go directly to demo dashboard
  if (isDevMode) {
    redirect('/demo')
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - matches landing page */}
      <nav className="px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-[-0.02em]">
            <span className="text-[#2D2A26]">my</span>
            <span className="text-[#F7931A]">21</span>
            <span className="text-[#2D2A26]">staff</span>
          </Link>
        </div>
      </nav>

      {/* Clerk SignIn */}
      <div className="min-h-[calc(100vh-88px)] flex items-center justify-center px-4">
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-white rounded-2xl shadow-xl border border-gray-100',
              headerTitle: 'text-2xl font-bold text-gray-900',
              headerSubtitle: 'text-gray-500',
              socialButtonsBlockButton: 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700',
              formButtonPrimary: 'bg-[#284b31] hover:bg-[#243D32]',
              formFieldInput: 'bg-white border-gray-200 focus:ring-[#284b31]/20 focus:border-[#284b31] rounded-lg',
              footerActionLink: 'text-[#284b31] font-medium hover:underline',
              dividerLine: 'bg-gray-200',
              dividerText: 'text-gray-400',
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/demo"
        />
      </div>
    </div>
  )
}
