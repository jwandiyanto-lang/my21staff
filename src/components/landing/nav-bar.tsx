'use client'

import Link from 'next/link'

export function NavBar() {
  return (
    <nav className="absolute top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-xl font-extrabold tracking-[-0.02em]">
            <span className="text-[#2D2A26]">my</span>
            <span className="text-[#F7931A]">21</span>
            <span className="text-[#2D2A26]">staff</span>
          </span>
        </Link>

        {/* Login link */}
        <Link
          href="/sign-in"
          className="text-sm text-[#2D2A26] hover:text-[#F7931A] transition-all duration-150 font-medium tracking-[-0.02em]"
        >
          Login
        </Link>
      </div>
    </nav>
  )
}
