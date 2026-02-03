// Status configuration type
export interface LeadStatusConfig {
  key: string;
  label: string;
  color: string;
  bgColor: string;
}

// Fixed 4-status configuration (simplified)
export const DEFAULT_LEAD_STATUSES: LeadStatusConfig[] = [
  { key: "new", label: "New", color: "#6B7280", bgColor: "#F3F4F6" },
  { key: "cold", label: "Cold Lead", color: "#3B82F6", bgColor: "#DBEAFE" },
  { key: "hot", label: "Hot Lead", color: "#DC2626", bgColor: "#FEE2E2" },
  { key: "client", label: "Client", color: "#10B981", bgColor: "#D1FAE5" },
];

// Legacy type for backwards compatibility
export type LeadStatus = string;

// Helper to get status config (static version for non-dynamic contexts)
export function getStatusConfig(
  statusKey: string,
  workspaceConfig?: LeadStatusConfig[]
): LeadStatusConfig {
  const config = workspaceConfig || DEFAULT_LEAD_STATUSES;
  const found = config.find(s => s.key === statusKey);

  // Return found config or a fallback for unknown statuses
  if (found) return found;

  return {
    key: statusKey,
    label: statusKey.charAt(0).toUpperCase() + statusKey.slice(1).replace(/_/g, ' '),
    color: "#6B7280",
    bgColor: "#F3F4F6",
  };
}

// Legacy exports for backwards compatibility
export const LEAD_STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> =
  Object.fromEntries(
    DEFAULT_LEAD_STATUSES.map(s => [s.key, { label: s.label, color: s.color, bgColor: s.bgColor }])
  );

export const LEAD_STATUSES = DEFAULT_LEAD_STATUSES.map(s => s.key);

// Default status for new contacts
export const DEFAULT_LEAD_STATUS = "new";
