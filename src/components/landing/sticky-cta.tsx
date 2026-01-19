'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { WHATSAPP_LINK } from '@/lib/landing-constants'

export function StickyCTA() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 md:hidden z-50">
      <Link
        href={WHATSAPP_LINK}
        target="_blank"
        rel="noopener"
        className="flex items-center justify-center gap-2 w-full py-4 bg-landing-cta text-white font-bold rounded-full"
      >
        <MessageCircle className="w-5 h-5" />
        Chat on WhatsApp
      </Link>
    </div>
  )
}
