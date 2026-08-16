import { api } from "@/convex/_generated/api";
import { NeoCard } from "@/components/neo";
import { useVoterKey } from "@/hooks/use-voter-key";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  BarChart3,
  BrainCircuit,
  Crown,
  Crosshair,
  Gamepad2,
  LineChart,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router";

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 140, damping: 18 },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const STATIONS = [
  {
    to: "/fan-zone/polls",
    num: "FZ-01",
    title: "Polls",
    desc: "Cast your vote. Shape the squad.",
    icon: BarChart3,
    accent: "bg-neo-yellow",
  },
  {
    to: "/fan-zone/trivia",
    num: "FZ-02",
    title: "Trivia",
    desc: "Test your Wolf Society knowledge.",
    icon: BrainCircuit,
    accent: "bg-neo-blue",
  },
  {
    to: "/fan-zone/predictions",
    num: "FZ-03",
    title: "Predictions",
    desc: "Call match outcomes, earn points.",
    icon: LineChart,
    accent: "bg-neo-green",
  },
  {
    to: "/fan-zone/rankings",
    num: "FZ-04",
    title: "Rankings",
    desc: "Climb the Fan XP leaderboard.",
    icon: Trophy,
    accent: "bg-neo-orange",
  },
] as const;

/** Scrolling "//" ticker band — the True Rippers-style marquee. */
function TickerBand({ text, className }: { text: string; className?: string }) {
  const words = ["Wolf Society Esports", "Fan Zone", text, "Press Start"];
  const row = [...words, ...words, ...words];
  return (
    <div
      className={cn(
        "overflow-hidden border-y-2 border-foreground bg-neo-yellow py-2.5",
        className,
      )}
    >
      <div className="neo-ticker flex w-max items-center whitespace-nowrap">
        {row.map((w, i) => (
          <span
            key={i}
            className="flex items-center gap-4 px-4 font-mono text-[11px] font-bold uppercase tracking-widest text-white"
          >
            <span className="text-white/70">//</span>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function FanZone() {
  const voterKey = useVoterKey();
  const data = useQuery(api.fanZone.hub, { voterKey });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="neo-grid-bg relative overflow-hidden border-b-2 border-foreground bg-background text-foreground">
        <div className="pointer-events-none absolute -right-10 top-8 hidden h-24 w-24 border-2 border-foreground/40 bg-neo-yellow lg:block" />
        <div className="pointer-events-none absolute bottom-6 left-8 hidden h-12 w-12 border-2 border-foreground/40 bg-neo-blue lg:block" />
        <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6 lg:pb-20 lg:pt-24">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.p
              variants={fadeUp}
              className="mb-4 inline-block border-2 border-foreground bg-neo-yellow px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-white shadow-[3px_3px_0_0_var(--neo-ink)]"
            >
              Wolf Society Esports
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="text-6xl font-bold leading-[0.9] tracking-tight sm:text-7xl lg:text-8xl"
            >
              FAN
              <br />
              ZONE
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-xl text-base leading-7 text-foreground/70 sm:text-lg"
            >
              Vote in polls, answer trivia, predict match outcomes and climb the
              season leaderboard. Earn Fan XP for every play — the more you know,
              the higher you rank.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register?path=fan"
                className="neo-press inline-flex h-11 items-center gap-2 rounded-none border-2 border-foreground bg-neo-yellow px-6 font-mono text-[11px] font-bold uppercase tracking-widest text-white shadow-[4px_4px_0_0_var(--neo-ink)]"
              >
                <Crosshair className="size-4" />
                Sign in · Earn XP
              </Link>
              <Link
                to="/fan-zone/polls"
                className="neo-press inline-flex h-11 items-center gap-2 rounded-none border-2 border-foreground bg-card px-6 font-mono text-[11px] font-bold uppercase tracking-widest text-foreground shadow-[4px_4px_0_0_var(--neo-ink)]"
              >
                <Gamepad2 className="size-4" />
                Play as guest
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <TickerBand text="Vote · Predict · Play · Rank" />

      {/* Live stats */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Open polls", value: data?.openPolls ?? "—", icon: BarChart3, accent: "bg-neo-yellow" },
            { label: "Trivia questions", value: data?.triviaCount ?? "—", icon: BrainCircuit, accent: "bg-neo-blue" },
            { label: "Open predictions", value: data?.openPredictions ?? "—", icon: LineChart, accent: "bg-neo-green" },
            { label: "Your rank", value: data?.myRank ? `#${data.myRank}` : "—", icon: Crown, accent: "bg-neo-orange" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, type: "spring", stiffness: 130, damping: 18 }}
            >
              <NeoCard className="gap-1 px-5 py-4">
                <span className={cn("inline-flex h-9 w-9 items-center justify-center border-2 border-foreground text-white", s.accent)}>
                  <s.icon className="size-4" />
                </span>
                <p className="mt-2 text-3xl font-bold leading-tight tabular-nums">{s.value}</p>
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {s.label}
                </p>
              </NeoCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Choose your station */}
      <section className="border-y-2 border-foreground bg-neo-cream">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            className="mb-8"
          >
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Choose your station
            </p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Press Start ▸</h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {STATIONS.map((s) => (
              <motion.div key={s.num} variants={fadeUp} whileHover={{ y: -6 }} whileTap={{ y: 0 }}>
                <Link
                  to={s.to}
                  className={cn(
                    "neo-press group relative flex h-full min-h-52 flex-col gap-4 border-2 border-foreground bg-card p-5 shadow-[5px_5px_0_0_var(--neo-ink)]",
                  )}
                >
                  <span className="absolute right-4 top-4 font-mono text-[10px] font-bold tracking-widest text-muted-foreground">
                    {s.num}
                  </span>
                  <span className={cn("flex h-12 w-12 items-center justify-center border-2 border-foreground text-white shadow-[3px_3px_0_0_var(--neo-ink)]", s.accent)}>
                    <s.icon className="size-6" />
                  </span>
                  <div className="mt-auto">
                    <h3 className="text-2xl font-bold tracking-tight">{s.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{s.desc}</p>
                    <p className="mt-4 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-neo-yellow">
                      Press Start ▸
                    </p>
                  </div>
                  <span className="absolute inset-x-0 bottom-0 h-1.5 origin-left scale-x-0 bg-neo-yellow transition-transform duration-200 group-hover:scale-x-100" />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live activity + top fans */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 120, damping: 18 }}
        >
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Users className="size-5" />
            Live activity
          </h2>
          <NeoCard className="gap-0 p-0">
            {!data ? (
              <div className="h-56 animate-pulse" />
            ) : data.activity.length === 0 ? (
              <p className="px-5 py-10 text-sm text-muted-foreground">
                Nothing yet — be the first fan to vote, answer or predict!
              </p>
            ) : (
              <ul className="flex flex-col divide-y-2 divide-foreground/10">
                {data.activity.map((a, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className={cn("h-2 w-2 shrink-0 border border-foreground", ["bg-neo-yellow", "bg-neo-blue", "bg-neo-green"][i % 3])} />
                    <p className="text-sm leading-5">{a.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </NeoCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.1 }}
        >
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              <Trophy className="size-5" />
              Top fans
            </h2>
            <Link
              to="/fan-zone/rankings"
              className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-neo-yellow"
            >
              Full rankings →
            </Link>
          </div>
          <NeoCard className="gap-0 p-0">
            {!data ? (
              <div className="h-56 animate-pulse" />
            ) : data.rankedFans.length === 0 ? (
              <p className="px-5 py-10 text-sm text-muted-foreground">
                No ranked fans yet — sign in and claim your Fan profile to start earning XP.
              </p>
            ) : (
              <ul className="flex flex-col divide-y-2 divide-foreground/10">
                {data.rankedFans.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center border-2 border-foreground font-mono text-xs font-bold text-white",
                          i === 0 ? "bg-neo-gold" : i === 1 ? "bg-neo-blue" : i === 2 ? "bg-neo-orange" : "bg-foreground/20 text-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                      <p className="truncate font-bold">{f.name}</p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold tabular-nums">
                      {f.xp.toLocaleString()} XP
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </NeoCard>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          whileHover={{ scale: 1.01 }}
          className="relative border-2 border-foreground bg-neo-blue p-8 text-white shadow-[8px_8px_0_0_var(--neo-ink)] sm:p-12"
        >
          <div className="absolute -top-3 left-6 border-2 border-foreground bg-background px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-foreground">
            Fan contract
          </div>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Insert coin. Become a fan legend.
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
                Sign in, claim your Fan profile, and every poll vote, trivia answer
                and prediction pushes you up the Wolf Society rankings.
              </p>
            </div>
            <Link
              to="/register?path=fan"
              className="neo-press shrink-0 rounded-none border-2 border-foreground bg-neo-yellow px-8 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-white shadow-[4px_4px_0_0_var(--neo-ink)] hover:shadow-[5px_5px_0_0_var(--neo-ink)]"
            >
              <Crosshair className="mr-2 inline size-4" />
              Sign in · Earn XP
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
