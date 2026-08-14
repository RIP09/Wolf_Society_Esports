import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Platform cron jobs.
 *
 * AI Attendance watchdog — runs every 6 hours and auto-marks any verified
 * player ABSENT for every calendar day that ended more than 24h ago without a
 * check-in, then alerts management about players who missed 3+ days straight.
 */
const crons = cronJobs();

crons.interval("auto-mark-attendance-absent", { hours: 6 }, internal.attendance.markAbsentJob, {});

export default crons;
