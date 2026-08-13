import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { btnGhost, btnYellow, card } from "@/lib/neo";
import { Loader2, ShieldCheck, ShieldX } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useMutation, useQuery } from "convex/react";
import { Navigate, useNavigate } from "react-router";
import { toast } from "sonner";
import { LoadingScreen } from "@/components/Loading";

function FounderClaim() {
  const claimAdmin = useMutation(api.admin.claimAdmin);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    try {
      await claimAdmin();
      toast.success("Welcome — you now have management access.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Claim failed.");
      setClaiming(false);
    }
  };

  return (
    <div className="neo-grid-bg flex min-h-screen items-center justify-center bg-background px-4">        <div className={`${card} w-full max-w-md gap-5 p-8`}>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
              <ShieldCheck className="size-6" />
            </span>
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Wolf Society Esports · The Den
              </p>
              <h1 className="text-2xl font-bold tracking-tight">Management access</h1>
            </div>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            No manager exists in Wolf Society Esports yet. The first person to claim
            management access becomes the organization's manager and can approve players,
            run rosters, plan tournaments and review performance. Everyone who signs up
            after you joins The Pack as a player.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              className={`${btnYellow} w-full`}
              onClick={handleClaim}
              disabled={claiming}
            >
              <ShieldCheck className="size-4" />
              {claiming ? "Claiming…" : "Claim management access"}
            </Button>
          {error ? (
            <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-xs font-bold text-white">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const isManager = (role?: string) => role === "admin" || role === "superadmin";

/** Gate for /admin/* — admins pass, players are bounced to their portal,
 *  and when no admin exists yet the founder-claim flow is shown. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isLoading, user } = useAuth();
  const adminCount = useQuery(api.admin.countAdmins);

  if (isLoading || adminCount === undefined) {
    return <LoadingScreen label="Checking access…" />;
  }
  if (isManager(user?.role)) {
    return children;
  }
  if (adminCount > 0) {
    return <Navigate to="/player" replace />;
  }
  return <FounderClaim />;
}

/** Suspended players get a hard block screen with a sign-out option. */
function SuspendedScreen() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      navigate("/");
    }
  };

  return (
    <div className="neo-grid-bg flex min-h-screen items-center justify-center bg-background px-4">
      <div className={`${card} w-full max-w-md gap-5 p-8 text-center`}>
        <span className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-foreground bg-neo-red text-white shadow-[4px_4px_0_0_var(--neo-ink)]">
          <ShieldX className="size-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Account suspended</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Your player account has been suspended by the management team in The Den. The
          player portal is locked until the organization reactivates you. If you believe
          this is a mistake, contact management through the public portal.
        </p>
        <Button className={btnGhost} onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? <Loader2 className="size-4 animate-spin" /> : <ShieldX className="size-4" />}
          {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </div>
  );
}

/** Gate for /player/* — players pass, admins are bounced to the command app,
 *  and suspended players are locked out with a clear screen. */
export function RequirePlayer({ children }: { children: ReactNode }) {
  const { isLoading, user } = useAuth();
  const profile = useQuery(api.players.getMyProfile);

  if (isLoading || profile === undefined) {
    return <LoadingScreen label="Checking access…" />;
  }
  if (isManager(user?.role)) return <Navigate to="/admin" replace />;
  if (profile && profile.status === "suspended") return <SuspendedScreen />;
  return children;
}

/** After sign-in: route by role. */
export function PortalRedirect() {
  const { isLoading, user } = useAuth();
  if (isLoading) return <LoadingScreen label="Routing…" />;
  return <Navigate to={isManager(user?.role) ? "/admin" : "/player"} replace />;
}

export function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className={`${card} w-full max-w-sm gap-4 p-8 text-center`}>
        <ShieldX className="mx-auto size-8" />
        <h1 className="text-xl font-bold">Access denied</h1>
        <p className="text-sm text-muted-foreground">
          You don't have permission to view this area.
        </p>
      </div>
    </div>
  );
}
