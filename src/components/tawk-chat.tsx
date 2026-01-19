'use client'

import { useEffect } from 'react'

interface TawkChatProps {
  userEmail?: string
  userName?: string
}

export function TawkChat({ userEmail, userName }: TawkChatProps) {
  const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID
  const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID

  useEffect(() => {
    // Don't render if not configured
    if (!propertyId || !widgetId) {
      return
    }

    // Don't inject twice
    if (document.getElementById('tawk-script')) {
      return
    }

    // Set up Tawk.to API before loading script
    window.Tawk_API = window.Tawk_API || {}
    window.Tawk_LoadStart = new Date()

    // Set visitor attributes if available
    if (userEmail || userName) {
      window.Tawk_API.onLoad = () => {
        if (window.Tawk_API?.setAttributes) {
          window.Tawk_API.setAttributes(
            {
              name: userName || '',
              email: userEmail || '',
            },
            (error) => {
              if (error) {
                console.error('Tawk.to setAttributes error:', error)
              }
            }
          )
        }
      }
    }

    // Inject Tawk.to script
    const script = document.createElement('script')
    script.id = 'tawk-script'
    script.async = true
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`
    script.charset = 'UTF-8'
    script.setAttribute('crossorigin', '*')
    document.body.appendChild(script)

    return () => {
      // Cleanup on unmount
      const existingScript = document.getElementById('tawk-script')
      if (existingScript) {
        existingScript.remove()
      }
      // Clean up Tawk.to iframe
      const tawkIframe = document.querySelector('iframe[title="chat widget"]')
      if (tawkIframe) {
        tawkIframe.remove()
      }
      const tawkContainer = document.getElementById('tawk-container')
      if (tawkContainer) {
        tawkContainer.remove()
      }
    }
  }, [propertyId, widgetId, userEmail, userName])

  // Render nothing - Tawk.to injects its own widget
  return null
}

// TypeScript declaration for Tawk_API
declare global {
  interface Window {
    Tawk_API?: {
      onLoad?: () => void
      setAttributes?: (
        attributes: { name?: string; email?: string },
        callback?: (error: Error | null) => void
      ) => void
      hideWidget?: () => void
      showWidget?: () => void
      maximize?: () => void
      minimize?: () => void
    }
    Tawk_LoadStart?: Date
  }
}
