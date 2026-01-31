'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          {/* Brand column */}
          <div className="col-span-2">
            <div className="mb-6">
              <span className="text-2xl font-extrabold">
                <span className="text-[#2D2A26]">my</span>
                <span className="text-[#F7931A]">21</span>
                <span className="text-[#2D2A26]">staff</span>
              </span>
            </div>
            <p className="text-sm text-[#2D2A26]/60 max-w-xs mb-8 leading-relaxed">
              The all-in-one platform for scaling your business through WhatsApp. Website, CRM, and AI team in one place.
            </p>
            <Link
              href="https://wa.me/message/WMW65Q7UGTDNE1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#F7931A] text-white font-semibold rounded-full hover:bg-[#e08315] transition-all duration-150"
            >
              Chat Now
            </Link>
          </div>

          {/* Platform */}
          <div>
            <h5 className="text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-6">
              Platform
            </h5>
            <ul className="space-y-3 text-sm text-[#2D2A26]/60">
              <li><Link className="hover:text-[#F7931A] transition-colors" href="#features">Features</Link></li>
              <li><Link className="hover:text-[#F7931A] transition-colors" href="#pricing">Pricing</Link></li>
              <li><Link className="hover:text-[#F7931A] transition-colors" href="#integrations">Integrations</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h5 className="text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-6">
              Resources
            </h5>
            <ul className="space-y-3 text-sm text-[#2D2A26]/60">
              <li><Link className="hover:text-[#F7931A] transition-colors" href="#docs">Documentation</Link></li>
              <li><Link className="hover:text-[#F7931A] transition-colors" href="#help">Help Center</Link></li>
              <li><Link className="hover:text-[#F7931A] transition-colors" href="#support">Support</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h5 className="text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-6">
              Connect
            </h5>
            <ul className="space-y-3 text-sm text-[#2D2A26]/60">
              <li><Link className="hover:text-[#F7931A] transition-colors" href="/security">Security</Link></li>
              <li><Link className="hover:text-[#F7931A] transition-colors" href="#terms">Terms</Link></li>
              <li><Link className="hover:text-[#F7931A] transition-colors" href="#privacy">Privacy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[#2D2A26]/50">
          <p>&copy; 2026 my21staff. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link className="hover:text-[#F7931A] transition-colors" href="#twitter">Twitter</Link>
            <Link className="hover:text-[#F7931A] transition-colors" href="#linkedin">LinkedIn</Link>
            <Link className="hover:text-[#F7931A] transition-colors" href="#instagram">Instagram</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
