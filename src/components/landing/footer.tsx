'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#37352F14]">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#37352F]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#1B4332] flex items-center justify-center text-white text-xs font-bold">
              M
            </div>
            <span className="font-bold text-[#1B4332]">my21staff</span>
          </div>

          <span className="text-[#37352F]/60">&copy; 2026</span>

          <Link
            href="/security"
            className="text-[#37352F]/60 hover:text-[#F7931A] transition-colors"
          >
            Security
          </Link>
        </div>
      </div>
    </footer>
  )
}
