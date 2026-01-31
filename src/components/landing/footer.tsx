'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-[#1B4332] border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div>
            <span className="text-xl font-extrabold">
              <span className="text-white/80">my</span>
              <span className="text-[#F7931A]">21</span>
              <span className="text-white/80">staff</span>
            </span>
            <p className="text-sm text-white/60 mt-4">
              Your AI Sales Team in a Box.
            </p>
          </div>

          {/* Platform Column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#features"
                  className="text-sm text-white/60 hover:text-[#F7931A] transition-colors duration-150"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="text-sm text-white/60 hover:text-[#F7931A] transition-colors duration-150"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="text-sm text-white/60 hover:text-[#F7931A] transition-colors duration-150"
                >
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/security"
                  className="text-sm text-white/60 hover:text-[#F7931A] transition-colors duration-150"
                >
                  Security
                </Link>
              </li>
              <li>
                <a
                  href="https://wa.me/message/WOCD27QOT3UZL1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/60 hover:text-[#F7931A] transition-colors duration-150"
                >
                  Support
                </a>
              </li>
            </ul>
          </div>

          {/* Connect Column */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Connect</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://wa.me/message/WOCD27QOT3UZL1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/60 hover:text-[#F7931A] transition-colors duration-150"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href="mailto:hello@my21staff.com"
                  className="text-sm text-white/60 hover:text-[#F7931A] transition-colors duration-150"
                >
                  Email
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-sm text-white/60 text-center">
            &copy; 2026 my21staff. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
