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

export default crons;
