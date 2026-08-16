import { getVisitorId } from "@/lib/visitor";
import { useAuth } from "@/hooks/use-auth";
import { useMemo } from "react";

/**
 * The Fan Zone's identity key: `user:<id>` for signed-in fans (earns XP,
 * appears on the leaderboard) or `visitor:<id>` for anonymous guests
 * (participates but doesn't rank). Stable across the session either way.
 */
export function useVoterKey(): string {
  const { isAuthenticated, user } = useAuth();
  return useMemo(() => {
    if (isAuthenticated && user) return `user:${user._id}`;
    return `visitor:${getVisitorId()}`;
  }, [isAuthenticated, user]);
}
