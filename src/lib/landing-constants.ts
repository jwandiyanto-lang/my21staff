/**
 * Landing page constants
 * Shared data for landing page components
 */

// WhatsApp click-to-chat configuration
export const WHATSAPP_NUMBER = '6281234567890'  // Replace with actual my21staff number
export const WHATSAPP_MESSAGE = encodeURIComponent("Hi, I'd like to learn more about my21staff")
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

/**
 * Feature data structure for landing page features grid
 */
export interface Feature {
  icon: string  // Lucide icon name
  title: string
  description: string
}

/**
 * Features array for the landing page features grid
 * Based on existing landing page value propositions
 */
export const FEATURES: Feature[] = [
  {
    icon: 'MessageSquare',
    title: 'WhatsApp Automation',
    description: '24/7 response, auto follow-up, lead scoring. Your digital team works while you sleep.',
  },
  {
    icon: 'Users',
    title: 'Lead Management',
    description: 'Track every conversation, never miss a hot lead. All your prospects in one place.',
  },
  {
    icon: 'BarChart3',
    title: 'Data-Driven Insights',
    description: 'Weekly reports, conversion tracking, clear metrics. Know what works.',
  },
  {
    icon: 'Settings',
    title: 'Your CRM, Your Way',
    description: 'Grows with your business, built around your process. Not another overwhelming CRM.',
  },
]
