import { api } from "@/convex/_generated/api";
import { EmptyState, NeoCard, PageHeader } from "@/components/neo";
import { card } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router";

export default function PublicTeams() {
  const teams = useQuery(api.public.listTeams);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="Our teams"
        description="Every competitive roster in the Society. Rosters are managed live from The Den — updates appear here instantly."
      />
      <div className="mt-10">
        {!teams ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <EmptyState
            title="No teams announced yet"
            description="Team pages go live as soon as management builds the rosters."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <Link
                key={t._id}
                to={`/teams/${t._id}`}
                className={cn(card, "neo-press group flex flex-col gap-3 p-6")}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xl font-bold tracking-tight">{t.name}</p>
                  <span className="border-2 border-foreground bg-neo-yellow px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                    {t.tag}
                  </span>
                </div>
                <p className="text-sm font-medium text-muted-foreground">{t.game}</p>
                <p className="line-clamp-3 flex-1 text-xs leading-5 text-muted-foreground">
                  {t.description ?? "Competing in the Society's colors."}
                </p>
                <div className="mt-auto flex items-center justify-between border-t-2 border-foreground/20 pt-3">
                  <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Users className="size-3.5" />
                    {t.memberCount} members
                  </span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
