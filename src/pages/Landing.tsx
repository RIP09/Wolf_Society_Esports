import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { NeoCard, StatusBadge } from "@/components/neo";
import { btnGhost, btnYellow, card } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { fmtDateTime } from "@/lib/format";
import {
  ArrowRight,
  CalendarClock,
  Crosshair,
  Gamepad2,
  Megaphone,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router";

export default function Landing() {
  const data = useQuery(api.public.getHome);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="neo-grid-bg relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pb-24 lg:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="mb-4 inline-block border-2 border-foreground bg-neo-yellow px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_0_var(--neo-ink)]">
              Wolf Society Esports
            </p>
            <h1 className="text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              One Society.
              <br />
              Every game.
              <br />
              <span className="relative inline-block bg-neo-yellow px-2 text-white">
                Real results.
                <span className="absolute -bottom-1.5 left-0 h-1.5 w-full bg-neo-blue" />
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
              Wolf Society Esports is a competitive esports organization competing across
              the world's biggest titles. This page shows our live rosters, schedules and
              results — straight from the organization database, updated in real time.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/teams">
                <Button className={cn(btnYellow, "h-11 px-6 text-sm")}>
                  <Users className="size-4" />
                  Meet the teams
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
              <Link to="/tournaments">
                <Button variant="outline" className={cn(btnGhost, "h-11 px-6 text-sm")}>
                  <Trophy className="size-4" />
                  Tournaments
                </Button>
              </Link>
            </div>
            <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Players & management sign in to their portals above
            </p>
          </motion.div>

          {/* Portal cards */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="flex flex-col gap-4"
          >
            <Link to="/auth?returnTo=%2Fplayer%2Fregister" className={cn(card, "neo-press group flex items-center justify-between gap-4 p-6")}>
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
                  <Crosshair className="size-6" />
                </span>
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Player portal
                  </p>
                  <p className="text-xl font-bold leading-tight">The Pack</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Register, log performance, track form
                  </p>
                </div>
              </div>
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/auth/den?returnTo=%2Fadmin" className={cn(card, "neo-press group flex items-center justify-between gap-4 bg-neo-yellow p-6 text-white")}>
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-background text-foreground">
                  <ShieldCheck className="size-6" />
                </span>
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/70">
                    Management portal
                  </p>
                  <p className="text-xl font-bold leading-tight">The Den</p>
                  <p className="mt-1 text-xs text-white/70">
                    Run rosters, events & analytics
                  </p>
                </div>
              </div>
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Live stats */}
      <section className="border-y-2 border-foreground bg-foreground text-background">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 py-10 sm:px-6 lg:grid-cols-4">
          {[
            [data?.counts.players ?? 0, "Active players"],
            [data?.counts.teams ?? 0, "Teams"],
            [data?.counts.tournaments ?? 0, "Tournaments"],
            [data?.counts.matches ?? 0, "Matches booked"],
          ].map(([v, l]) => (
            <div key={String(l)} className="flex flex-col items-center gap-1 px-4 py-3 text-center">
              <span className="text-4xl font-bold tracking-tight tabular-nums">{v}</span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-background/70">
                {l}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Featured teams */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Our rosters
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Featured teams</h2>
          </div>
          <Link to="/teams" className="font-mono text-[11px] font-bold uppercase tracking-widest hover:text-neo-yellow">
            All teams →
          </Link>
        </div>
        {!data ? (
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : data.featuredTeams.length === 0 ? (
          <NeoCard className="gap-1 p-6">
            <p className="font-bold">Rosters are being assembled.</p>
            <p className="text-sm text-muted-foreground">Team announcements land here as soon as they go live.</p>
          </NeoCard>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {data.featuredTeams.map((t) => (
              <Link
                key={t._id}
                to={`/teams/${t._id}`}
                className={cn(card, "neo-press group flex flex-col gap-3 p-6")}
              >
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold tracking-tight">{t.name}</p>
                  <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                    {t.tag}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{t.game}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{t.description ?? "Competing in the Society's colors."}</p>
                <div className="mt-auto flex items-center justify-between border-t-2 border-foreground/20 pt-3">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t.memberCount} members
                  </span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming matches + top performers */}
      <section className="border-y-2 border-foreground bg-neo-cream">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <CalendarClock className="size-5" />
              <h2 className="text-2xl font-bold tracking-tight">Upcoming fixtures</h2>
            </div>
            <div className="flex flex-col gap-3">
              {!data ? (
                <div className="h-48 animate-pulse border-2 border-foreground bg-card" />
              ) : data.upcomingMatches.length === 0 ? (
                <NeoCard className="gap-1 p-6">
                  <p className="font-bold">No fixtures scheduled yet.</p>
                  <p className="text-sm text-muted-foreground">Check back soon — match days are posted in advance.</p>
                </NeoCard>
              ) : (
                data.upcomingMatches.map((m) => (
                  <NeoCard key={m._id} className="gap-1 p-5">
                    <p className="text-base font-bold">
                      {m.teamAName} <span className="text-muted-foreground">vs</span> {m.teamBName}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {m.tournamentName ?? "Friendly"} · {m.map ?? "TBD"} · {fmtDateTime(m.scheduledAt)}
                    </p>
                  </NeoCard>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="size-5" />
              <h2 className="text-2xl font-bold tracking-tight">Top performers</h2>
            </div>
            <NeoCard className="gap-0 overflow-x-auto p-0">
              {!data ? (
                <div className="h-48 animate-pulse" />
              ) : data.topPlayers.length === 0 ? (
                <p className="px-5 py-8 text-sm text-muted-foreground">
                  Performance data appears once players start logging matches.
                </p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">
                        Player
                      </th>
                      <th className="border-2 border-foreground bg-foreground px-3 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">
                        Game
                      </th>
                      <th className="border-2 border-foreground bg-foreground px-3 py-2 text-right font-mono text-[10px] font-bold uppercase tracking-wider text-background">
                        K/D
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPlayers.map((p, i) => (
                      <tr key={p.gamertag} className="bg-card hover:bg-neo-yellow/10">
                        <td className="border-2 border-foreground/20 px-3 py-2.5">
                          <span className="mr-2 font-mono text-xs font-bold text-muted-foreground">{i + 1}</span>
                          <span className="font-bold">{p.gamertag}</span>
                        </td>
                        <td className="border-2 border-foreground/20 px-3 py-2.5 text-sm text-muted-foreground">{p.game}</td>
                        <td className="border-2 border-foreground/20 px-3 py-2.5 text-right font-mono font-bold tabular-nums">{p.kd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </NeoCard>
          </div>
        </div>
      </section>

      {/* Latest news */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              From the organization
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Latest news</h2>
          </div>
          <Link to="/news" className="font-mono text-[11px] font-bold uppercase tracking-widest hover:text-neo-yellow">
            All news →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {!data ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse border-2 border-foreground bg-card" />
            ))
          ) : data.announcements.length === 0 ? (
            <NeoCard className="gap-1 p-6 md:col-span-3">
              <p className="flex items-center gap-2 font-bold">
                <Megaphone className="size-4" />
                No news posted yet.
              </p>
              <p className="text-sm text-muted-foreground">Organization announcements will appear here.</p>
            </NeoCard>
          ) : (
            data.announcements.map((a) => (
              <NeoCard key={a._id} className="gap-2 p-5">
                <div className="flex items-center gap-2">
                  <StatusBadge status={a.priority} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="font-bold leading-snug">{a.title}</p>
                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{a.body}</p>
              </NeoCard>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="relative border-2 border-foreground bg-neo-yellow p-8 text-white shadow-[8px_8px_0_0_var(--neo-ink)] sm:p-12">
          <div className="absolute -top-3 left-6 border-2 border-foreground bg-background px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-foreground">
            Want to compete?
          </div>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Join the Pack.
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
                Register through the player portal, submit your profile and management will
                review your application. Every submission lands in The Den instantly.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/auth?returnTo=%2Fplayer%2Fregister">
                <Button className="neo-press h-12 rounded-none border-2 border-foreground bg-foreground px-8 text-sm font-bold text-background shadow-[4px_4px_0_0_var(--neo-ink)] hover:shadow-[5px_5px_0_0_var(--neo-ink)]">
                  <Gamepad2 className="size-4" />
                  Player portal
                </Button>
              </Link>
              <Link to="/contact">
                <Button className="neo-press h-12 rounded-none border-2 border-foreground bg-background px-8 text-sm font-bold text-foreground shadow-[4px_4px_0_0_var(--neo-ink)] hover:shadow-[5px_5px_0_0_var(--neo-ink)]">
                  Contact us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
