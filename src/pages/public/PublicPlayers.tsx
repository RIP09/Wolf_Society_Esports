import { api } from "@/convex/_generated/api";
import { EmptyState, PageHeader } from "@/components/neo";
import { card } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { Crosshair, ImageOff } from "lucide-react";

export default function PublicPlayers() {
  const players = useQuery(api.public.listPlayers);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="The roster"
        description="Approved members of the Society. Only approved players are listed here — photos are attached from The Den and suspensions reflect instantly."
      />
      <div className="mt-10">
        {!players ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse border-2 border-foreground bg-card" />
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
              <div key={p._id} className={cn(card, "group flex flex-col gap-3 p-0")}>
                <div className="relative h-44 overflow-hidden border-b-2 border-foreground bg-neo-cream">
                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      alt={p.gamertag}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="flex h-20 w-20 items-center justify-center border-2 border-foreground bg-neo-yellow text-white shadow-[4px_4px_0_0_var(--neo-ink)]">
                        <span className="text-3xl font-bold">
                          {p.gamertag.slice(0, 1).toUpperCase()}
                        </span>
                      </span>
                    </div>
                  )}
                  <span className="absolute left-3 top-3 border-2 border-foreground bg-background px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {p.game}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 px-5 pb-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-lg font-bold leading-tight">{p.gamertag}</p>
                    <span className="shrink-0 border-2 border-foreground bg-neo-yellow px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                      {p.rank ?? "Unranked"}
                    </span>
                  </div>
                  <p className="flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <Crosshair className="size-3" />
                    {p.inGameRole ?? "Flex"} · {p.region ?? "Worldwide"}
                  </p>
                  {p.bio ? (
                    <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{p.bio}</p>
                  ) : null}
                  <p className="mt-auto flex items-center gap-1.5 border-t-2 border-foreground/20 pt-2.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    <ImageOff className="size-3" />
                    {p.photoUrl ? "Photo from The Den" : "Photo pending"}
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
