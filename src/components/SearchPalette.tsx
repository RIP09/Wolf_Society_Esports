import { api } from "@/convex/_generated/api";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useQuery } from "convex/react";
import {
  Crosshair,
  Globe,
  Megaphone,
  Search,
  ShieldCheck,
  Swords,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

const OPEN_EVENT = "wse:open-search";

/** Opens the palette from anywhere (used by the visible search buttons). */
export function openSearch() {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

const PAGE_LINKS: { to: string; label: string; group: string }[] = [
  { to: "/", label: "Home", group: "Pages" },
  { to: "/about", label: "About us", group: "Pages" },
  { to: "/register", label: "Register", group: "Pages" },
  { to: "/signin", label: "Sign in", group: "Pages" },
  { to: "/fan-zone", label: "Fan Zone", group: "Pages" },
  { to: "/fan-zone/polls", label: "Fan Zone — Polls", group: "Pages" },
  { to: "/fan-zone/trivia", label: "Fan Zone — Trivia", group: "Pages" },
  { to: "/fan-zone/predictions", label: "Fan Zone — Predictions", group: "Pages" },
  { to: "/fan-zone/rankings", label: "Fan Zone — Rankings", group: "Pages" },
  { to: "/teams", label: "Teams", group: "Pages" },
  { to: "/tournaments", label: "Tournaments", group: "Pages" },
  { to: "/bracket", label: "Live bracket", group: "Pages" },
  { to: "/matches", label: "Matches", group: "Pages" },
  { to: "/schedule", label: "Schedule", group: "Pages" },
  { to: "/players", label: "Players", group: "Pages" },
  { to: "/news", label: "News", group: "Pages" },
  { to: "/watch", label: "Watch live", group: "Pages" },
  { to: "/tryouts", label: "Tryouts", group: "Pages" },
  { to: "/sponsors", label: "Sponsors", group: "Pages" },
  { to: "/gallery", label: "Gallery", group: "Pages" },
  { to: "/faq", label: "FAQ", group: "Pages" },
  { to: "/contact", label: "Contact us", group: "Pages" },
  { to: "/account", label: "My account", group: "Portals & account" },
  {
    to: "/auth?returnTo=%2Fplayer%2Fregister",
    label: "Player portal — The Pack",
    group: "Portals & account",
  },
  {
    to: "/auth/den?returnTo=%2Fadmin",
    label: "Management portal — The Den",
    group: "Portals & account",
  },
];

/**
 * Site-wide quick search (⌘K / Ctrl+K). Finds players, teams, news and pages
 * from the live database and jumps straight to them. Mount once per layout —
 * visible search buttons call `openSearch()`.
 */
export default function SearchPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const players = useQuery(api.public.listPlayers);
  const teams = useQuery(api.public.listTeams);
  const announcements = useQuery(api.public.listAnnouncements);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    document.addEventListener("keydown", down);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const go = (to: string) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Quick search"
      description="Jump anywhere in Wolf Society Esports"
      className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]"
    >
      <CommandInput placeholder="Search players, teams, news or pages…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          {PAGE_LINKS.filter((p) => p.group === "Pages").map((p) => (
            <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)}>
              <Globe className="size-4" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Portals & account">
          {PAGE_LINKS.filter((p) => p.group !== "Pages").map((p) => (
            <CommandItem key={p.to} value={p.label} onSelect={() => go(p.to)}>
              <ShieldCheck className="size-4" />
              {p.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {teams && teams.length > 0 ? (
          <CommandGroup heading="Teams">
            {teams.slice(0, 10).map((t) => (
              <CommandItem
                key={t._id}
                value={`${t.name} ${t.tag} ${t.game}`}
                onSelect={() => go(`/teams/${t._id}`)}
              >
                <Swords className="size-4" />
                {t.name}
                <span className="text-muted-foreground">
                  · {t.game} · {t.memberCount} members
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {players && players.length > 0 ? (
          <CommandGroup heading="Players">
            {players.slice(0, 10).map((p) => (
              <CommandItem
                key={p._id}
                value={`${p.gamertag} ${p.realName} ${p.game} ${p.rank ?? ""}`}
                onSelect={() => go("/players")}
              >
                <Crosshair className="size-4" />
                {p.gamertag}
                <span className="text-muted-foreground">
                  · {p.game} · {p.rank ?? "Unranked"}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {announcements && announcements.length > 0 ? (
          <CommandGroup heading="Announcements">
            {announcements.slice(0, 6).map((a) => (
              <CommandItem key={a._id} value={a.title} onSelect={() => go("/news")}>
                <Megaphone className="size-4" />
                {a.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}

/** Compact neo-brutalist search button for headers — opens the palette. */
export function SearchButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Search (⌘K)"
      title="Search (⌘K)"
      onClick={() => openSearch()}
      className={`flex cursor-pointer items-center gap-2 border-2 border-foreground bg-background px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground shadow-[2px_2px_0_0_var(--neo-ink)] transition-shadow hover:bg-neo-cream hover:shadow-[3px_3px_0_0_var(--neo-ink)] ${className}`}
    >
      <Search className="size-3.5" />
      <span className="hidden sm:inline">Search</span>
      <kbd className="hidden border-2 border-foreground bg-neo-cream px-1 font-mono text-[9px] sm:inline">
        ⌘K
      </kbd>
    </button>
  );
}
