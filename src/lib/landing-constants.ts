/**
 * Landing page constants
 * Brand-aligned content for my21staff landing page
 */

// Brand colors
export const BRAND_COLORS = {
  text: '#2D2A26',      // Dark brown - for "my" and "staff"
  orange: '#F7931A',    // Bitcoin orange - for "21"
  green: '#284b31',     // Dark green - primary accent
} as const

// WhatsApp click-to-chat configuration
export const WHATSAPP_NUMBER = '6281234567890'
export const WHATSAPP_MESSAGE = encodeURIComponent("Hi, I'd like to learn more about my21staff")
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`

// Navigation links
export const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '/pricing' },
] as const

/**
 * Hero section content
 */
export const HERO_CONTENT = {
  tagline: 'No system, no growth.',
  headline: 'Sales on Autopilot.',
  subheadline: 'Connect WhatsApp to let your digital staff handle the heavy lifting. Manage leads, automate chats, and scale without the chaos.',
  cta: 'Deploy Your Staff',
} as const

/**
 * Stats data for landing page metrics
 */
export interface Stat {
  label: string
  value: string
  change?: string
  suffix?: string
}

export const STATS: Stat[] = [
  {
    label: 'Active Leads',
    value: '14,282',
    change: '+12%',
  },
  {
    label: 'Response Time',
    value: '1.2',
    suffix: 's',
  },
  {
    label: 'Conversion Rate',
    value: '82',
    suffix: '%',
  },
]

/**
 * How it works / Value props
 */
export const VALUE_PROPS = [
  {
    title: 'AI Staff',
    description: '8 specialists execute routine tasks 24/7 — follow-ups, reminders, reports.',
    icon: 'Bot',
  },
  {
    title: 'Human Team',
    description: 'Real people handle complex decisions, strategy, and troubleshooting.',
    icon: 'Users',
  },
  {
    title: 'Database CRM',
    description: 'All leads organized with status tracking. Nothing falls through the cracks.',
    icon: 'Database',
  },
  {
    title: 'Website Manager',
    description: 'Landing pages that capture more leads and convert visitors.',
    icon: 'Globe',
  },
] as const

/**
 * Problems we solve
 */
export const PROBLEMS = [
  {
    title: 'WhatsApp Overwhelm',
    description: 'Too many chats, not enough time. Reply to one, five more come in.',
    solution: 'AI bot replies 24/7. Lead scoring in CRM. You only handle serious inquiries.',
  },
  {
    title: 'Leads Going Cold',
    description: 'You reply once, then forget to follow up. They buy elsewhere.',
    solution: 'Auto follow-up at the right time. Tasks appear in CRM. Nothing gets missed.',
  },
  {
    title: 'Stuck in Operations',
    description: 'Busy with daily tasks, no time to think about growth or strategy.',
    solution: 'AI handles routine tasks. You get time for planning and relationships.',
  },
  {
    title: 'Cannot Take a Break',
    description: 'Want time off? You cannot. Business stops when you stop.',
    solution: 'AI runs 24/7. All activity tracked. You get notified for important things only.',
  },
] as const

/**
 * Feature cards for the features section
 */
export const FEATURE_CARDS = [
  {
    title: 'Capture Every Lead',
    description: 'Instant WhatsApp responses and smart follow-up sequences that convert inquiries into customers.',
    image: '/landing/feature-office.jpg',
  },
  {
    title: 'Scale Without Hiring',
    description: 'Handle 10x more customers without adding headcount. Your AI team works 24/7, never takes breaks.',
    image: '/landing/feature-warehouse.jpg',
  },
] as const

/**
 * CTA text constants
 */
export const CTA_TEXT = {
  primary: 'Deploy Your Staff',
  secondary: 'See Pricing',
  pricing: '/pricing',
} as const

/**
 * Digital Workforce - AI Specialists
 */
export const AI_SPECIALISTS = [
  {
    title: 'Lead Intake Specialist',
    description: 'Automatically captures data from WhatsApp and populates your CRM database.',
    icon: 'UserPlus',
  },
  {
    title: '24/7 Support Agent',
    description: 'Handles FAQs and customer service instantly via AI-powered chat.',
    icon: 'Headphones',
  },
  {
    title: 'Content Planner',
    description: 'Strategizes your brand messaging while you focus on high-level growth.',
    icon: 'PenTool',
  },
] as const
