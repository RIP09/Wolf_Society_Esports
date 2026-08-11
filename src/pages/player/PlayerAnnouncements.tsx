import { api } from "@/convex/_generated/api";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { fmtDateTime } from "@/lib/format";
import { useQuery } from "convex/react";
import { Megaphone } from "lucide-react";

export default function PlayerAnnouncements() {
  const announcements = useQuery(api.announcements.list);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Wolf Society Esports · The Pack"
        title="Announcements"
        description="Schedule changes, roster locks and Society news — straight from the management desk."
      />

      {!announcements ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse border-2 border-foreground bg-card" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <EmptyState
          title="No announcements yet"
          description="When command posts updates, they show up here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <NeoCard key={a._id} className="gap-2 p-5">
              <div className="flex items-center gap-2">
                <StatusBadge status={a.priority} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {fmtDateTime(a.createdAt)}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Megaphone className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="text-base font-bold leading-snug">{a.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{a.body}</p>
                </div>
              </div>
            </NeoCard>
          ))}
        </div>
      )}
    </div>
  );
}
