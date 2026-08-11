import { api } from "@/convex/_generated/api";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { btnGhost, btnYellow } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { fmtDate, fmtPrize } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  CalendarClock,
  Crown,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { Link } from "react-router";

function useTournament() {
  const tournaments = useQuery(api.public.listTournaments);
  // Prefer a live tournament, otherwise the nearest upcoming one.
  const live = tournaments?.find((t) => t.status === "live");
  const upcoming = tournaments
    ?.filter((t) => t.status === "upcoming")
    .sort((a, b) => a.startDate - b.startDate)[0];
  return live ?? upcoming ?? tournaments?.[0] ?? undefined;
}

const FORMAT_STEPS = [
  {
    icon: Users,
    title: "Group Stage",
    detail: "4 groups of 8",
    body: "Seeded round-robin play. Every team fights for the top two spots in their group.",
  },
  {
    icon: Swords,
    title: "Knockout",
    detail: "Top 2 advance",
    body: "Group winners and runners-up cross into a single-elimination bracket.",
  },
  {
    icon: Crown,
    title: "Finals",
    detail: "Best of 5",
    body: "The last two standing clash in a best-of-five to crown the champion.",
  },
];

function BracketMatch({
  round,
  slot,
  a,
  b,
  status,
  scoreA,
  scoreB,
}: {
  round: string;
  slot: string;
  a: string;
  b: string;
  status: string;
  scoreA?: number | null;
  scoreB?: number | null;
}) {
  const done = status === "completed";
  const live = status === "live";
  const aWins = done && (scoreA ?? 0) > (scoreB ?? 0);
  const bWins = done && (scoreB ?? 0) > (scoreA ?? 0);
  return (
    <NeoCard className="gap-2 p-3">
      <div className="flex items-center justify-between gap-2 border-b-2 border-foreground/20 pb-2">
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          {round} · {slot}
        </p>
        <StatusBadge status={status} />
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-2 gap-y-1">
        <p className={cn("truncate text-sm font-bold", aWins && "underline decoration-2 decoration-neo-yellow")}>
          {a}
        </p>
        <span className="font-mono text-sm font-bold tabular-nums">
          {done || live ? (scoreA ?? 0) : "—"}
        </span>
        <p className={cn("truncate text-sm font-bold", bWins && "underline decoration-2 decoration-neo-yellow")}>
          {b}
        </p>
        <span className="font-mono text-sm font-bold tabular-nums">
          {done || live ? (scoreB ?? 0) : "—"}
        </span>
      </div>
    </NeoCard>
  );
}

export default function PublicBracket() {
  const tournaments = useQuery(api.public.listTournaments);
  const teams = useQuery(api.public.listTeams);
  const matches = useQuery(api.public.listMatches);
  const tournament = useTournament();

  const loading = tournaments === undefined || teams === undefined || matches === undefined;

  // Knockout ladder derived from real matches of the featured tournament.
  const tMatches =
    tournament && matches
      ? matches
          .filter((m) => m.tournamentId === tournament._id)
          .sort((x, y) => x.scheduledAt - y.scheduledAt)
      : [];
  const qf = [0, 1, 2, 3].map((i) => tMatches[i]);
  const sf = [4, 5].map((i) => tMatches[i]);
  const fin = tMatches[6];

  // Group-stage seeds — real rosters first, padded with TBD slots.
  const groupSeeds = Array.from({ length: 4 }, (_, g) =>
    Array.from({ length: 8 }, (_, s) => {
      const i = g * 8 + s;
      const team = teams?.[i];
      const isSociety = g === 0 && s === 0;
      return {
        seed: s + 1,
        name: isSociety ? "Wolf Society" : team?.name ?? `TBD · Seed ${s + 1}`,
        tag: isSociety ? "WSE" : team?.tag,
        real: Boolean(team) || isSociety,
      };
    }),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="Live Brackets"
        description="Official qualifiers, group stage and knockout brackets — updated in real time from the organization database."
      />

      <div className="mt-10">
        {loading ? (
          <div className="flex flex-col gap-6">
            <div className="h-44 animate-pulse border-2 border-foreground bg-card" />
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse border-2 border-foreground bg-card" />
              ))}
            </div>
            <div className="h-72 animate-pulse border-2 border-foreground bg-card" />
          </div>
        ) : !tournament ? (
          <EmptyState
            title="No tournament brackets yet"
            description="As soon as management books an event, its groups and knockout ladder will appear here live."
            action={
              <Link to="/tournaments">
                <span className={cn(btnGhost, "inline-flex items-center gap-2 px-4 py-2 text-sm font-bold")}>
                  <Trophy className="size-4" />
                  Browse tournaments
                </span>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            {/* Tournament header — mirrors the reference site's hero card */}
            <NeoCard className="relative gap-4 overflow-hidden p-6 sm:p-8">
              <span className="absolute right-4 top-4 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Official Qualifiers
              </span>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-purple text-white shadow-[3px_3px_0_0_var(--neo-ink)]">
                      <Trophy className="size-6" />
                    </span>
                    <div>
                      <p className="text-2xl font-bold tracking-tight sm:text-3xl">{tournament.name}</p>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {tournament.game}
                      </p>
                    </div>
                  </div>
                </div>
                <StatusBadge status={tournament.status} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="border-2 border-foreground bg-neo-cream px-4 py-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Prize pool
                  </p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums">{fmtPrize(tournament.prizePool)}</p>
                </div>
                <div className="border-2 border-foreground bg-neo-cream px-4 py-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Entries
                  </p>
                  <p className="mt-0.5 text-xl font-bold tabular-nums">32 Teams</p>
                </div>
                <div className="border-2 border-foreground bg-neo-cream px-4 py-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Dates
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold">
                    <CalendarClock className="size-4" />
                    {fmtDate(tournament.startDate)}
                    {tournament.endDate ? ` – ${fmtDate(tournament.endDate)}` : ""}
                  </p>
                </div>
              </div>
              {tournament.description ? (
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{tournament.description}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Link to="/matches">
                  <span className={cn(btnYellow, "inline-flex items-center gap-2 px-4 py-2 text-sm font-bold")}>
                    View match schedule
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
                <Link to="/teams">
                  <span className={cn(btnGhost, "inline-flex items-center gap-2 px-4 py-2 text-sm font-bold")}>
                    <Users className="size-4" />
                    Meet the rosters
                  </span>
                </Link>
              </div>
            </NeoCard>

            {/* Tournament format — mirrors the reference's format cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              {FORMAT_STEPS.map((step) => (
                <NeoCard key={step.title} className="gap-2 p-5">
                  <span className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-neo-blue text-white">
                    <step.icon className="size-5" />
                  </span>
                  <p className="text-lg font-bold tracking-tight">{step.title}</p>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {step.detail}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">{step.body}</p>
                </NeoCard>
              ))}
            </div>

            {/* Your team seed — mirrors "Your Team: Wolf Society · Seed #1 · Group A" */}
            <NeoCard className="flex flex-col gap-4 border-2 border-foreground bg-neo-purple p-6 text-white shadow-[6px_6px_0_0_var(--neo-ink)] sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-background text-foreground">
                  <Crown className="size-6" />
                </span>
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-white/70">
                    Your team
                  </p>
                  <p className="text-xl font-bold leading-tight">Wolf Society</p>
                </div>
              </div>
              <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-widest">
                <span className="border-2 border-foreground bg-background px-2 py-1 text-foreground">
                  Seed #1
                </span>
                <span className="border-2 border-foreground bg-background px-2 py-1 text-foreground">
                  Group A
                </span>
              </div>
            </NeoCard>

            {/* Group stage */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Users className="size-5" />
                <h2 className="text-2xl font-bold tracking-tight">Group Stage</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {groupSeeds.map((seeds, g) => (
                  <NeoCard key={g} className="gap-0 overflow-hidden p-0">
                    <div className="flex items-center justify-between border-b-2 border-foreground bg-foreground px-4 py-2">
                      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-background">
                        Group {String.fromCharCode(65 + g)}
                      </p>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-background/70">
                        Top 2 advance
                      </p>
                    </div>
                    <div className="grid gap-px bg-foreground/15">
                      {seeds.map((team) => (
                        <div
                          key={team.seed}
                          className={cn(
                            "flex items-center justify-between gap-2 px-4 py-2",
                            team.real ? "bg-card" : "bg-neo-cream/70",
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="font-mono text-[10px] font-bold text-muted-foreground">
                              #{team.seed}
                            </span>
                            <span className={cn("truncate text-sm font-bold", team.real ? "" : "text-muted-foreground")}>
                              {team.name}
                            </span>
                          </div>
                          {team.tag ? (
                            <span className="border-2 border-foreground bg-neo-yellow px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                              {team.tag}
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </NeoCard>
                ))}
              </div>
            </section>

            {/* Knockout ladder */}
            <section>
              <div className="mb-4 flex items-center gap-2">
                <Swords className="size-5" />
                <h2 className="text-2xl font-bold tracking-tight">Knockout Bracket</h2>
              </div>
              <NeoCard className="gap-0 overflow-x-auto p-5">
                <div className="grid min-w-[720px] grid-cols-3 items-start gap-4">
                  {/* Quarterfinals */}
                  <div className="flex flex-col gap-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Quarterfinals
                    </p>
                    {qf.map((m, i) =>
                      m ? (
                        <BracketMatch
                          key={m._id}
                          round="QF"
                          slot={String(i + 1)}
                          a={m.teamAName}
                          b={m.teamBName}
                          status={m.status}
                          scoreA={m.scoreA}
                          scoreB={m.scoreB}
                        />
                      ) : (
                        <BracketMatch
                          key={`qf-${i}`}
                          round="QF"
                          slot={String(i + 1)}
                          a={`Seed ${i * 2 + 1}`}
                          b={`Seed ${i * 2 + 2}`}
                          status="scheduled"
                        />
                      ),
                    )}
                  </div>
                  {/* Semifinals */}
                  <div className="flex flex-col gap-3 pt-10">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Semifinals
                    </p>
                    {sf.map((m, i) =>
                      m ? (
                        <BracketMatch
                          key={m._id}
                          round="SF"
                          slot={String(i + 1)}
                          a={m.teamAName}
                          b={m.teamBName}
                          status={m.status}
                          scoreA={m.scoreA}
                          scoreB={m.scoreB}
                        />
                      ) : (
                        <BracketMatch
                          key={`sf-${i}`}
                          round="SF"
                          slot={String(i + 1)}
                          a={`Winner QF${i * 2 + 1}`}
                          b={`Winner QF${i * 2 + 2}`}
                          status="scheduled"
                        />
                      ),
                    )}
                  </div>
                  {/* Final */}
                  <div className="flex flex-col gap-3 pt-24">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Grand Final
                    </p>
                    {fin ? (
                      <BracketMatch
                        round="Final"
                        slot="Bo5"
                        a={fin.teamAName}
                        b={fin.teamBName}
                        status={fin.status}
                        scoreA={fin.scoreA}
                        scoreB={fin.scoreB}
                      />
                    ) : (
                      <BracketMatch
                        round="Final"
                        slot="Bo5"
                        a="Winner SF1"
                        b="Winner SF2"
                        status="scheduled"
                      />
                    )}
                  </div>
                </div>
              </NeoCard>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
