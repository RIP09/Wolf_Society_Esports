import { api } from "@/convex/_generated/api";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { fmtDate, fmtPrize } from "@/lib/format";
import { useQuery } from "convex/react";
import { Trophy } from "lucide-react";

export default function PublicTournaments() {
  const tournaments = useQuery(api.public.listTournaments);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="Tournaments"
        description="The events we compete in — upcoming, live and completed, tracked in real time."
      />
      <div className="mt-10">
        {!tournaments ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <EmptyState
            title="No tournaments announced"
            description="Event announcements appear here once management books them."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {tournaments.map((t) => (
              <NeoCard key={t._id} className="gap-3 p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
                      <Trophy className="size-5" />
                    </span>
                    <div>
                      <p className="text-lg font-bold leading-tight">{t.name}</p>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {t.game}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
                {t.description ? (
                  <p className="text-sm leading-6 text-muted-foreground">{t.description}</p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-foreground/20 pt-3 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>{fmtDate(t.startDate)}{t.endDate ? ` → ${fmtDate(t.endDate)}` : ""}</span>
                  <span>{t.matchCount} matches</span>
                  <span className="text-foreground">{fmtPrize(t.prizePool)} prize pool</span>
                </div>
              </NeoCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
