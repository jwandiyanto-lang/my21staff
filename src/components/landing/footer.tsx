'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center justify-center gap-4 text-sm text-[#2D2A26]/60">
          <span className="text-xl font-extrabold tracking-[-0.02em]">
            <span className="text-[#2D2A26]">my</span>
            <span className="text-[#F7931A]">21</span>
            <span className="text-[#2D2A26]">staff</span>
          </span>
          <span className="text-[#2D2A26]/30">|</span>
          <span>&copy; 2026</span>
          <span className="text-[#2D2A26]/30">|</span>
          <Link
            href="/security"
            className="hover:text-[#F7931A] transition-colors"
          >
            Security
          </Link>
        </div>
      </div>
    </footer>
  )
}
