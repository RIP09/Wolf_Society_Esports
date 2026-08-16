import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
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
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { fmtRelative } from "@/lib/format";
import { btnYellow } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "convex/react";
import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Crown,
  Eye,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { Fragment, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

function Detail({ label, value, wide }: { label: string; value?: string; wide?: boolean }) {
  return (
    <div className={wide ? "flex flex-col gap-1 sm:col-span-2 lg:col-span-3" : "flex flex-col gap-1"}>
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <p className="text-sm">{value && value.trim() ? value : <span className="text-muted-foreground/60">—</span>}</p>
    </div>
  );
}

type StaffRow = {
  userId: Id<"users">;
  name: string;
  email: string;
  loginId: string;
  authRole: string | undefined;
  displayRole: string;
  phone: string;
  grantedAt?: number;
  isSelf: boolean;
  isBuiltIn: boolean;
  profile: {
    phone?: string;
    title?: string;
    location?: string;
    timezone?: string;
    discord?: string;
    gameFocus?: string;
    bio?: string;
    socials?: string;
    updatedAt: number;
  } | null;
};

export default function AdminStaff() {
  const { user } = useAuth();
  const staff = useQuery(api.access.listManagementUsers);
  const removeUser = useMutation(api.access.removeManagementUser);

  const [removeTarget, setRemoveTarget] = useState<StaffRow | null>(null);
  const [removing, setRemoving] = useState(false);
  const [expanded, setExpanded] = useState<Id<"users"> | null>(null);

  const isSuperAdmin = user?.role === "superadmin";

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await removeUser({ userId: removeTarget.userId });
      toast.success(`${removeTarget.name}'s access has been revoked.`);
      setRemoveTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove this user.");
    } finally {
      setRemoving(false);
    }
  };

  // Security gate — this page is only for the Super Admin role.
  if (!isSuperAdmin) {
    return (
      <NeoCard className="mx-auto w-full max-w-md gap-4 p-8 text-center">
        <ShieldAlert className="mx-auto size-8" />
        <h1 className="text-xl font-bold">Restricted to Super Admin</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          The management team directory is visible only to the organization's Super Admin.
          Sign in with the super admin credentials (WSE) to view and manage staff access.
        </p>
      </NeoCard>
    );
  }

  const superAdmins = (staff ?? []).filter((s) => s.authRole === "superadmin");
  const managers = (staff ?? []).filter((s) => s.authRole === "admin");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Wolf Society Esports · The Den"
        title="Management team"
        description="Every person with management portal access, visible only to the Super Admin. Revoke access instantly when someone leaves the organization — their login and all open sessions are closed immediately."
        actions={
          <span className="flex items-center gap-2 border-2 border-foreground bg-neo-cream px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neo-green opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-neo-green" />
            </span>
            Live directory
          </span>
        }
      />

      {/* Summary strip */}
      <div className="grid gap-4 sm:grid-cols-3">
        <NeoCard className="gap-1 px-5 py-4">
          <span className="inline-block h-2.5 w-2.5 border-2 border-foreground bg-neo-yellow" />
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Total staff
          </p>
          <p className="text-3xl font-bold tabular-nums">{staff?.length ?? "—"}</p>
          <p className="text-xs text-muted-foreground">with management access</p>
        </NeoCard>
        <NeoCard className="gap-1 px-5 py-4">
          <span className="inline-block h-2.5 w-2.5 border-2 border-foreground bg-neo-red" />
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Super admins
          </p>
          <p className="text-3xl font-bold tabular-nums">{superAdmins.length}</p>
          <p className="text-xs text-muted-foreground">full control of the Society</p>
        </NeoCard>
        <NeoCard className="gap-1 px-5 py-4">
          <span className="inline-block h-2.5 w-2.5 border-2 border-foreground bg-neo-blue" />
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Managers
          </p>
          <p className="text-3xl font-bold tabular-nums">{managers.length}</p>
          <p className="text-xs text-muted-foreground">granted portal roles</p>
        </NeoCard>
      </div>

      {/* Directory */}
      {staff === undefined ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse border-2 border-foreground bg-card" />
          ))}
        </div>
      ) : staff.length === 0 ? (
        <EmptyState
          title="No management staff yet"
          description="Once access requests are granted from the Access page, the team appears here in real time."
        />
      ) : (
        <div className="flex flex-col divide-y-2 divide-foreground/10 border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--neo-ink)]">
          {staff.map((row) => (
            <Fragment key={row.userId}>
            <div
              className={cn(
                "flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
                row.isSelf && "bg-neo-cream/60",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center border-2 border-foreground text-white",
                    row.authRole === "superadmin" ? "bg-neo-yellow" : "bg-neo-blue",
                  )}
                >
                  <span className="font-mono text-sm font-bold">
                    {row.name.slice(0, 1).toUpperCase()}
                  </span>
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{row.name}</p>
                    {row.isSelf ? (
                      <StatusBadge status="approved">You</StatusBadge>
                    ) : row.isBuiltIn ? (
                      <StatusBadge status="superadmin">Built-in</StatusBadge>
                    ) : null}
                  </div>
                  <p className="flex items-center gap-1 truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {row.email || "no email on file"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 border-2 border-foreground bg-neo-cream px-2 py-1 font-mono text-[11px] font-bold">
                  <KeyRound className="size-3.5" />
                  {row.loginId}
                </span>
                {row.authRole === "superadmin" ? (
                  <StatusBadge status="superadmin">
                    <Crown className="size-3" />
                    Super Admin
                  </StatusBadge>
                ) : (
                  <StatusBadge status="admin">{row.displayRole}</StatusBadge>
                )}
                {row.grantedAt ? (
                  <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <CalendarClock className="size-3" />
                    {fmtRelative(row.grantedAt)}
                  </span>
                ) : null}
                {row.phone ? (
                  <span className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    <Phone className="size-3" />
                    {row.phone}
                  </span>
                ) : null}
                {row.isSelf || row.isBuiltIn ? (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {row.isSelf ? "you can't remove your own access" : "recovery account"}
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none border-2 border-foreground bg-neo-red px-3 py-1.5 text-xs font-bold text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:bg-neo-red/90"
                    onClick={() => setRemoveTarget(row)}
                  >
                    <UserMinus className="size-3.5" />
                    Remove access
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-none border-2 border-foreground bg-card px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0_0_var(--neo-ink)]"
                  onClick={() => setExpanded(expanded === row.userId ? null : row.userId)}
                >
                  <Eye className="size-3.5" />
                  {expanded === row.userId ? "Hide details" : "View details"}
                  {expanded === row.userId ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                </Button>
              </div>
            </div>

            {/* Private profile details — only the Super Admin can see these. */}
            {expanded === row.userId ? (
              <div className="mt-3 grid gap-3 border-2 border-dashed border-foreground/40 bg-background p-4 sm:grid-cols-2 lg:grid-cols-3">
                <Detail label="Title / designation" value={row.profile?.title} />
                <Detail label="Phone / WhatsApp" value={(row.profile?.phone ?? row.phone) || undefined} />
                <Detail label="Location" value={row.profile?.location} />
                <Detail label="Timezone" value={row.profile?.timezone} />
                <Detail label="Discord" value={row.profile?.discord} />
                <Detail label="Game focus" value={row.profile?.gameFocus} />
                <Detail label="Bio" value={row.profile?.bio} wide />
                <Detail label="Socials / links" value={row.profile?.socials} wide />
                <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Last updated
                  </span>
                  <p className="font-mono text-xs font-bold">
                    {row.profile ? fmtRelative(row.profile.updatedAt) : "Not set yet — staff member hasn't filled their profile."}
                  </p>
                </div>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground sm:col-span-2 lg:col-span-3">
                  🔒 Private details — maintained by the staff member, visible only to the Super Admin.
                </p>
              </div>
            ) : null}
            </Fragment>
          ))}
        </div>
      )}

      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        Revoking access deletes the account, closes every open session and blocks future sign-in
        instantly. The organization is notified by email and Discord, and the action is recorded in
        the security log. The built-in recovery account (WSE) can never be removed.
      </p>

      {/* Remove confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && !removing && setRemoveTarget(null)}>
        <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">
              Remove {removeTarget?.name} from management?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This permanently revokes <span className="font-bold text-foreground">{removeTarget?.name}</span>'s
              access (<span className="font-mono font-bold">{removeTarget?.loginId}</span>,{" "}
              {removeTarget?.displayRole}). Their login is deleted and every open session is closed —
              they will not be able to sign in again. The organization is notified automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]">
              Keep access
            </AlertDialogCancel>
            <AlertDialogAction
              className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? <Loader2 className="size-4 animate-spin" /> : <UserMinus className="size-4" />}
              {removing ? "Revoking…" : "Yes, revoke access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <Users className="size-3.5" />
        New staff join here the moment access is granted from the Access page.
      </p>
    </div>
  );
}
