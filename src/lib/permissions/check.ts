import { NextResponse } from 'next/server'
import { ROLE_PERMISSIONS } from './constants'
import { type Permission, type WorkspaceRole } from './types'

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: WorkspaceRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * For API routes - returns 403 response if unauthorized, null if authorized
 *
 * Usage:
 * ```ts
 * const permError = requirePermission(authResult.role, 'leads:delete')
 * if (permError) return permError
 * ```
 *
 * With dangerouslySkipPermission (use with caution - bypasses permission checks):
 * ```ts
 * const permError = requirePermission(authResult.role, 'leads:delete', undefined, { dangerouslySkipPermission: true })
 * if (permError) return permError
 * ```
 */
interface RequirePermissionOptions {
  dangerouslySkipPermission?: boolean
}

export function requirePermission(
  role: WorkspaceRole,
  permission: Permission,
  errorMessage?: string,
  options?: RequirePermissionOptions
): NextResponse | null {
  if (options?.dangerouslySkipPermission) {
    return null
  }
  if (!hasPermission(role, permission)) {
    return NextResponse.json(
      { error: errorMessage || `Insufficient permissions: requires ${permission}` },
      { status: 403 }
    )
  }
  return null
}
