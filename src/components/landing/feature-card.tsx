import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface FeatureCardProps {
  icon: string  // Lucide icon name
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  // Resolve icon component from name string
  const IconComponent = LucideIcons[icon as keyof typeof LucideIcons] as LucideIcon

  return (
    <div className="p-6 bg-white rounded-2xl border border-gray-100 hover:border-landing-cta/30 transition-colors">
      <div className="w-12 h-12 rounded-xl bg-landing-cta/10 flex items-center justify-center mb-4">
        {IconComponent && <IconComponent className="w-6 h-6 text-landing-cta" />}
      </div>
      <h3 className="text-lg font-bold text-landing-text mb-2">{title}</h3>
      <p className="text-sm text-landing-text-muted leading-relaxed">{description}</p>
    </div>
  )
}
