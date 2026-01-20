'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Settings,
  User,
  ChevronLeft,
  ChevronRight,
  Headphones,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkspaceSwitcher } from './workspace-switcher'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

interface WorkspaceSidebarProps {
  workspace: {
    id?: string
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
  },
  {
    title: 'Support',
    icon: Headphones,
    href: '/support',
  },
]

const adminNav = [
  {
    title: 'Your Intern',
    icon: BookOpen,
    href: '/knowledge-base',
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/settings',
  },
]

export function WorkspaceSidebar({ workspace, isAdmin = false }: WorkspaceSidebarProps) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  // Fetch unread conversation count
  useEffect(() => {
    async function fetchUnreadCount() {
      if (!workspace.id) return

      const supabase = createClient()
      const { data, error } = await supabase
        .from('conversations')
        .select('unread_count')
        .eq('workspace_id', workspace.id)
        .gt('unread_count', 0)

      if (!error && data) {
        const total = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0)
        setUnreadCount(total)
      }
    }

    fetchUnreadCount()

    // Poll every 30 seconds for new messages
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [workspace.id])

  const isActive = (href: string) => {
    const fullHref = `/${workspace.slug}${href}`
    if (href === '') {
      return pathname === `/${workspace.slug}`
    }
    return pathname === fullHref || pathname.startsWith(`${fullHref}/`)
  }

  return (
    <aside className={cn(
      'bg-sidebar flex flex-col z-20 border-r border-white/10 h-screen transition-all duration-300 relative',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Collapse toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-7 z-30 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-muted"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>

      {/* Logo */}
      <div className={cn('p-4 flex items-center', collapsed ? 'justify-center' : 'gap-2')}>
        {collapsed ? (
          <span className="text-2xl font-black text-[#F7931A]">21</span>
        ) : (
          <Link href="/" className="flex items-baseline">
            <span className="text-xl font-bold text-white">my</span>
            <span className="text-xl font-black text-[#F7931A]">21</span>
            <span className="text-xl font-bold text-white">staff</span>
          </Link>
        )}
      </div>

      {/* Workspace Switcher (Admin only) */}
      {isAdmin && !collapsed && (
        <WorkspaceSwitcher
          currentWorkspaceSlug={workspace.slug}
          isAdmin={isAdmin}
        />
      )}

      {/* Navigation */}
      <nav className={cn('flex-1 py-4 space-y-1 overflow-y-auto custom-scrollbar', collapsed ? 'px-2' : 'px-4')}>
        {/* Operations Section */}
        {!collapsed && (
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mb-4">
            Operations
          </div>
        )}
        {operationsNav.map((item) => {
          const active = isActive(item.href)
          const showBadge = item.href === '/inbox' && unreadCount > 0
          return (
            <Link
              key={item.title}
              href={`/${workspace.slug}${item.href}`}
              title={collapsed ? item.title : undefined}
              className={cn(
                'flex items-center rounded-xl text-sm font-semibold transition-colors',
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                active
                  ? 'active-nav'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="flex-1">{item.title}</span>}
              {showBadge && (
                <span className={cn(
                  'text-xs font-bold rounded-full bg-[#F7931A] text-white min-w-[20px] text-center',
                  collapsed ? 'absolute -top-1 -right-1 px-1 py-0.5 text-[10px]' : 'px-2 py-0.5'
                )}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}

        {/* Admin Section */}
        {!collapsed && (
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 mt-8 mb-4">
            Admin
          </div>
        )}
        {collapsed && <div className="my-4 border-t border-white/10" />}
        {adminNav.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.title}
              href={`/${workspace.slug}${item.href}`}
              title={collapsed ? item.title : undefined}
              className={cn(
                'flex items-center rounded-xl text-sm font-semibold transition-colors',
                collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                active
                  ? 'active-nav'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && item.title}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className={cn('p-2', collapsed ? 'px-2' : 'p-4')}>
        {collapsed ? (
          <div className="flex justify-center p-2">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-5 h-5 text-white/70" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-white/10 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white/70" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{workspace.name}</p>
              <p className="text-[10px] text-white/50 font-mono uppercase tracking-tighter">
                {isAdmin ? 'Admin' : 'Client'} Access
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
