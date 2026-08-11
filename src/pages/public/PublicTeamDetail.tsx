import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { NeoCard, StatusBadge } from "@/components/neo";
import { fmtDate } from "@/lib/format";
import { useQuery } from "convex/react";
import { Crown, Users } from "lucide-react";
import { Link, useParams } from "react-router";

export default function PublicTeamDetail() {
  const { teamId } = useParams<{ teamId: string }>();
  const data = useQuery(
    api.public.getTeam,
    teamId ? { teamId: teamId as Id<"teams"> } : "skip",
  );

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="h-40 animate-pulse border-2 border-foreground bg-card" />
      </div>
    );
  }

  const { team, players, captain } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link to="/teams" className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">
        ← All teams
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">{team.name}</h1>
            <span className="border-2 border-foreground bg-neo-yellow px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-white">
              {team.tag}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {team.game} · formed {fmtDate(team.createdAt)}
          </p>
        </div>
        <span className="flex items-center gap-2 border-2 border-foreground bg-card px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Users className="size-4" />
          {players.length} roster spots
        </span>
      </div>

      <NeoCard className="mt-8 gap-0 p-0">
        <div className="border-b-2 border-foreground px-5 py-4">
          <h2 className="font-bold">Roster</h2>
        </div>
        <div className="divide-y-2 divide-foreground/10">
          {players.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">
              This roster is still being finalized — player announcements are coming soon.
            </p>
          ) : (
            players.map((p) => (
              <div key={p._id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <div className="flex items-center gap-3">
                  {captain?._id === p._id ? (
                    <span className="flex h-8 w-8 items-center justify-center border-2 border-foreground bg-neo-yellow text-white" title="Captain">
                      <Crown className="size-4" />
                    </span>
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center border-2 border-foreground bg-neo-cream font-mono text-xs font-bold">
                      {p.gamertag.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <p className="font-bold">
                      {p.gamertag}
                      {captain?._id === p._id ? (
                        <span className="ml-2 align-middle">
                          <StatusBadge status="user">Captain</StatusBadge>
                        </span>
                      ) : null}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.inGameRole ?? "Flex"} · {p.region ?? "Worldwide"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="border-2 border-foreground bg-background px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {p.rank ?? "Unranked"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </NeoCard>
    </div>
  );
}
