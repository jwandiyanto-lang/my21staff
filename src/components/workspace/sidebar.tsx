'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Database, Globe, MessageCircle, Settings } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

interface WorkspaceSidebarProps {
  workspace: {
    name: string
    slug: string
  }
}

const navItems = [
  {
    title: 'Database',
    icon: Database,
    href: '/database',
  },
  {
    title: 'Inbox',
    icon: MessageCircle,
    href: '/inbox',
  },
  {
    title: 'Website',
    icon: Globe,
    href: '/website',
  },
  {
    title: 'Settings',
    icon: Settings,
    href: '/settings',
  },
]

export function WorkspaceSidebar({ workspace }: WorkspaceSidebarProps) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border px-4 py-3">
        <h2 className="font-semibold text-foreground truncate">
          {workspace.name}
        </h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const fullHref = `/${workspace.slug}${item.href}`
                const isActive = pathname === fullHref || pathname.startsWith(`${fullHref}/`)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={fullHref}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
