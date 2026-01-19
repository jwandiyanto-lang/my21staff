// Central support hub configuration
// All client tickets are routed to this workspace for centralized handling

/**
 * The workspace ID where all client support tickets are routed.
 * This is the my21staff admin workspace.
 *
 * Can be overridden via NEXT_PUBLIC_ADMIN_WORKSPACE_ID environment variable.
 */
export const ADMIN_WORKSPACE_ID = process.env.NEXT_PUBLIC_ADMIN_WORKSPACE_ID
  || '0318fda5-22c4-419b-bdd8-04471b818d17' // my21staff workspace

/**
 * Check if a workspace is the admin workspace.
 */
export function isAdminWorkspace(workspaceId: string): boolean {
  return workspaceId === ADMIN_WORKSPACE_ID
}

/**
 * Check if a ticket is a client ticket (routed to admin workspace).
 * Client tickets have admin_workspace_id set.
 */
export function isClientTicket(ticket: { admin_workspace_id: string | null }): boolean {
  return ticket.admin_workspace_id !== null
}
