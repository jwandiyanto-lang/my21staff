'use client'

import { motion } from 'framer-motion'
import { Bot, Brain, MessageSquare, Bell } from 'lucide-react'

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Conversations',
    description: 'Sarah bot handles initial lead chats automatically, qualifying prospects 24/7 while you sleep.',
    stat: '< 1s',
    statLabel: 'Response Time',
    gradient: 'from-green-400 to-green-600',
  },
  {
    icon: Brain,
    title: 'Smart Lead Scoring',
    description: 'Grok analyzes conversations and prioritizes hot leads, so you focus on deals that matter.',
    stat: '89%',
    statLabel: 'Accuracy',
    gradient: 'from-orange-400 to-orange-600',
  },
  {
    icon: MessageSquare,
    title: 'WhatsApp Integration',
    description: 'All customer conversations in one unified inbox. No app switching, no context loss.',
    stat: '100%',
    statLabel: 'Coverage',
    gradient: 'from-blue-400 to-blue-600',
  },
  {
    icon: Bell,
    title: 'Automated Follow-ups',
    description: 'Never miss a lead with AI-powered reminders and intelligent follow-up scheduling.',
    stat: '3x',
    statLabel: 'More Conversions',
    gradient: 'from-purple-400 to-purple-600',
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
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1B4332] mb-4 tracking-tight">
              Built for Scale
            </h2>
            <p className="text-lg sm:text-xl text-[#37352F] max-w-2xl mx-auto font-sans">
              Your AI Sales Team in a Box. Automation that actually works.
            </p>
          </motion.div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-white rounded-2xl border border-[rgba(55,53,47,0.12)] p-8 hover:border-[rgba(27,67,50,0.3)] transition-all duration-300 shadow-sm hover:shadow-xl"
            >
              {/* Icon with gradient background */}
              <div className="mb-6 flex items-start justify-between">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                  <feature.icon className="w-7 h-7 text-white" strokeWidth={2} />
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
              <h3 className="text-xl lg:text-2xl font-bold text-[#1B4332] mb-3 font-sans tracking-tight">
                {feature.title}
              </h3>
              <p className="text-base text-[#37352F] leading-relaxed font-sans">
                {feature.description}
              </p>

              {/* Hover effect - subtle glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1B4332]/5 to-[#F7931A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-[#FCFCFB] px-6 py-3 rounded-full border border-[rgba(55,53,47,0.08)]">
            <div className="w-2 h-2 bg-[#F7931A] rounded-full animate-pulse" />
            <span className="text-sm font-mono text-[#37352F] uppercase tracking-wider">
              Ready to deploy in 5 minutes
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
