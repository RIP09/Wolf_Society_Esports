import { query } from "./_generated/server";
import { requireAdmin } from "./guards";

/** Admin-only: recent blocked unauthorized-access attempts. */
export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("securityLogs").order("desc").take(20);
  },
});
