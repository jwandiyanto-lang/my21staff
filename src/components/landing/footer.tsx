'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex items-center justify-center gap-4 text-sm text-[#2D2A26]/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#1B4332] flex items-center justify-center text-white text-xs font-bold">
              M
            </div>
            <span className="font-bold text-[#2D2A26]">my21staff</span>
          </div>
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
