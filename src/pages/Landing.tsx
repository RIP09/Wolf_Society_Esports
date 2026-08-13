import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { NeoCard, StatusBadge } from "@/components/neo";
import { btnGhost, btnYellow, card } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { GAMES } from "@/lib/constants";
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

/** Snappy neobrutal reveal — springy, never soft. */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 140, damping: 18 },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

/** Animated counter that counts up when scrolled into view. */
function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 70, damping: 24, mass: 0.7 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());

  useEffect(() => {
    if (inView) mv.set(to);
  }, [inView, to, mv]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}

export default function Landing() {
  const data = useQuery(api.public.getHome);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="neo-grid-bg relative overflow-hidden">
        {/* Floating decorative blocks */}
        <motion.span
          aria-hidden
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 14 }}
          className="neo-float pointer-events-none absolute -right-6 top-10 hidden h-16 w-16 border-2 border-foreground bg-neo-orange lg:block"
        />
        <motion.span
          aria-hidden
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.75, type: "spring", stiffness: 200, damping: 14 }}
          className="neo-float pointer-events-none absolute right-24 bottom-16 hidden h-10 w-10 border-2 border-foreground bg-neo-blue lg:block"
          style={{ animationDelay: "-2.2s" }}
        />
        <motion.span
          aria-hidden
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: "spring", stiffness: 200, damping: 14 }}
          className="neo-float pointer-events-none absolute top-24 left-1/2 hidden h-6 w-6 border-2 border-foreground bg-neo-green xl:block"
          style={{ animationDelay: "-3.4s" }}
        />

        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pb-24 lg:pt-20">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.p
              variants={fadeUp}
              className="mb-4 inline-block border-2 border-foreground bg-neo-yellow px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_0_var(--neo-ink)]"
            >
              Wolf Society Esports
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
            >
              One Society.
              <br />
              Every game.
              <br />
              <span className="relative inline-block bg-neo-yellow px-2 text-white">
                Real results.
                <span className="absolute -bottom-1.5 left-0 h-1.5 w-full bg-neo-blue" />
              </span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg"
            >
              Wolf Society Esports is a competitive esports organization competing across
              the world's biggest titles. This page shows our live rosters, schedules and
              results — straight from the organization database, updated in real time.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
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
            </motion.div>
            <motion.p
              variants={fadeUp}
              className="mt-6 font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Players & management sign in to their portals above
            </motion.p>
          </motion.div>

          {/* Portal cards */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            transition={{ delayChildren: 0.3 }}
            className="flex flex-col gap-4"
          >
            <motion.div variants={fadeUp} whileHover={{ y: -4 }} whileTap={{ y: 0 }}>
              <Link
                to="/auth?returnTo=%2Fplayer%2Fregister"
                className={cn(card, "neo-press group flex items-center justify-between gap-4 p-6")}
              >
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
            </motion.div>
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4 }}
              whileTap={{ y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <Link
                to="/auth/den?returnTo=%2Fadmin"
                className={cn(
                  card,
                  "neo-press group flex items-center justify-between gap-4 bg-neo-yellow p-6 text-white",
                )}
              >
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
          </motion.div>
        </div>
      </section>

      {/* Game ticker marquee */}
      <div className="overflow-hidden border-y-2 border-foreground bg-neo-yellow py-2.5">
        <div className="neo-ticker flex w-max items-center whitespace-nowrap">
          {[...GAMES, ...GAMES].map((g, i) => (
            <span
              key={i}
              className="flex items-center gap-3 px-6 font-mono text-[11px] font-bold uppercase tracking-widest text-white"
            >
              <span className="inline-block h-1.5 w-1.5 border border-foreground bg-background" />
              {g}
            </span>
          ))}
        </div>
      </div>

      {/* Live stats */}
      <section className="border-b-2 border-foreground bg-foreground text-background">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 py-10 sm:px-6 lg:grid-cols-4"
        >
          {[
            [data?.counts.players ?? 0, "Active players"],
            [data?.counts.teams ?? 0, "Teams"],
            [data?.counts.tournaments ?? 0, "Tournaments"],
            [data?.counts.matches ?? 0, "Matches booked"],
          ].map(([v, l]) => (
            <motion.div
              key={String(l)}
              variants={fadeUp}
              className="flex flex-col items-center gap-1 px-4 py-3 text-center"
            >
              <CountUp
                to={v as number}
                className="text-4xl font-bold tracking-tight tabular-nums"
              />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-background/70">
                {l}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Featured teams */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="mb-8 flex items-end justify-between gap-4"
        >
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Our rosters
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Featured teams</h2>
          </div>
          <Link to="/teams" className="font-mono text-[11px] font-bold uppercase tracking-widest hover:text-neo-yellow">
            All teams →
          </Link>
        </motion.div>
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
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-4 md:grid-cols-3"
          >
            {data.featuredTeams.map((t) => (
              <motion.div key={t._id} variants={fadeUp} whileHover={{ y: -4 }} whileTap={{ y: 0 }}>
                <Link
                  to={`/teams/${t._id}`}
                  className={cn(card, "neo-press group flex h-full flex-col gap-3 p-6")}
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
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Upcoming matches + top performers */}
      <section className="border-y-2 border-foreground bg-neo-cream">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 110, damping: 18 }}
          className="mx-auto grid max-w-6xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-2"
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={fadeUp} className="mb-4 flex items-center gap-2">
              <CalendarClock className="size-5" />
              <h2 className="text-2xl font-bold tracking-tight">Upcoming fixtures</h2>
            </motion.div>
            <div className="flex flex-col gap-3">
              {!data ? (
                <motion.div variants={fadeUp} className="h-48 animate-pulse border-2 border-foreground bg-card" />
              ) : data.upcomingMatches.length === 0 ? (
                <motion.div variants={fadeUp}>
                  <NeoCard className="gap-1 p-6">
                    <p className="font-bold">No fixtures scheduled yet.</p>
                    <p className="text-sm text-muted-foreground">Check back soon — match days are posted in advance.</p>
                  </NeoCard>
                </motion.div>
              ) : (
                data.upcomingMatches.map((m) => (
                  <motion.div key={m._id} variants={fadeUp} whileHover={{ x: 6 }}>
                    <NeoCard className="gap-1 p-5">
                      <p className="text-base font-bold">
                        {m.teamAName} <span className="text-muted-foreground">vs</span> {m.teamBName}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {m.tournamentName ?? "Friendly"} · {m.map ?? "TBD"} · {fmtDateTime(m.scheduledAt)}
                      </p>
                    </NeoCard>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
          >
            <motion.div variants={fadeUp} className="mb-4 flex items-center gap-2">
              <Trophy className="size-5" />
              <h2 className="text-2xl font-bold tracking-tight">Top performers</h2>
            </motion.div>
            <motion.div variants={fadeUp} className="neo-shadow-none overflow-x-auto">
              <NeoCard className="gap-0 p-0">
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
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Latest news */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
          className="mb-8 flex items-end justify-between gap-4"
        >
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              From the organization
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Latest news</h2>
          </div>
          <Link to="/news" className="font-mono text-[11px] font-bold uppercase tracking-widest hover:text-neo-yellow">
            All news →
          </Link>
        </motion.div>
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
            data.announcements.map((a, i) => (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ type: "spring", stiffness: 130, damping: 18, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <NeoCard className="h-full gap-2 p-5">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.priority} />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="font-bold leading-snug">{a.title}</p>
                  <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{a.body}</p>
                </NeoCard>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          whileHover={{ scale: 1.01 }}
          className="relative border-2 border-foreground bg-neo-yellow p-8 text-white shadow-[8px_8px_0_0_var(--neo-ink)] sm:p-12"
        >
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
        </motion.div>
      </section>
    </div>
  );
}
