import { api } from "@/convex/_generated/api";
import { EmptyState, NeoCard, PageHeader } from "@/components/neo";
import { card } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { Crosshair } from "lucide-react";

export default function PublicPlayers() {
  const players = useQuery(api.public.listPlayers);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="The roster"
        description="Approved members of the Society. Only approved players are listed here — suspensions reflect instantly."
      />
      <div className="mt-10">
        {!players ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : players.length === 0 ? (
          <EmptyState
            title="No players listed yet"
            description="Approved players will appear here as the Society grows."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {players.map((p) => (
              <div key={p._id} className={cn(card, "flex items-center gap-4 p-5")}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
                  <span className="text-lg font-bold">{p.gamertag.slice(0, 1).toUpperCase()}</span>
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold">{p.gamertag}</p>
                  <p className="text-xs text-muted-foreground">{p.game}</p>
                  <p className="mt-0.5 flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Crosshair className="size-3" />
                    {p.inGameRole ?? "Flex"} · {p.rank ?? "Unranked"} · {p.region ?? "Worldwide"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
