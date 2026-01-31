'use client'

import { motion } from 'framer-motion'

const features = [
  {
    icon: 'smart_toy',
    title: 'AI-Powered Automation',
    description: 'Instant responses to customer inquiries 24/7. Your AI handles initial conversations, qualifies leads, and keeps prospects engaged—even while you sleep.',
    stat: '< 1s',
    statLabel: 'Response Time',
  },
  {
    icon: 'psychology',
    title: 'Smart Lead Management',
    description: 'AI analyzes conversations and prioritizes your hottest leads. Focus your energy on the deals that matter most.',
    stat: '89%',
    statLabel: 'Accuracy',
  },
  {
    icon: 'forum',
    title: 'Unified WhatsApp Inbox',
    description: 'All conversations in one clean interface. No app switching, no context loss, no chaos.',
    stat: '100%',
    statLabel: 'Coverage',
  },
  {
    icon: 'notifications_active',
    title: 'Intelligent Follow-ups',
    description: 'AI-powered reminders ensure you never miss opportunities. Smart scheduling keeps your pipeline flowing.',
    stat: '3x',
    statLabel: 'More Conversions',
  },
]

export function FeaturesSection() {
  return (
    <section className="relative bg-white py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1B4332] mb-4 tracking-tight">
              What you&apos;ll love about us
            </h2>
            <p className="text-lg sm:text-xl text-[#37352F] max-w-2xl mx-auto">
              Powerful AI automation that feels effortless
            </p>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-[#FCFCFB] rounded-lg border border-[#37352F14] p-8 hover:border-[#37352F29] transition-all duration-300"
            >
              {/* Left accent border */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#1B4332] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Icon and Stat */}
              <div className="mb-6 flex items-start justify-between">
                {/* Material Symbol Icon */}
                <div className="w-12 h-12 rounded-lg bg-white border border-[#37352F14] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#1B4332] text-[28px]">
                    {feature.icon}
                  </span>
                </div>

                {/* Stat badge */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#1B4332] font-mono">
                    {feature.stat}
                  </div>
                  <div className="text-xs text-[#6B7280] font-mono uppercase tracking-wider">
                    {feature.statLabel}
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl lg:text-2xl font-bold text-[#1B4332] mb-3 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-base text-[#37352F] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
