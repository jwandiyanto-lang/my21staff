'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface StaffMember {
  name: string
  role: string
  department: string
  description: string
  color: string
  avatar: 'male1' | 'male2' | 'female1' | 'female2' | 'male3' | 'male4' | 'female3' | 'female4'
}

const staffMembers: StaffMember[] = [
  // Akuntansi
  {
    name: 'Budi',
    role: 'Pembukuan',
    department: 'Akuntansi',
    description: 'Catat, kategorikan, dan rekonsiliasi semua transaksi',
    color: '#E85D4C', // Red/Coral
    avatar: 'male1',
  },
  {
    name: 'Sari',
    role: 'Laporan Keuangan',
    department: 'Akuntansi',
    description: 'Buat laporan rugi-laba, arus kas, dan bulanan',
    color: '#E85D4C',
    avatar: 'female1',
  },
  // Marketing
  {
    name: 'Rian',
    role: 'Content Marketing',
    department: 'Marketing',
    description: 'Rencanakan, buat, dan lacak performa konten',
    color: '#3B82F6', // Blue
    avatar: 'male2',
  },
  {
    name: 'Maya',
    role: 'Ads Manager',
    department: 'Marketing',
    description: 'Setup, optimasi, dan laporan iklan Meta/Google',
    color: '#3B82F6',
    avatar: 'female2',
  },
  // Customer Success
  {
    name: 'Dewi',
    role: 'Customer Support',
    department: 'Pelayanan',
    description: 'Tangani pertanyaan, komplain, dan feedback',
    color: '#10B981', // Green
    avatar: 'female3',
  },
  {
    name: 'Adi',
    role: 'Sales Follow-up',
    department: 'Pelayanan',
    description: 'Nurture leads, kirim pengingat, tutup penjualan',
    color: '#10B981',
    avatar: 'male3',
  },
  // Tech Support
  {
    name: 'Fajar',
    role: 'Bantuan Produk',
    department: 'Teknis',
    description: 'Pandu pengguna gunakan fitur my21staff',
    color: '#1F2937', // Dark
    avatar: 'male4',
  },
  {
    name: 'Putri',
    role: 'Integrasi',
    department: 'Teknis',
    description: 'Hubungkan WhatsApp, CRM, dan tools lainnya',
    color: '#1F2937',
    avatar: 'female4',
  },
]

// Notion-style avatar SVGs (black and white)
function NotionAvatar({ type }: { type: StaffMember['avatar'] }) {
  const avatars = {
    male1: ( // Clean-shaven professional
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
        {/* Hair */}
        <path d="M25 35 Q25 15 50 15 Q75 15 75 35 L75 40 Q65 35 50 35 Q35 35 25 40 Z" fill="black"/>
        {/* Face outline */}
        <ellipse cx="50" cy="55" rx="22" ry="26" fill="white" stroke="black" strokeWidth="2.5"/>
        {/* Eyes */}
        <ellipse cx="42" cy="50" rx="3" ry="2" fill="black"/>
        <ellipse cx="58" cy="50" rx="3" ry="2" fill="black"/>
        {/* Eyebrows */}
        <path d="M37 45 Q42 43 47 45" stroke="black" strokeWidth="2" fill="none"/>
        <path d="M53 45 Q58 43 63 45" stroke="black" strokeWidth="2" fill="none"/>
        {/* Nose */}
        <path d="M50 52 L50 58 Q48 60 50 60 Q52 60 50 58" stroke="black" strokeWidth="1.5" fill="none"/>
        {/* Smile */}
        <path d="M43 66 Q50 72 57 66" stroke="black" strokeWidth="2" fill="none"/>
        {/* Collar */}
        <path d="M35 82 L45 75 L50 80 L55 75 L65 82" stroke="black" strokeWidth="2" fill="none"/>
      </svg>
    ),
    male2: ( // With beard and headband
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
        {/* Hair */}
        <path d="M22 40 Q22 12 50 12 Q78 12 78 40 L78 35 Q50 30 22 35 Z" fill="black"/>
        {/* Headband */}
        <path d="M22 35 Q50 30 78 35" stroke="black" strokeWidth="4" fill="none"/>
        {/* Face outline */}
        <ellipse cx="50" cy="55" rx="24" ry="28" fill="white" stroke="black" strokeWidth="2.5"/>
        {/* Beard */}
        <path d="M30 60 Q30 85 50 88 Q70 85 70 60 Q70 70 50 75 Q30 70 30 60" fill="black"/>
        {/* Eyes */}
        <ellipse cx="40" cy="48" rx="3" ry="2" fill="black"/>
        <ellipse cx="60" cy="48" rx="3" ry="2" fill="black"/>
        {/* Eyebrows */}
        <path d="M35 43 Q40 40 45 43" stroke="black" strokeWidth="2.5" fill="none"/>
        <path d="M55 43 Q60 40 65 43" stroke="black" strokeWidth="2.5" fill="none"/>
        {/* Nose */}
        <path d="M50 50 L50 56" stroke="black" strokeWidth="2" fill="none"/>
        {/* Mustache */}
        <path d="M42 62 Q50 65 58 62" stroke="black" strokeWidth="2" fill="none"/>
      </svg>
    ),
    male3: ( // Styled hair, friendly
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
        {/* Styled hair */}
        <path d="M28 42 Q20 20 50 15 Q80 20 72 42 Q70 30 50 28 Q30 30 28 42" fill="black"/>
        {/* Face outline */}
        <ellipse cx="50" cy="55" rx="22" ry="26" fill="white" stroke="black" strokeWidth="2.5"/>
        {/* Eyes */}
        <ellipse cx="42" cy="50" rx="3" ry="2.5" fill="black"/>
        <ellipse cx="58" cy="50" rx="3" ry="2.5" fill="black"/>
        {/* Eyebrows */}
        <path d="M36 44 Q42 42 48 45" stroke="black" strokeWidth="2" fill="none"/>
        <path d="M52 45 Q58 42 64 44" stroke="black" strokeWidth="2" fill="none"/>
        {/* Nose */}
        <path d="M50 52 L50 58 Q48 60 50 60" stroke="black" strokeWidth="1.5" fill="none"/>
        {/* Big smile */}
        <path d="M40 65 Q50 74 60 65" stroke="black" strokeWidth="2" fill="none"/>
        {/* Shirt */}
        <path d="M30 85 Q40 78 50 82 Q60 78 70 85" fill="black"/>
      </svg>
    ),
    male4: ( // Formal with suit
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
        {/* Hair - slicked back */}
        <path d="M28 38 Q25 15 50 12 Q75 15 72 38 Q70 25 50 22 Q30 25 28 38" fill="black"/>
        {/* Face outline */}
        <ellipse cx="50" cy="52" rx="20" ry="24" fill="white" stroke="black" strokeWidth="2.5"/>
        {/* Eyes */}
        <ellipse cx="43" cy="48" rx="2.5" ry="2" fill="black"/>
        <ellipse cx="57" cy="48" rx="2.5" ry="2" fill="black"/>
        {/* Eyebrows */}
        <path d="M38 43 Q43 41 48 44" stroke="black" strokeWidth="2" fill="none"/>
        <path d="M52 44 Q57 41 62 43" stroke="black" strokeWidth="2" fill="none"/>
        {/* Nose */}
        <path d="M50 50 L50 56" stroke="black" strokeWidth="1.5" fill="none"/>
        {/* Neutral expression */}
        <path d="M44 64 L56 64" stroke="black" strokeWidth="2" fill="none"/>
        {/* Suit jacket */}
        <path d="M25 95 L35 78 L50 85 L65 78 L75 95" fill="black"/>
        {/* Tie */}
        <path d="M47 78 L50 95 L53 78 Z" fill="white" stroke="black" strokeWidth="1"/>
        {/* Collar */}
        <path d="M40 78 L50 72 L60 78" stroke="black" strokeWidth="2" fill="none"/>
      </svg>
    ),
    female1: ( // Professional woman
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
        {/* Long hair */}
        <path d="M20 45 Q15 15 50 10 Q85 15 80 45 L80 75 Q75 85 70 80 L70 50 Q70 35 50 30 Q30 35 30 50 L30 80 Q25 85 20 75 Z" fill="black"/>
        {/* Face outline */}
        <ellipse cx="50" cy="52" rx="20" ry="24" fill="white" stroke="black" strokeWidth="2.5"/>
        {/* Eyes with lashes */}
        <ellipse cx="43" cy="48" rx="3" ry="2.5" fill="black"/>
        <ellipse cx="57" cy="48" rx="3" ry="2.5" fill="black"/>
        <path d="M39 46 L43 44 L47 46" stroke="black" strokeWidth="1" fill="none"/>
        <path d="M53 46 L57 44 L61 46" stroke="black" strokeWidth="1" fill="none"/>
        {/* Eyebrows */}
        <path d="M38 42 Q43 40 48 42" stroke="black" strokeWidth="1.5" fill="none"/>
        <path d="M52 42 Q57 40 62 42" stroke="black" strokeWidth="1.5" fill="none"/>
        {/* Nose */}
        <path d="M50 50 L50 56 Q48 57 50 57" stroke="black" strokeWidth="1.5" fill="none"/>
        {/* Smile */}
        <path d="M44 64 Q50 70 56 64" stroke="black" strokeWidth="2" fill="none"/>
      </svg>
    ),
    female2: ( // Short hair modern
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
        {/* Short styled hair */}
        <path d="M25 45 Q20 15 50 12 Q80 15 75 45 Q72 30 50 25 Q28 30 25 45" fill="black"/>
        <path d="M25 45 Q22 50 25 55 L30 45 Z" fill="black"/>
        {/* Face outline */}
        <ellipse cx="50" cy="55" rx="21" ry="25" fill="white" stroke="black" strokeWidth="2.5"/>
        {/* Eyes */}
        <ellipse cx="42" cy="52" rx="3" ry="2.5" fill="black"/>
        <ellipse cx="58" cy="52" rx="3" ry="2.5" fill="black"/>
        {/* Eyebrows */}
        <path d="M37 47 Q42 45 47 47" stroke="black" strokeWidth="1.5" fill="none"/>
        <path d="M53 47 Q58 45 63 47" stroke="black" strokeWidth="1.5" fill="none"/>
        {/* Nose */}
        <path d="M50 54 L50 60" stroke="black" strokeWidth="1.5" fill="none"/>
        {/* Smile */}
        <path d="M43 68 Q50 73 57 68" stroke="black" strokeWidth="2" fill="none"/>
        {/* Earrings */}
        <circle cx="28" cy="55" r="2" fill="black"/>
        <circle cx="72" cy="55" r="2" fill="black"/>
      </svg>
    ),
    female3: ( // Hijab style
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
        {/* Hijab */}
        <path d="M20 45 Q15 25 50 20 Q85 25 80 45 L80 80 Q70 90 50 90 Q30 90 20 80 Z" fill="black"/>
        {/* Face opening */}
        <ellipse cx="50" cy="52" rx="18" ry="22" fill="white" stroke="black" strokeWidth="2"/>
        {/* Eyes */}
        <ellipse cx="43" cy="50" rx="3" ry="2.5" fill="black"/>
        <ellipse cx="57" cy="50" rx="3" ry="2.5" fill="black"/>
        {/* Eyebrows */}
        <path d="M38 45 Q43 43 48 45" stroke="black" strokeWidth="1.5" fill="none"/>
        <path d="M52 45 Q57 43 62 45" stroke="black" strokeWidth="1.5" fill="none"/>
        {/* Nose */}
        <path d="M50 52 L50 57" stroke="black" strokeWidth="1.5" fill="none"/>
        {/* Warm smile */}
        <path d="M44 63 Q50 68 56 63" stroke="black" strokeWidth="2" fill="none"/>
      </svg>
    ),
    female4: ( // Ponytail
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="white" stroke="black" strokeWidth="3"/>
        {/* Hair with ponytail */}
        <path d="M28 42 Q22 15 50 12 Q78 15 72 42 Q70 28 50 25 Q30 28 28 42" fill="black"/>
        {/* Ponytail */}
        <path d="M70 30 Q85 25 88 40 Q90 55 80 60" stroke="black" strokeWidth="6" fill="none"/>
        {/* Face outline */}
        <ellipse cx="50" cy="55" rx="21" ry="25" fill="white" stroke="black" strokeWidth="2.5"/>
        {/* Eyes */}
        <ellipse cx="42" cy="52" rx="3" ry="2.5" fill="black"/>
        <ellipse cx="58" cy="52" rx="3" ry="2.5" fill="black"/>
        {/* Eyebrows */}
        <path d="M37 47 Q42 45 47 48" stroke="black" strokeWidth="1.5" fill="none"/>
        <path d="M53 48 Q58 45 63 47" stroke="black" strokeWidth="1.5" fill="none"/>
        {/* Nose */}
        <path d="M50 54 L50 59" stroke="black" strokeWidth="1.5" fill="none"/>
        {/* Smile */}
        <path d="M44 67 Q50 72 56 67" stroke="black" strokeWidth="2" fill="none"/>
      </svg>
    ),
  }

  return avatars[type]
}

// Wave animation for card background
function CardWaveAnimation({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      ctx.clearRect(0, 0, width, height)

      const lineCount = 10
      const lineSpacing = width / (lineCount + 1)

      for (let i = 0; i < lineCount; i++) {
        const x = lineSpacing * (i + 1)

        ctx.beginPath()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'

        for (let y = 0; y <= height; y += 2) {
          const wave1 = Math.sin((y * 0.025) + time + (i * 0.4)) * 6
          const wave2 = Math.sin((y * 0.015) + time * 1.2 + (i * 0.3)) * 4

          const offsetX = wave1 + wave2

          if (y === 0) {
            ctx.moveTo(x + offsetX, y)
          } else {
            ctx.lineTo(x + offsetX, y)
          }
        }

        ctx.stroke()
      }

      time += 0.02
      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [color])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: 'block' }}
    />
  )
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, rotateY: -5 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateY: (i % 2 === 0 ? -3 : 3),
    transition: {
      duration: 0.5,
      delay: i * 0.1,
      ease: 'easeOut' as const,
    },
  }),
  hover: {
    y: -8,
    rotateY: 0,
    transition: { duration: 0.3 },
  },
}

export function StaffCards() {
  return (
    <section className="py-32 bg-white border-b border-notion overflow-hidden">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-landing-text-muted mb-4 font-mono">
            Tim AI Anda
          </h2>
          <h3
            className="text-5xl md:text-6xl font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Kenali <span className="italic">Staff</span> Anda.
          </h3>
          <p className="text-lg text-landing-text-muted mt-6 max-w-2xl mx-auto">
            8 spesialis AI siap handle operasional bisnis Anda 24/7.
            Masing-masing terlatih untuk peran spesifik mereka.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {staffMembers.map((staff, i) => (
            <motion.div
              key={staff.name}
              custom={i}
              initial="hidden"
              whileInView="visible"
              whileHover="hover"
              viewport={{ once: true }}
              variants={cardVariants}
              className="group perspective-1000"
            >
              <div
                className="relative rounded-2xl overflow-hidden shadow-xl h-[320px] flex flex-col"
                style={{ backgroundColor: staff.color }}
              >
                {/* Wave animation background */}
                <CardWaveAnimation color={staff.color} />

                {/* Content */}
                <div className="relative z-10 flex flex-col h-full p-5">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-xl bg-white shadow-lg mb-4 overflow-hidden">
                    <NotionAvatar type={staff.avatar} />
                  </div>

                  {/* Info */}
                  <div className="mt-auto">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">
                      {staff.department}
                    </div>
                    <h4 className="text-xl font-bold text-white mb-1">
                      {staff.role}
                    </h4>
                    <p className="text-xs text-white/80 leading-relaxed">
                      {staff.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
