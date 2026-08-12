import { api } from "@/convex/_generated/api";
import RealtimeClock from "@/components/RealtimeClock";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CookieConsent, openCookieSettings } from "@/components/CookieConsent";
import { PermissionCenter } from "@/components/PermissionCenter";
import { btnGhost, input } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { BellRing, Cookie, Crosshair, Heart, LogIn, Mail, ShieldCheck, Video } from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { toast } from "sonner";

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
  { to: "/bracket", label: "Bracket" },
  { to: "/matches", label: "Matches" },
  { to: "/schedule", label: "Schedule" },
  { to: "/players", label: "Players" },
  { to: "/news", label: "News" },
  { to: "/watch", label: "Watch" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
];

const FOOTER_LINKS: { to: string; label: string }[] = [
  { to: "/about", label: "About us" },
  { to: "/leadership", label: "Leadership" },
  { to: "/achievements", label: "Achievements" },
  { to: "/sponsors", label: "Sponsors" },
  { to: "/donate", label: "Donate" },
  { to: "/tryouts", label: "Tryouts" },
  { to: "/bracket", label: "Live bracket" },
  { to: "/gallery", label: "Gallery" },
  { to: "/faq", label: "FAQ" },
  { to: "/privacy", label: "Privacy policy" },
  { to: "/terms", label: "Terms of service" },
];

export function Wordmark({ tag = "Esports Organization" }: { tag?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)]">
        <span className="text-lg font-bold leading-none">W</span>
      </span>
      <div className="leading-none">
        <p className="text-base font-bold tracking-tight">Wolf Society Esports</p>
        <p className="font-mono text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
          {tag}
        </p>
      </div>
    </div>
  );
}

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b-2 border-foreground bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/">
            <Wordmark tag="Public Portal" />
          </NavLink>
          <div className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "border-2 border-transparent px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors",
                    isActive
                      ? "border-foreground bg-neo-yellow text-white"
                      : "hover:border-foreground hover:bg-neo-cream",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className={cn(btnGhost, "shrink-0")}>
                <LogIn className="size-4" />
                Sign in
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-none border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--neo-ink)]">
              <DropdownMenuLabel className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Wolf Society Esports
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer rounded-none">
                <NavLink to="/auth?returnTo=%2Fplayer%2Fregister">
                  <Crosshair className="size-4" />
                  Player portal — The Pack
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-none">
                <NavLink to="/auth/den?returnTo=%2Fadmin">
                  <ShieldCheck className="size-4" />
                  Management portal — The Den
                </NavLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* Mobile nav */}
        <div className="flex gap-2 overflow-x-auto border-t-2 border-foreground bg-background px-4 py-2 lg:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "shrink-0 border-2 px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider",
                  isActive
                    ? "border-foreground bg-neo-yellow text-white"
                    : "border-foreground bg-card hover:bg-neo-cream",
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <CookieConsent />
      <PermissionCenter />

      <footer className="border-t-2 border-foreground bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-start">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
            <div className="flex flex-col gap-3">
              <Wordmark tag="Public Portal" />
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
        <div className="border-t-2 border-foreground/20 px-4 py-4">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:px-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              © {new Date().getFullYear()} Wolf Society Esports · All data is managed live from The Den
            </p>
            <RealtimeClock className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground" />
          </div>
        </div>
      </footer>
    </div>
  );
}
