import { api } from "@/convex/_generated/api";
import { NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { fmtDateTime } from "@/lib/format";
import { useQuery } from "convex/react";
import { Award, Crown, Medal, Trophy, Users } from "lucide-react";
import { Link } from "react-router";

export default function PublicAchievements() {
  const home = useQuery(api.public.getHome);
  const tournaments = useQuery(api.public.listTournaments);

  const completed = (tournaments ?? []).filter((t) => t.status === "completed");
  const topPlayers = home?.topPlayers ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports · Hall of Fame"
        title="Achievements"
        description="Completed tournaments and the players who carried us through them — live from the organization database."
      />

      {/* Top performers podium */}
      <section className="mt-10">
        <div className="mb-5 flex items-center gap-2">
          <Crown className="size-5" />
          <h2 className="text-2xl font-bold tracking-tight">Top performers</h2>
        </div>
        {topPlayers.length === 0 ? (
          <NeoCard className="gap-1 p-6">
            <p className="font-bold">No performance data yet.</p>
            <p className="text-sm text-muted-foreground">
              Once players start logging matches, the leaders appear here automatically.
            </p>
          </NeoCard>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {topPlayers.slice(0, 6).map((p, i) => (
              <NeoCard key={p.gamertag} className="neo-press group gap-3 p-5">
                <div className="flex items-center justify-between">
                  <span
                    className={
                      i === 0
                        ? "flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-yellow text-white"
                        : "flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-cream"
                    }
                  >
                    {i === 0 ? <Crown className="size-5" /> : <Medal className="size-5" />}
                  </span>
                  <span className="font-mono text-3xl font-bold text-muted-foreground/30">
                    {i + 1}
                  </span>
                </div>
                <p className="text-lg font-bold leading-tight">{p.gamertag}</p>
                <div className="flex items-center justify-between border-t-2 border-foreground/20 pt-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {p.game}
                  </span>
                  <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5 font-mono text-[11px] font-bold tabular-nums">
                    K/D {p.kd}
                  </span>
                </div>
              </NeoCard>
            ))}
          </div>
        )}
      </section>

      {/* Completed tournaments */}
      <section className="mt-12">
        <div className="mb-5 flex items-center gap-2">
          <Trophy className="size-5" />
          <h2 className="text-2xl font-bold tracking-tight">Completed tournaments</h2>
        </div>
        {tournaments === undefined ? (
          <div className="grid gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : completed.length === 0 ? (
          <NeoCard className="gap-1 p-6">
            <p className="flex items-center gap-2 font-bold">
              <Award className="size-4" />
              No completed tournaments yet.
            </p>
            <p className="text-sm text-muted-foreground">
              The Society's trophy cabinet fills up as tournaments wrap up.
            </p>
            <Link to="/tournaments" className="mt-2 font-mono text-[11px] font-bold uppercase tracking-widest hover:text-neo-yellow">
              View tournaments →
            </Link>
          </NeoCard>
        ) : (
          <div className="flex flex-col gap-3">
            {completed.map((t) => (
              <NeoCard key={t._id} className="gap-3 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
                      <Trophy className="size-5" />
                    </span>
                    <div>
                      <p className="font-bold">{t.name}</p>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        {t.game}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="completed" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-foreground/20 pt-3">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <Users className="size-3.5" />
                    {t.matchCount} matches · {fmtDateTime(t.startDate)}
                  </span>
                  {t.prizePool ? (
                    <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5 font-mono text-[11px] font-bold">
                      ${t.prizePool.toLocaleString()} pool
                    </span>
                  ) : null}
                </div>
              </NeoCard>
            ))}
          </div>
        )}
      </section>

      {/* Note */}
      <p className="mt-10 border-2 border-dashed border-foreground/40 bg-card px-4 py-3 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        All achievements shown are real records from the Society's shared system
      </p>
    </div>
  );
}
