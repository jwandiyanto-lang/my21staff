import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run background sync every hour to catch missed webhooks
// This identifies stale contacts that may have missed webhook updates
crons.interval(
  "background-sync",
  { hours: 1 },
  internal.backgroundSync.reconcileAllWorkspaces
);

// Run Brain daily summary at 09:00 WIB (01:00 UTC)
// Configured time can override this in brainConfig.summary.time
crons.daily(
  "brain-daily-summary",
  { hourUTC: 1, minuteUTC: 0 }, // 09:00 WIB (Indonesia Western Time)
  internal.brainAnalysis.generateDailySummary
);

// Clean up expired action recommendations every 6 hours
crons.interval(
  "brain-action-cleanup",
  { hours: 6 },
  internal.brainActions.cleanupExpiredActions
);

export default crons;
