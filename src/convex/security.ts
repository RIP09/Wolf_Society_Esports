import type { Doc } from "./_generated/dataModel";
import { api } from "./_generated/api";
import type { MutationCtx } from "./_generated/server";

/**
 * Records a blocked unauthorized-access attempt and alerts the organization
 * by email. Only callable from mutations (queries have no scheduler).
 */
export async function logUnauthorized(
  ctx: MutationCtx,
  user: Doc<"users"> | null,
  reason: string,
): Promise<void> {
  try {
    await ctx.db.insert("securityLogs", {
      userId: user?._id,
      email: user?.email,
      reason,
      createdAt: Date.now(),
    });
  } catch {
    // logging must never break the request
  }
  try {
    await ctx.scheduler.runAfter(0, api.notify.securityAlert, {
      email: user?.email ?? undefined,
      reason,
    });
  } catch {
    // email failures must never break the request
  }
  try {
    await ctx.scheduler.runAfter(0, api.automation.triggerWorkflow, {
      event: "security.alert",
      payload: JSON.stringify({ email: user?.email ?? undefined, reason }),
    });
  } catch {
    // automation failures must never break the request
  }
}
