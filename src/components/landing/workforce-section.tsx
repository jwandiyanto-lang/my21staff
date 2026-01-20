'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Headphones, CalendarCheck, BarChart2, Mail, Target, MessageCircle, Clock, LucideIcon } from 'lucide-react'

interface Agent {
  id: string
  title: string
  icon: LucideIcon
  status: string
  activities: string[]
}

const AI_AGENTS: Agent[] = [
  {
    id: 'intake',
    title: 'Intake Specialist',
    icon: UserPlus,
    status: 'Processing lead data',
    activities: [
      'Lead #821 captured from WhatsApp',
      'Parsing contact: +62 812 **** 4521',
      'Syncing to Database... Done',
      'Auto-tagging: "High Intent"',
    ],
  },
  {
    id: 'support',
    title: '24/7 Support Agent',
    icon: Headphones,
    status: 'Handling customer query',
    activities: [
      'New message from Chat #1204',
      'Intent detected: Product inquiry',
      'Generating response...',
      'Reply sent in 1.2s',
    ],
  },
  {
    id: 'followup',
    title: 'Follow-Up Manager',
    icon: CalendarCheck,
    status: 'Running sequence',
    activities: [
      'Checking dormant leads...',
      'Found 12 leads > 48hrs inactive',
      'Scheduling follow-up messages',
      'Sequence triggered for Lead #445',
    ],
  },
  {
    id: 'qualifier',
    title: 'Lead Qualifier',
    icon: Target,
    status: 'Scoring prospects',
    activities: [
      'Analyzing Lead #892 behavior',
      'Engagement score: 87/100',
      'Marking as "Hot Prospect"',
      'Notifying sales team...',
    ],
  },
  {
    id: 'router',
    title: 'Chat Router',
    icon: MessageCircle,
    status: 'Directing conversations',
    activities: [
      'New chat from @BudiStore',
      'Topic: Pricing question',
      'Routing to Sales channel',
      'Handoff complete',
    ],
  },
  {
    id: 'broadcast',
    title: 'Broadcast Coordinator',
    icon: Mail,
    status: 'Sending campaign',
    activities: [
      'Campaign: Weekend Promo',
      'Segment: Active customers',
      'Sending to 2,841 contacts...',
      'Delivered: 2,839 (99.9%)',
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics Reporter',
    icon: BarChart2,
    status: 'Compiling insights',
    activities: [
      'Aggregating daily metrics...',
      'Conversion rate: +5.2%',
      'Top source: WhatsApp Ads',
      'Report ready for review',
    ],
  },
  {
    id: 'scheduler',
    title: 'Appointment Setter',
    icon: Clock,
    status: 'Booking meetings',
    activities: [
      'Request: Demo booking',
      'Checking calendar availability',
      'Slot found: Tomorrow 2PM',
      'Confirmation sent to lead',
    ],
  },
]

interface LogEntry {
  id: number
  text: string
  agentId: string
  timestamp: string
}

export function WorkforceSection() {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0)
  const [logEntries, setLogEntries] = useState<LogEntry[]>([])
  const [activityIndex, setActivityIndex] = useState(0)

  const currentAgent = AI_AGENTS[currentAgentIndex]

  // Cycle through agents and their activities
  useEffect(() => {
    const interval = setInterval(() => {
      setActivityIndex((prev) => {
        const nextActivity = prev + 1
        if (nextActivity >= currentAgent.activities.length) {
          // Move to next agent
          setCurrentAgentIndex((agentIdx) => (agentIdx + 1) % AI_AGENTS.length)
          return 0
        }
        return nextActivity
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [currentAgent.activities.length])

  // Add log entries
  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    const newEntry: LogEntry = {
      id: Date.now(),
      text: currentAgent.activities[activityIndex],
      agentId: currentAgent.id,
      timestamp,
    }

    setLogEntries((prev) => [newEntry, ...prev].slice(0, 12))
  }, [activityIndex, currentAgentIndex])

  return (
    <section className="py-20 lg:py-24 bg-white overflow-hidden">
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
            Your Digital Workforce
          </h2>
          <p className="mt-4 text-lg text-[#2D2A26]/70 max-w-2xl mx-auto tracking-[-0.02em]">
            A full team working 24/7. Watch them in action.
          </p>
        </motion.div>

        {/* Live Activity Feed + Staff Card */}
        <div className="grid lg:grid-cols-2 gap-8 items-start">

          {/* Terminal-style Live Feed */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.15 }}
            className="bg-[#14261a] rounded-2xl p-6 font-mono text-sm h-[400px] overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-2 text-white/40 text-xs">live_activity.log</span>
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {logEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{
                      opacity: index === 0 ? 1 : Math.max(0.15, 1 - index * 0.12),
                      y: 0
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex gap-3"
                  >
                    <span className="text-white/30 flex-shrink-0">{entry.timestamp}</span>
                    <span className={`${index === 0 ? 'text-[#F7931A]' : 'text-white/50'}`}>
                      {entry.text}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Blinking cursor */}
              <div className="flex items-center gap-1 mt-4">
                <span className="text-[#F7931A]">{'>'}</span>
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="w-2 h-4 bg-[#F7931A]"
                />
              </div>
            </div>
          </motion.div>

          {/* Staff Identity Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Active Agent Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentAgent.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="bg-[#f1f5f0] rounded-2xl p-8"
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2 h-2 rounded-full bg-[#F7931A] animate-pulse" />
                  <span className="text-xs font-medium text-[#F7931A] uppercase tracking-wider">
                    Currently Active
                  </span>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 bg-[#284b31] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <currentAgent.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#284b31] tracking-[-0.02em]">
                      {currentAgent.title}
                    </h3>
                    <p className="text-[#2D2A26]/60 mt-1 tracking-[-0.02em]">
                      {currentAgent.status}
                    </p>
                  </div>
                </div>

                {/* Activity progress */}
                <div className="mt-6 pt-6 border-t border-[#284b31]/10">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[#2D2A26]/50 tracking-[-0.02em]">Task progress</span>
                    <span className="text-[#284b31] font-semibold tracking-[-0.02em]">
                      {activityIndex + 1}/{currentAgent.activities.length}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#284b31]/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#F7931A]"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((activityIndex + 1) / currentAgent.activities.length) * 100}%`
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Agent Grid Preview */}
            <div className="grid grid-cols-4 gap-2">
              {AI_AGENTS.map((agent, index) => (
                <motion.div
                  key={agent.id}
                  className={`p-3 rounded-xl transition-all duration-150 ${
                    index === currentAgentIndex
                      ? 'bg-[#F7931A] text-white'
                      : 'bg-gray-100 text-[#2D2A26]/40'
                  }`}
                >
                  <agent.icon className="w-5 h-5 mx-auto" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
