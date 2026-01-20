'use client'

import { motion } from 'framer-motion'
import { Database, Zap, RefreshCw, BarChart3 } from 'lucide-react'

export function ConsoleSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-24 bg-[#dce8dc]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.15 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#284b31] tracking-[-0.02em]">
            Everything in One Place
          </h2>
          <p className="mt-4 text-lg text-[#2D2A26]/70 max-w-2xl mx-auto tracking-[-0.02em]">
            WhatsApp, CRM database, and analytics — all connected. No switching between tools.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Large card - Workflow Sync */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.15 }}
            className="md:col-span-2 bg-white rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#284b31] rounded-xl flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#284b31] mb-2 tracking-[-0.02em]">
                  WhatsApp + CRM Sync
                </h3>
                <p className="text-[#2D2A26]/70 mb-4 tracking-[-0.02em]">
                  Every WhatsApp message saves to your database automatically. Track leads, notes, and history like HubSpot.
                </p>
              </div>
            </div>
            {/* Visual representation */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {['WhatsApp', 'Database', 'CRM'].map((item, i) => (
                <div key={item} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className="text-xs font-medium text-[#284b31] tracking-[-0.02em]">{item}</div>
                  <div className="mt-1 h-1.5 bg-[#284b31]/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#F7931A]"
                      initial={{ width: 0 }}
                      whileInView={{ width: '100%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 * i }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Small card - Lead Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.15, delay: 0.05 }}
            className="bg-white rounded-2xl p-6 shadow-xl"
          >
            <div className="w-10 h-10 bg-[#284b31] rounded-xl flex items-center justify-center mb-4">
              <Database className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-[#284b31] mb-3 tracking-[-0.02em]">
              Lead Status
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Active', count: 24, color: 'bg-[#22c55e]' },
                { label: 'Pending', count: 12, color: 'bg-[#F7931A]' },
                { label: 'Closed', count: 89, color: 'bg-gray-400' },
              ].map((status) => (
                <div key={status.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                    <span className="text-sm text-[#2D2A26]/70 tracking-[-0.02em]">{status.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#284b31] tracking-[-0.02em]">{status.count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Small card - Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.15, delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-xl"
          >
            <div className="w-10 h-10 bg-[#284b31] rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-[#284b31] mb-3 tracking-[-0.02em]">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {['Broadcast Message', 'Export Leads', 'Generate Report'].map((action) => (
                <div key={action} className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-[#2D2A26]/70 tracking-[-0.02em]">
                  {action}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Large card - Analytics Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.15, delay: 0.15 }}
            className="md:col-span-2 bg-white rounded-2xl p-6 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#284b31] rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-[#284b31] tracking-[-0.02em]">
                Performance at a Glance
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Response Time', value: '1.2s', change: '-0.3s' },
                { label: 'Conversion', value: '82%', change: '+5%' },
                { label: 'Active Chats', value: '47', change: '+12' },
                { label: 'Total Leads', value: '2,841', change: '+156' },
                { label: 'Messages Today', value: '1,293', change: '+89' },
                { label: 'Avg. Deal Size', value: '$420', change: '+$35' },
              ].map((metric) => (
                <div key={metric.label} className="text-center">
                  <div className="text-2xl font-bold text-[#284b31] tracking-[-0.02em]">{metric.value}</div>
                  <div className="text-xs text-[#2D2A26]/50 tracking-[-0.02em]">{metric.label}</div>
                  <div className="text-xs text-[#F7931A] font-medium mt-1 tracking-[-0.02em]">{metric.change}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
