import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EmptyState, NeoCard, StatusBadge } from "@/components/neo";
import { btnYellow } from "@/lib/neo";
import { useQuery } from "convex/react";
import { CalendarClock, Swords } from "lucide-react";
import { Link } from "react-router";

export default function PublicSchedule() {
  const scrims = useQuery(api.schedules.listPublicScrims);
  const now = Date.now();

  const upcoming = (scrims ?? []).filter((s) => s.status === "confirmed" && s.scheduledAt >= now);
  const results = (scrims ?? []).filter((s) => s.status === "completed").slice(0, 12);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-4">
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Wolf Society Esports · Live schedule
        </p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Schedule &amp; scrims</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Every slot and result below is streamed live from the organization database — when
          management confirms a scrim or logs a result in The Den, it appears here instantly.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <CalendarClock className="size-5" />
          Upcoming scrims
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState
            title="No confirmed scrims right now"
            description="Slots get published the moment they're confirmed. Want to test yourselves against the Society?"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((s) => (
              <NeoCard key={s._id} className="gap-0 p-0">
                <div className="flex items-center justify-between gap-2 border-b-2 border-foreground px-4 py-3">
                  <p className="font-bold">{s.opponentName}</p>
                  <StatusBadge status="confirmed">confirmed</StatusBadge>
                </div>
                <div className="flex flex-col gap-2 px-4 py-3">
                  <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {s.title}
                  </p>
                  <p className="text-sm font-bold">
                    {new Date(s.scheduledAt).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.game} · {s.format ?? "TBD"} · {s.teamName ?? "Open roster"}
                  </p>
                </div>
              </NeoCard>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Swords className="size-5" />
          Recent results
        </h2>
        {results.length === 0 ? (
          <EmptyState
            title="No results logged yet"
            description="Scrim results are published here the moment management logs them in The Den."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((s) => (
              <NeoCard key={s._id} className="gap-0 p-0">
                <div className="flex items-center justify-between gap-2 border-b-2 border-foreground px-4 py-3">
                  <p className="font-bold">{s.opponentName}</p>
                  <StatusBadge status={s.result ?? "completed"} />
                </div>
                <div className="flex flex-col gap-2 px-4 py-3">
                  <p className="text-2xl font-bold tabular-nums">
                    {s.scoreUs ?? "–"}<span className="text-muted-foreground">–</span>{s.scoreThem ?? "–"}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {s.game} · {s.format ?? "TBD"} · {new Date(s.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  {s.vodUrl ? (
                    <a href={s.vodUrl} target="_blank" rel="noreferrer" className="font-mono text-[10px] font-bold uppercase tracking-wider underline">
                      Watch the VOD →
                    </a>
                  ) : null}
                </div>
              </NeoCard>
            ))}
          </div>
        )}
      </section>

      <NeoCard className="flex flex-col items-start justify-between gap-4 bg-neo-cream p-6 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl font-bold">Want to scrim the Society?</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            We're always looking for strong practice partners across every title. Send us a
            message with your team, region and preferred format.
          </p>
        </div>
        <Link to="/contact">
          <Button className={btnYellow}>Challenge us</Button>
        </Link>
      </NeoCard>
    </div>
  );
}
