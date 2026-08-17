import { api } from "@/convex/_generated/api";
import RealtimeClock from "@/components/RealtimeClock";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CookieConsent } from "@/components/CookieConsent";
import { openCookieSettings } from "@/components/ConsentProvider";
import { MobileNav } from "@/components/MobileNav";
import { PermissionCenter } from "@/components/PermissionCenter";
import AIAssistant from "@/components/AIAssistant";
import SearchPalette, { SearchButton } from "@/components/SearchPalette";
import { getVisitorId } from "@/lib/visitor";
import { useAuth } from "@/hooks/use-auth";
import { analyticsAllowed } from "@/lib/consent";
import { ThemeToggle } from "@/components/ThemeToggle";
import { btnYellow, input } from "@/lib/neo";
import { WolfLogo, WolfMark } from "@/components/WolfLogo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { Activity, BellRing, ChevronDown, Cookie, Crosshair, Eye, Globe, Heart, LogIn, LogOut, Mail, Menu, Radio, ShieldCheck, UserRound, Users, Video } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { toast } from "sonner";

/**
 * Realtime presence heartbeat — pings the server on page load, on every route
 * change and every 30s so the live "online right now" counter stays current.
 */
function PresencePing() {
  const ping = useMutation(api.presence.ping);
  const location = useLocation();
  const visitorId = useRef<string | null>(null);

  useEffect(() => {
    // Respect the visitor's cookie choice — no presence pings without consent.
    if (!analyticsAllowed()) return;
    if (!visitorId.current) visitorId.current = getVisitorId();
    const send = () => {
      void ping({ visitorId: visitorId.current ?? undefined, path: location.pathname });
    };
    send();
    const timer = setInterval(send, 30_000);
    return () => clearInterval(timer);
  }, [ping, location.pathname]);

  return null;
}

/** Public alert signup — SMS + email notifications from Wolf Society Esports. */
function SubscribeForm() {
  const subscribe = useMutation(api.public.subscribe);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await subscribe({ email, phone: phone || undefined });
      toast.success("You're subscribed — check your phone and email for the confirmation.");
      setEmail("");
      setPhone("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="flex items-center gap-2 border-2 border-foreground bg-background px-3 py-2">
        <BellRing className="size-4 shrink-0 text-foreground" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
          Get SMS &amp; email alerts
        </span>
      </div>
      <div className="mt-2 grid gap-2">
        <input
          type="email"
          className={cn(input, "h-9 px-3 text-sm")}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="tel"
          className={cn(input, "h-9 px-3 text-sm")}
          placeholder="Phone (optional, for SMS)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          className="neo-press rounded-none border-2 border-foreground bg-neo-yellow px-3 py-1.5 text-xs font-bold text-white shadow-[2px_2px_0_0_var(--neo-ink)] hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
          disabled={submitting || !email.trim()}
        >
          {submitting ? "Subscribing…" : "Subscribe"}
        </Button>
      </div>
    </form>
  );
}

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/about", label: "About" },
  { to: "/teams", label: "Teams" },
  { to: "/tournaments", label: "Tournaments" },
  { to: "/fan-zone", label: "Fan Zone" },
  { to: "/matches", label: "Matches" },
  { to: "/schedule", label: "Schedule" },
  { to: "/players", label: "Players" },
  { to: "/news", label: "News" },
  { to: "/watch", label: "Watch" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
];

/** Direct desktop links — no dropdown, always visible. */
const NAV_LINKS = [
  { to: "/matches", label: "Matches" },
  { to: "/schedule", label: "Schedule" },
  { to: "/tournaments", label: "Tournaments" },
];

/** Desktop dropdown groups — True Rippers style, with chevrons. */
const NAV_DROPDOWNS: {
  label: string;
  items: { to: string; label: string; sep?: boolean }[];
}[] = [
  {
    label: "Teams",
    items: [
      { to: "/teams", label: "Our teams" },
      { to: "/players", label: "Players" },
      { to: "/bracket", label: "Bracket" },
    ],
  },
  {
    label: "News",
    items: [
      { to: "/news", label: "Latest news" },
      { to: "/watch", label: "Watch live" },
      { to: "/gallery", label: "Gallery" },
    ],
  },
  {
    label: "Fan Zone",
    items: [
      { to: "/fan-zone", label: "Overview" },
      { to: "/fan-zone/polls", label: "Polls" },
      { to: "/fan-zone/trivia", label: "Trivia" },
      { to: "/fan-zone/predictions", label: "Predictions" },
      { to: "/fan-zone/rankings", label: "Rankings" },
    ],
  },
  {
    label: "More",
    items: [
      { to: "/about", label: "About us" },
      { to: "/leadership", label: "Leadership" },
      { to: "/achievements", label: "Achievements" },
      { to: "/sponsors", label: "Sponsors" },
      { to: "/tryouts", label: "Tryouts" },
      { to: "/donate", label: "Support us" },
      { to: "/faq", label: "FAQ" },
      { to: "/contact", label: "Contact" },
      { to: "/privacy", label: "Privacy policy" },
      { sep: true, to: "", label: "" },
      { to: "/auth/den?returnTo=%2Fadmin", label: "The Den — management" },
    ],
  },
];

/** True when the current path is inside a dropdown group. */
function isGroupActive(items: { to: string; sep?: boolean }[], path: string) {
  return items.some((i) => !i.sep && i.to !== "" && path.startsWith(i.to));
}

const FOOTER_LINKS: { to: string; label: string }[] = [
  { to: "/about", label: "About us" },
  { to: "/leadership", label: "Leadership" },
  { to: "/achievements", label: "Achievements" },
  { to: "/sponsors", label: "Sponsors" },
  { to: "/donate", label: "Donate" },
  { to: "/tryouts", label: "Tryouts" },
  { to: "/fan-zone", label: "Fan Zone" },
  { to: "/fan-zone/polls", label: "Polls" },
  { to: "/fan-zone/trivia", label: "Trivia" },
  { to: "/fan-zone/predictions", label: "Predictions" },
  { to: "/fan-zone/rankings", label: "Rankings" },
  { to: "/gallery", label: "Gallery" },
  { to: "/faq", label: "FAQ" },
  { to: "/privacy", label: "Privacy policy" },
  { to: "/terms", label: "Terms of service" },
];

export function Wordmark({
  tag = "Esports Organization",
  logoUrl,
}: {
  tag?: string;
  logoUrl?: string;
}) {
  return <WolfLogo tag={tag} logoUrl={logoUrl} />;
}

/**
 * Realtime visitor counter for the footer — total / today / last 24h plus a
 * per-country breakdown. The data is auto-generated: each visitor's country is
 * detected automatically (free GeoIP) and every number is a live Convex
 * subscription, so it updates the moment a new visitor loads the site.
 */
function LiveVisitors() {
  const stats = useQuery(api.analytics.visitorStats);
  const online = useQuery(api.presence.onlineCount);
  const countries = stats?.topCountries ?? [];
  const max = Math.max(1, ...countries.map((c) => c.visitors));
  const loading = stats === undefined;

  return (
    <div className="border-2 border-foreground bg-background">
      <div className="flex items-center justify-between gap-2 border-b-2 border-foreground bg-neo-yellow px-4 py-2">
        <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
          <Globe className="size-3.5" />
          Live visitor count
        </p>
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          {loading ? "syncing…" : "realtime"}
        </span>
      </div>

      {/* Realtime presence — people on the site this very moment */}
      <div className="flex items-center justify-between gap-2 border-b-2 border-foreground bg-neo-blue px-4 py-2 text-white">
        <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest">
          <Radio className="size-3.5" />
          Online right now
        </p>
        <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          {online === undefined ? "counting…" : `${online.total} ${online.total === 1 ? "person" : "people"}`}
        </span>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 border-2 border-foreground bg-neo-cream p-3">
          <Users className="size-5 shrink-0" />
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Total visitors
            </p>
            <p className="text-xl font-bold leading-none">
              {loading ? "—" : stats!.totalVisitors.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-2 border-foreground bg-neo-cream p-3">
          <Activity className="size-5 shrink-0" />
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Today
            </p>
            <p className="text-xl font-bold leading-none">
              {loading ? "—" : stats!.todayVisitors.toLocaleString()} <span className="text-xs font-semibold text-muted-foreground">visitors</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-2 border-foreground bg-neo-cream p-3">
          <Eye className="size-5 shrink-0" />
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
              Pageviews · last 24h
            </p>
            <p className="text-xl font-bold leading-none">
              {loading ? "—" : stats!.viewsLast24h.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {!loading && countries.length > 0 && (
        <div className="border-t-2 border-foreground px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Where visitors come from
          </p>
          <ul className="mt-2 space-y-1.5">
            {countries.map((c) => (
              <li key={c.code || c.country} className="flex items-center gap-2 text-xs">
                <span className="w-28 truncate font-semibold">{c.country}</span>
                <div className="h-2 flex-1 border border-foreground bg-white">
                  <div
                    className="h-full bg-neo-blue"
                    style={{ width: `${Math.round((c.visitors / max) * 100)}%` }}
                  />
                </div>
                <span className="w-16 text-right font-mono text-[10px] text-muted-foreground">
                  {c.visitors.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Mobile hamburger footer — account / portal actions, bold and touch-sized. */
function MobileAccountActions() {
  const { isAuthenticated, signOut } = useAuth();
  const linkCls =
    "flex items-center gap-2 border-2 border-foreground bg-background px-3 py-2.5 text-sm font-bold uppercase tracking-wide transition-colors hover:bg-neo-cream";
  if (isAuthenticated) {
    return (
      <div className="flex flex-col gap-2">
        <Link to="/account" className={linkCls}>
          <UserRound className="size-4" /> My account
        </Link>
        <Link to="/player" className={linkCls}>
          <Crosshair className="size-4" /> Player portal — The Pack
        </Link>
        <Link to="/admin" className={linkCls}>
          <ShieldCheck className="size-4" /> Management portal — The Den
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className={`${linkCls} text-neo-red hover:bg-neo-red hover:text-white`}
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <Link to="/signin" className={`${linkCls} bg-neo-yellow text-white`}>
        <LogIn className="size-4" /> Sign in to your account
      </Link>
      <Link to="/register" className={linkCls}>
        <Crosshair className="size-4" /> Register — player or fan
      </Link>
      <Link to="/auth/den?returnTo=%2Fadmin" className={linkCls}>
        <ShieldCheck className="size-4" /> Management portal — The Den
      </Link>
    </div>
  );
}

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();
  const branding = useQuery(api.admin.getOrgBranding);
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* True Rippers-style brand lockup: mark | divider | stacked wordmark */}
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5">
            <WolfMark size={38} src={branding?.logoUrl} />
            <span aria-hidden className="hidden h-9 w-0.5 bg-foreground/25 sm:block" />
            <span className="leading-none">
              <span className="block text-[15px] font-bold uppercase leading-tight tracking-tight">
                Wolf Society
              </span>
              <span className="mt-1 block font-mono text-[9px] font-bold uppercase tracking-[0.35em] text-muted-foreground">
                Esports
              </span>
            </span>
          </NavLink>

          {/* Desktop nav — chevron dropdowns + direct links */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_DROPDOWNS.map((group) => (
              <DropdownMenu key={group.label}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1 border-b-2 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors",
                      isGroupActive(group.items, location.pathname)
                        ? "border-neo-yellow text-neo-yellow"
                        : "border-transparent hover:border-foreground hover:bg-neo-cream",
                    )}
                  >
                    {group.label}
                    <ChevronDown className="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-60 rounded-none border-2 border-foreground bg-card p-1 shadow-[4px_4px_0_0_var(--neo-ink)]"
                >
                  {group.items.map((item) =>
                    item.sep ? (
                      <DropdownMenuSeparator key="sep" className="bg-foreground/20" />
                    ) : (
                      <DropdownMenuItem
                        key={item.label}
                        asChild
                        className="cursor-pointer rounded-none focus:bg-neo-yellow focus:text-white"
                      >
                        <NavLink to={item.to}>
                          <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                            {item.label}
                          </span>
                        </NavLink>
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
            {NAV_LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "border-b-2 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors",
                    isActive
                      ? "border-neo-yellow text-neo-yellow"
                      : "border-transparent hover:border-foreground hover:bg-neo-cream",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions — search, theme, SIGN IN, JOIN */}
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle compact />
            <SearchButton />
            {isAuthenticated ? (
              <NavLink
                to="/account"
                className="hidden items-center gap-1.5 border-2 border-foreground bg-card px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider shadow-[2px_2px_0_0_var(--neo-ink)] transition-all hover:shadow-[3px_3px_0_0_var(--neo-ink)] sm:flex"
              >
                <UserRound className="size-4" />
                Account
              </NavLink>
            ) : (
              <NavLink
                to="/signin"
                className="hidden items-center gap-1.5 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground sm:flex"
              >
                <LogIn className="size-4" />
                Sign in
              </NavLink>
            )}
            <Link to="/register">
              <Button
                className={cn(
                  btnYellow,
                  "neo-press h-10 rounded-none border-2 border-foreground px-5 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0_0_var(--neo-ink)]",
                )}
              >
                Join
              </Button>
            </Link>
          </div>
        </div>
        {/* Mobile nav — hamburger menu */}
        <div className="flex items-center justify-between gap-2 border-t-2 border-foreground bg-background px-4 py-2 lg:hidden">
          <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Menu className="size-3.5" />
            Menu
          </p>
          <MobileNav items={NAV} footer={<MobileAccountActions />} />
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <CookieConsent />
      <PermissionCenter />
      <AIAssistant />
      <PresencePing />
      <SearchPalette />

      <footer className="border-t-2 border-foreground bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
            <div className="flex flex-col gap-3">
              <Wordmark tag="Public Portal" logoUrl={branding?.logoUrl} />
              <p className="max-w-sm text-xs leading-5 text-muted-foreground">
                Wolf Society Esports is a competitive esports organization. Rosters,
                schedules and results shown here are live from the organization database.
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="size-3.5" />
                <a href="mailto:wolfsocietygg@yahoo.com" className="hover:text-foreground">
                  wolfsocietygg@yahoo.com
                </a>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Heart className="size-3.5" />
                <NavLink to="/donate" className="hover:text-foreground">
                  Support the Society
                </NavLink>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Video className="size-3.5" />
                <NavLink to="/watch" className="hover:text-foreground">
                  Watch live
                </NavLink>
              </div>
            </div>
            <div className="grid max-w-xs grid-cols-2 gap-x-6 gap-y-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {FOOTER_LINKS.map((item) => (
                <NavLink key={item.to} to={item.to} className="hover:text-foreground">
                  {item.label}
                </NavLink>
              ))}
              <button
                type="button"
                onClick={openCookieSettings}
                className="flex items-center gap-1.5 text-left hover:text-foreground"
              >
                <Cookie className="size-3" />
                Cookie settings
              </button>
            </div>
          </div>
          <SubscribeForm />
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <LiveVisitors />
        </div>
        <div className="border-t-2 border-foreground/20 px-4 py-4">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:px-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              © {new Date().getFullYear()} Wolf Society Esports · All data is managed live from The Den
            </p>
            <p className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <ShieldCheck className="size-3.5 text-neo-blue" />
              Fully compliant with the PROGA Act 2025–2026
            </p>
            <RealtimeClock className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground" />
          </div>
        </div>
      </footer>
    </div>
  );
}
