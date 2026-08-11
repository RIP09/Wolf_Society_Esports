import { api } from "@/convex/_generated/api";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { fmtDateTime } from "@/lib/format";
import { useQuery } from "convex/react";

export default function PublicMatches() {
  const matches = useQuery(api.public.listMatches);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="Matches"
        description="Fixtures, live games and locked-in results — synced straight from the organization schedule."
      />
      <div className="mt-10">
        {!matches ? (
          <div className="h-64 animate-pulse border-2 border-foreground bg-card" />
        ) : matches.length === 0 ? (
          <EmptyState
            title="No matches yet"
            description="The first fixtures of the season will appear here soon."
          />
        ) : (
          <NeoCard className="gap-0 overflow-x-auto p-0">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">
                    Fixture
                  </th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">
                    Event
                  </th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">
                    Map
                  </th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2.5 text-left font-mono text-[10px] font-bold uppercase tracking-wider text-background">
                    Kickoff
                  </th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2.5 text-right font-mono text-[10px] font-bold uppercase tracking-wider text-background">
                    Score
                  </th>
                  <th className="border-2 border-foreground bg-foreground px-3 py-2.5 text-right font-mono text-[10px] font-bold uppercase tracking-wider text-background">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => {
                  const winnerIsA = m.winnerId === m.teamAId;
                  return (
                    <tr key={m._id} className="bg-card hover:bg-neo-yellow/10">
                      <td className="border-2 border-foreground/20 px-3 py-3">
                        <p className="font-bold">
                          <span className={m.winnerId === m.teamAId ? "underline decoration-2 decoration-neo-yellow" : ""}>
                            {m.teamAName}
                          </span>{" "}
                          <span className="text-muted-foreground">vs</span>{" "}
                          <span className={m.winnerId === m.teamBId ? "underline decoration-2 decoration-neo-yellow" : ""}>
                            {m.teamBName}
                          </span>
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          {winnerIsA ? "Team A wins" : m.winnerId === m.teamBId ? "Team B wins" : ""}
                        </p>
                      </td>
                      <td className="border-2 border-foreground/20 px-3 py-3 text-sm text-muted-foreground">
                        {m.tournamentName ?? "Friendly"}
                      </td>
                      <td className="border-2 border-foreground/20 px-3 py-3 font-mono text-xs">{m.map ?? "—"}</td>
                      <td className="border-2 border-foreground/20 px-3 py-3 text-sm text-muted-foreground">
                        {fmtDateTime(m.scheduledAt)}
                      </td>
                      <td className="border-2 border-foreground/20 px-3 py-3 text-right font-mono font-bold tabular-nums">
                        {m.status === "completed" ? `${m.scoreA ?? 0} – ${m.scoreB ?? 0}` : "—"}
                      </td>
                      <td className="border-2 border-foreground/20 px-3 py-3 text-right">
                        <StatusBadge status={m.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </NeoCard>
        )}
      </div>
    </div>
  );
}
