import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingScreen } from "@/components/Loading";
import { NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { MANAGEMENT_ROLES } from "@/lib/constants";
import { btnYellow, input, select } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useAction, useMutation, useQuery } from "convex/react";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck, ShieldX, UserPlus, XCircle } from "lucide-react";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

/** Super admin fallback login — works when the email button can't be opened. */
function SuperAdminLogin({ onSuccess }: { onSuccess?: () => void }) {
  const { signIn } = useAuth();
  const ensureSuperAdmin = useAction(api.access.ensureSuperAdmin);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await ensureSuperAdmin();
      await signIn("password", {
        flow: "signIn",
        email: userId.trim(),
        password,
      });
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.includes("Invalid credentials")
            ? "Invalid credentials. Try the super admin fallback: User ID WSE · Password WSE@123."
            : err.message
          : "Sign-in failed. Please try again.",
      );
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <NeoCard className="gap-5 p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
            <ShieldCheck className="size-6" />
          </span>
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Restricted area · Access management
            </p>
            <h1 className="text-2xl font-bold tracking-tight">Staff sign-in</h1>
          </div>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          This page reviews management access requests. Sign in with your management
          credentials — or use the super admin fallback (<span className="font-mono font-bold text-foreground">WSE</span> /{" "}
          <span className="font-mono font-bold text-foreground">WSE@123</span>).
        </p>
        {error ? (
          <p className="border-2 border-foreground bg-neo-red px-3 py-2 text-xs font-bold text-white">
            {error}
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
              User ID
            </span>
            <Input
              className={input}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="WSE"
              autoCapitalize="characters"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
              Password
            </span>
            <Input
              className={input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className={btnYellow} disabled={loading || !userId.trim() || !password}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4" />}
            {loading ? "Signing in…" : "Unlock access page"}
          </Button>
        </form>
      </NeoCard>
    </div>
  );
}

type RequestRow = {
  _id: Id<"accessRequests">;
  name: string;
  email: string;
  phone: string;
  requestedRole: string;
  reason?: string;
  status: "pending" | "granted" | "rejected";
  grantedUserId?: string;
  grantedRole?: string;
  grantedAt?: number;
  createdAt: number;
};

function AccessPanel() {
  const requests = useQuery(api.access.listRequests);
  const grant = useMutation(api.access.grantAccess);
  const reject = useMutation(api.access.rejectAccess);
  const resend = useMutation(api.access.resendCredentials);

  const [grantTarget, setGrantTarget] = useState<RequestRow | null>(null);
  const [grantRole, setGrantRole] = useState<string>("Manager");
  const [busy, setBusy] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<RequestRow | null>(null);

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const granted = (requests ?? []).filter((r) => r.status === "granted");
  const rejected = (requests ?? []).filter((r) => r.status === "rejected");

  const handleGrant = async () => {
    if (!grantTarget) return;
    setBusy(true);
    try {
      await grant({ requestId: grantTarget._id, role: grantRole });
      toast.success(`Access granted — credentials sent by email & SMS to ${grantTarget.email}.`);
      setGrantTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not grant access.");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setBusy(true);
    try {
      await reject({ requestId: rejectTarget._id });
      toast.success(`Request from ${rejectTarget.name} declined and notified.`);
      setRejectTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not decline the request.");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async (row: RequestRow) => {
    setBusy(true);
    try {
      await resend({ requestId: row._id });
      toast.success(`New credentials sent to ${row.email} by email & SMS.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not resend credentials.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <PageHeader
        eyebrow="Secret page · Wolf Society Esports"
        title="Access management"
        description="Review who asked for management portal access, grant a role, or decline. Granted users receive their User ID and password by email and SMS automatically."
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <UserPlus className="size-5" />
          <h2 className="font-bold">Pending requests ({pending.length})</h2>
        </div>
        {requests === undefined ? (
          <div className="grid gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <NeoCard className="gap-2 p-6 text-sm text-muted-foreground">
            No pending requests. New registrations from the management portal land here
            and notify the organization by email.
          </NeoCard>
        ) : (
          pending.map((r) => (
            <NeoCard key={r._id} className="gap-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-cream">
                    <span className="font-mono text-sm font-bold">{r.name.slice(0, 1).toUpperCase()}</span>
                  </span>
                  <div>
                    <p className="font-bold">{r.name}</p>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {r.email} · {r.phone}
                    </p>
                  </div>
                </div>
                <StatusBadge status="pending" />
              </div>
              <div className="flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5">
                  Wants: {r.requestedRole}
                </span>
              </div>
              {r.reason ? <p className="text-sm leading-6 text-muted-foreground">“{r.reason}”</p> : null}
              <div className="flex flex-wrap gap-2 border-t-2 border-foreground/20 pt-4">
                <Button size="sm" className={btnYellow} onClick={() => { setGrantTarget(r); setGrantRole(r.requestedRole); }}>
                  <CheckCircle2 className="size-4" />
                  Grant access
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none border-2 border-foreground bg-neo-red px-3 py-1.5 text-xs font-bold text-white shadow-[2px_2px_0_0_var(--neo-ink)]"
                  onClick={() => setRejectTarget(r)}
                >
                  <XCircle className="size-4" />
                  Decline
                </Button>
              </div>
            </NeoCard>
          ))
        )}
      </section>

      {granted.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5" />
            <h2 className="font-bold">Granted ({granted.length})</h2>
          </div>
          {granted.map((r) => (
            <NeoCard key={r._id} className="gap-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold">{r.name}</p>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {r.email} · {r.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={r.grantedRole === "Super Admin" ? "superadmin" : "granted"} />
                  <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5 font-mono text-[11px] font-bold">
                    {r.grantedUserId}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 border-t-2 border-foreground/20 pt-3">
                <p className="text-xs text-muted-foreground">
                  {r.grantedRole} · credentials delivered to {r.email} &amp; {r.phone}
                </p>
                <Button size="sm" variant="outline" className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]" disabled={busy} onClick={() => handleResend(r)}>
                  <KeyRound className="size-3.5" />
                  Resend credentials
                </Button>
              </div>
            </NeoCard>
          ))}
        </section>
      ) : null}

      {rejected.length > 0 ? (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <XCircle className="size-5" />
            <h2 className="font-bold">Declined ({rejected.length})</h2>
          </div>
          {rejected.map((r) => (
            <NeoCard key={r._id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-bold">{r.name}</p>
                <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{r.email}</p>
              </div>
              <StatusBadge status="rejected" />
            </NeoCard>
          ))}
        </section>
      ) : null}

      <AlertDialog open={!!grantTarget} onOpenChange={(o) => !o && setGrantTarget(null)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Grant management access</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Grant <span className="font-bold text-foreground">{grantTarget?.name}</span> access to The Den.
              A User ID and password will be generated and sent to their email and phone automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">Role to grant</span>
            <Select value={grantRole} onValueChange={setGrantRole}>
              <SelectTrigger className={cn(select, "w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none border-2 border-foreground">
                {MANAGEMENT_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={handleGrant}
              disabled={busy}
            >
              <CheckCircle2 className="size-4" />
              Grant &amp; send credentials
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Decline this request?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {rejectTarget?.name} will be notified by email that their access request was declined.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">
              Keep request
            </AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={handleReject}
              disabled={busy}
            >
              <XCircle className="size-4" />
              Decline request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function GrantAccess() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const isManager = user?.role === "admin" || user?.role === "superadmin";

  if (isLoading) return <LoadingScreen label="Checking access…" />;

  return (
    <div className="neo-grid-bg flex min-h-screen flex-col items-center bg-background px-4 py-12">
      {!isAuthenticated ? (
        <SuperAdminLogin />
      ) : !isManager ? (
        <NeoCard className="w-full max-w-md gap-4 p-8 text-center">
          <ShieldX className="mx-auto size-8" />
          <h1 className="text-xl font-bold">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            This area is restricted to the organization's management team. If you reached
            this page from a notification, sign in with your management credentials.
          </p>
        </NeoCard>
      ) : (
        <div className="w-full max-w-3xl">
          <AccessPanel />
        </div>
      )}
      <p className="mt-10 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Wolf Society Esports · Secret access page · Do not share
      </p>
    </div>
  );
}
