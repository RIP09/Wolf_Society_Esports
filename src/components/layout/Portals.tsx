import { api } from "@/convex/_generated/api";
import { NotificationBell } from "@/components/NotificationBell";
import RealtimeClock from "@/components/RealtimeClock";
import SearchPalette, { SearchButton } from "@/components/SearchPalette";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { initials } from "@/lib/format";
import { btnGhost } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { LogOut, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";

type Accent = "yellow" | "blue";

const ACCENT_BG: Record<Accent, string> = {
  yellow: "bg-neo-yellow",
  blue: "bg-neo-blue",
};

function Wordmark({ tag, accent }: { tag: string; accent: Accent }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-9 w-9 items-center justify-center border-2 border-foreground ${ACCENT_BG[accent]} text-white shadow-[3px_3px_0_0_var(--neo-ink)]`}>
        <span className="text-lg font-bold leading-none">W</span>
      </span>
      <div className="leading-none">
        <p className="text-base font-bold leading-tight tracking-tight">Wolf Society Esports</p>
        <p className="mt-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          {tag}
        </p>
      </div>
    </div>
  );
}

interface NavItem {
  to: string;
  label: string;
  end?: boolean;
}

function NavList({ items, accent }: { items: NavItem[]; accent: Accent }) {
  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              "border-2 border-transparent px-3 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors",
              isActive
                ? `border-foreground ${ACCENT_BG[accent]} text-white shadow-[3px_3px_0_0_var(--neo-ink)]`
                : "hover:border-foreground hover:bg-neo-cream",
            )
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

/** Shared sign-out — ends the Convex session and returns to the public site. */
function SignOutButton({ compact = false }: { compact?: boolean }) {
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
    <Button
      variant="outline"
      size={compact ? "icon" : "sm"}
      className={cn(btnGhost, compact ? "size-9 shrink-0" : "w-full")}
      onClick={handleSignOut}
      disabled={signingOut}
      title="Sign out"
      aria-label="Sign out"
    >
      <LogOut className={compact ? "size-4" : "size-3.5"} />
      {!compact && (signingOut ? "Signing out…" : "Sign out")}
    </Button>
  );
}

function UserCard() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col gap-3 border-t-2 border-foreground pt-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 rounded-none border-2 border-foreground bg-neo-cream">
          <AvatarFallback className="rounded-none font-mono text-xs font-bold">
            {initials(user?.name ?? user?.email ?? "?")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-bold">{user?.name ?? "Player"}</p>
          <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {user?.role === "superadmin" ? "Super Admin" : user?.email ?? ""}
          </p>
        </div>
      </div>
      <SignOutButton />
    </div>
  );
}

function PortalLayout({
  items,
  tag,
  banner,
  accent,
  variant,
}: {
  items: NavItem[];
  tag: string;
  banner?: React.ReactNode;
  accent: Accent;
  variant: "player" | "admin";
}) {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* One ⌘K palette per layout — buttons below just open it. */}
      <SearchPalette />
      {banner}
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className={`sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r-2 border-foreground bg-card px-5 py-6 lg:flex ${accent === "blue" ? "shadow-[inset_6px_0_0_0_var(--neo-blue)]" : "shadow-[inset_6px_0_0_0_var(--neo-yellow)]"}`}>
          <Wordmark tag={tag} accent={accent} />
          <div className="flex-1">
            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Navigation
            </p>
            <NavList items={items} accent={accent} />
          </div>
          <div className="mb-4 flex items-center gap-2">
            <SearchButton className="flex-1 justify-center" />
            <NotificationBell variant={variant} />
          </div>
          <RealtimeClock
            showDate={false}
            className="mb-4 border-2 border-foreground bg-background px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-widest"
          />
          <UserCard />
        </aside>

        <div className="min-w-0 flex-1">
          {/* Mobile header */}
          <header className="sticky top-0 z-40 border-b-2 border-foreground bg-card lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <Wordmark tag={tag} accent={accent} />
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden max-w-28 truncate font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground sm:block">
                  {user?.name ?? ""}
                </span>
                <NotificationBell variant={variant} />
                <SignOutButton compact />
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto border-t-2 border-foreground bg-background px-4 py-2">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "shrink-0 border-2 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                      isActive
                        ? `border-foreground ${ACCENT_BG[accent]} text-white`
                        : "border-foreground bg-card hover:bg-neo-cream",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/players", label: "Players" },
  { to: "/admin/teams", label: "Teams" },
  { to: "/admin/tournaments", label: "Tournaments" },
  { to: "/admin/matches", label: "Matches" },
  { to: "/admin/schedule", label: "Schedule Hub" },
  { to: "/admin/announcements", label: "Announcements" },
  { to: "/admin/content", label: "Content" },
  { to: "/admin/sponsors", label: "Sponsors" },
  { to: "/admin/donations", label: "Donations & Tryouts" },
  { to: "/admin/analytics", label: "Analytics" },
  { to: "/admin/automations", label: "Automations" },
  { to: "/admin/settings", label: "Settings" },
  { to: "/admin/inquiries", label: "Inquiries" },
  { to: "/grant", label: "Access" },
];

export function AdminLayout() {
  const { user } = useAuth();
  // The Staff directory (management team) is Super Admin only.
  const items =
    user?.role === "superadmin"
      ? [...ADMIN_NAV, { to: "/admin/staff", label: "Staff" }]
      : ADMIN_NAV;
  return (
    <PortalLayout
      items={items}
      tag="The Den · Management"
      accent="yellow"
      variant="admin"
      banner={
        <div className="flex items-center justify-center gap-2 border-b-2 border-foreground bg-neo-yellow px-4 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-wider text-white">
          <ShieldCheck className="size-3.5" />
          Management portal · The Den · Full organization control
        </div>
      }
    />
  );
}

const PLAYER_NAV: NavItem[] = [
  { to: "/player", label: "Dashboard", end: true },
  { to: "/player/schedule", label: "My Schedule" },
  { to: "/player/performance", label: "Performance" },
  { to: "/player/profile", label: "Profile" },
  { to: "/player/announcements", label: "Announcements" },
];

export function PlayerLayout() {
  const profile = useQuery(api.players.getMyProfile);
  const banner = profile ? (
    profile.status === "pending" ? (
      <div className="flex items-center justify-center gap-2 border-b-2 border-foreground bg-neo-blue px-4 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-wider text-white">
        Registration pending — management will review your profile
      </div>
    ) : profile.status === "suspended" ? (
      <div className="flex items-center justify-center gap-2 border-b-2 border-foreground bg-neo-red px-4 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-wider text-white">
        Account suspended — contact your Society manager
      </div>
    ) : null
  ) : null;
  return <PortalLayout items={PLAYER_NAV} tag="The Pack · Player hub" accent="blue" variant="player" banner={banner} />;
}
