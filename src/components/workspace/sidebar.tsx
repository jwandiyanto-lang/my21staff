'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  GitBranch,
  Database,
  Plug,
  User,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from './workspace-switcher'

interface WorkspaceSidebarProps {
  workspace: {
    name: string
    slug: string
  }
  isAdmin?: boolean
}

const operationsNav = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    href: '',
  },
  {
    title: 'Lead Management',
    icon: Users,
    href: '/database',
  },
  {
    title: 'Conversations',
    icon: MessageCircle,
    href: '/inbox',
    badge: 12,
  },
]

const engineeringNav = [
  {
    title: 'Workflows',
    icon: GitBranch,
    href: '/workflows',
  },
  {
    title: 'Data Logs',
    icon: Database,
    href: '/logs',
  },
  {
    title: 'Integrations',
    icon: Plug,
    href: '/integrations',
  },
]

const adminNav = [
  {
    title: 'Client Management',
    icon: Settings,
    href: '/admin/clients',
  },
]

export function WorkspaceSidebar({ workspace, isAdmin = false }: WorkspaceSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    const fullHref = `/${workspace.slug}${href}`
    if (href === '') {
      return pathname === `/${workspace.slug}`
    }
    return pathname === fullHref || pathname.startsWith(`${fullHref}/`)
  }

  const isAdminRoute = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside className="w-64 bg-sidebar flex flex-col z-20 border-r border-black/5 h-screen">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg">
          M
        </div>
        <span className="font-bold text-xl tracking-tight text-primary">
          my21staff
        </span>
      </div>

      {/* Workspace Switcher (Admin only) */}
      {isAdmin && (
        <WorkspaceSwitcher
          currentWorkspaceSlug={workspace.slug}
          isAdmin={isAdmin}
        />
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
        {/* Operations Section */}
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mb-4">
          Operations
        </div>
        {operationsNav.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.title}
              href={`/${workspace.slug}${item.href}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                active
                  ? 'active-nav'
                  : 'text-muted-foreground hover:bg-white/40'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.title}
              {item.badge && (
                <span className="ml-auto bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}

        {/* Engineering Section */}
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mt-8 mb-4">
          Engineering
        </div>
        {engineeringNav.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.title}
              href={`/${workspace.slug}${item.href}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                active
                  ? 'active-nav'
                  : 'text-muted-foreground hover:bg-white/40'
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.title}
            </Link>
          )
        })}

        {/* Admin Section (Admin only) */}
        {isAdmin && (
          <>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 mt-8 mb-4">
              Admin
            </div>
            {adminNav.map((item) => {
              const active = isAdminRoute(item.href)
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                    active
                      ? 'active-nav'
                      : 'text-muted-foreground hover:bg-white/40'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.title}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4">
        <div className="flex items-center gap-3 p-3 bg-white/40 rounded-2xl border border-white/40">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate">{workspace.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
              {isAdmin ? 'Admin' : 'Client'} Access
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
