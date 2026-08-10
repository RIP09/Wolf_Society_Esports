import { ConvexError } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { logUnauthorized } from "./security";
import { ROLES } from "./schema";
import { getCurrentUser } from "./users";

export type GuardCtx = QueryCtx | MutationCtx;

function isMutationCtx(ctx: GuardCtx): ctx is MutationCtx {
  return (ctx as MutationCtx).scheduler !== undefined;
}

/** Requires a signed-in user. Throws otherwise. */
export async function requireUser(ctx: GuardCtx): Promise<Doc<"users">> {
  const user = await getCurrentUser(ctx);
  if (!user) {
    if (isMutationCtx(ctx)) {
      await logUnauthorized(ctx, null, "Blocked access by a signed-out user");
    }
    throw new ConvexError({ message: "You must be signed in to do that." });
  }
  return user;
}

export const ADMIN_ROLES: ReadonlySet<string> = new Set(["superadmin", "admin"]);

/** Returns true when the user holds any management role (superadmin or admin). */
export function hasAdminRole(role: string | undefined): boolean {
  return role !== undefined && ADMIN_ROLES.has(role);
}

/** Requires a signed-in user with a management role (superadmin or admin). */
export async function requireAdmin(ctx: GuardCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (!hasAdminRole(user.role)) {
    if (isMutationCtx(ctx)) {
      await logUnauthorized(ctx, user, "Non-admin attempted an admin-only action");
    }
    throw new ConvexError({
      message: "Admin access required. This action is restricted to organization managers.",
    });
  }
  return user;
}

/** Returns true when the user is an admin without throwing (used by gates). */
export async function isAdmin(ctx: GuardCtx): Promise<boolean> {
  const user = await getCurrentUser(ctx);
  return hasAdminRole(user?.role);
}

/**
 * Requires a signed-in user holding the Super Admin role.
 * Only the Super Admin can manage the management team itself (list staff,
 * revoke access). Every other role is rejected and audited.
 */
export async function requireSuperAdmin(ctx: GuardCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== ROLES.SUPER_ADMIN) {
    if (isMutationCtx(ctx)) {
      await logUnauthorized(
        ctx,
        user,
        "Non-super-admin attempted a super-admin-only action (staff management)",
      );
    }
    throw new ConvexError({
      message: "Super Admin access required. This action is restricted to the organization's Super Admin.",
    });
  }
  return user;
}
