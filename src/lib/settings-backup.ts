/**
 * Helper functions for creating settings backups
 */

/**
 * Create a backup after successful settings save
 * @param workspaceId - Workspace ID
 * @param type - Backup type ('intern_config', 'brain_config', 'bot_names', 'full')
 * @param data - Configuration data to backup
 * @returns Promise<void>
 */
export async function backupSettings(
  workspaceId: string,
  type: 'intern_config' | 'brain_config' | 'bot_names' | 'full',
  data: unknown
): Promise<void> {
  // Skip in dev mode
  if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
    return
  }

  try {
    const response = await fetch(`/api/workspaces/${workspaceId}/settings-backup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        backup_type: type,
        config_data: data,
        source: 'user_save',
      }),
    })

    if (!response.ok) {
      console.error('Backup creation failed:', await response.text())
    }
  } catch (error) {
    // Don't throw - backup failure shouldn't block save
    console.error('Settings backup error:', error)
  }
}
