'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#2D2A26]/60">
          {/* Left: Brand */}
          <div>
            <span className="text-lg font-extrabold">
              <span className="text-[#2D2A26]">my</span>
              <span className="text-[#F7931A]">21</span>
              <span className="text-[#2D2A26]">staff</span>
            </span>
          </div>

          {/* Center: Copyright */}
          <div>
            <p>&copy; 2026</p>
          </div>

          {/* Right: Security link */}
          <div>
            <Link
              className="hover:text-[#F7931A] transition-colors"
              href="/security"
            >
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
