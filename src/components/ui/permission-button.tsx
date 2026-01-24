'use client'

import * as React from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { hasPermission } from '@/lib/permissions/check'
import { type Permission, type WorkspaceRole } from '@/lib/permissions/types'
import { type VariantProps } from 'class-variance-authority'

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

interface PermissionButtonProps extends ButtonProps {
  permission: Permission
  userRole: WorkspaceRole
  tooltipMessage?: string
}

export function PermissionButton({
  permission,
  userRole,
  tooltipMessage = 'Contact workspace owner for access',
  children,
  onClick,
  disabled,
  ...props
}: PermissionButtonProps) {
  const allowed = hasPermission(userRole, permission)

  if (allowed) {
    return (
      <Button onClick={onClick} disabled={disabled} {...props}>
        {children}
      </Button>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild className="disabled:pointer-events-auto">
        <Button disabled {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipMessage}</p>
      </TooltipContent>
    </Tooltip>
  )
}
