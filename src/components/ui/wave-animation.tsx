'use client'

import { useEffect, useRef } from 'react'

interface WaveAnimationProps {
  className?: string
  color?: string
  lineCount?: number
  speed?: number
}

export function WaveAnimation({
  className = '',
  color = 'rgba(255, 255, 255, 0.6)',
  lineCount = 12,
  speed = 0.02,
}: WaveAnimationProps) {
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

      const lineSpacing = width / (lineCount + 1)

      for (let i = 0; i < lineCount; i++) {
        const x = lineSpacing * (i + 1)

        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'

        // Create flowing wave using sine waves
        for (let y = 0; y <= height; y += 2) {
          // Multiple sine waves for organic feel
          const wave1 = Math.sin((y * 0.02) + time + (i * 0.5)) * 8
          const wave2 = Math.sin((y * 0.015) + time * 1.3 + (i * 0.3)) * 5
          const wave3 = Math.sin((y * 0.008) + time * 0.7 + (i * 0.7)) * 3

          const offsetX = wave1 + wave2 + wave3

          if (y === 0) {
            ctx.moveTo(x + offsetX, y)
          } else {
            ctx.lineTo(x + offsetX, y)
          }
        }

        ctx.stroke()
      }

      time += speed
      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [color, lineCount, speed])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  )
}

// Horizontal wave variant
export function HorizontalWaveAnimation({
  className = '',
  color = 'rgba(255, 255, 255, 0.6)',
  lineCount = 8,
  speed = 0.015,
}: WaveAnimationProps) {
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

      const lineSpacing = height / (lineCount + 1)

      for (let i = 0; i < lineCount; i++) {
        const y = lineSpacing * (i + 1)

        ctx.beginPath()
        ctx.strokeStyle = color
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'

        for (let x = 0; x <= width; x += 2) {
          const wave1 = Math.sin((x * 0.02) + time + (i * 0.5)) * 6
          const wave2 = Math.sin((x * 0.012) + time * 1.2 + (i * 0.4)) * 4
          const wave3 = Math.sin((x * 0.006) + time * 0.8 + (i * 0.6)) * 2

          const offsetY = wave1 + wave2 + wave3

          if (x === 0) {
            ctx.moveTo(x, y + offsetY)
          } else {
            ctx.lineTo(x, y + offsetY)
          }
        }

        ctx.stroke()
      }

      time += speed
      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationId)
    }
  }, [color, lineCount, speed])

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  )
}
