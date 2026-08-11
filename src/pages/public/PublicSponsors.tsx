import { api } from "@/convex/_generated/api";
import { EmptyState, NeoCard, PageHeader } from "@/components/neo";
import { useQuery } from "convex/react";
import { ExternalLink, Handshake } from "lucide-react";

const TIER_META: Record<string, { label: string; color: string }> = {
  platinum: { label: "Platinum Partner", color: "bg-neo-purple text-white" },
  gold: { label: "Gold Partner", color: "bg-neo-yellow text-white" },
  silver: { label: "Silver Partner", color: "bg-neo-blue text-white" },
  partner: { label: "Community Partner", color: "bg-neo-cream text-foreground" },
};

export default function PublicSponsors() {
  const sponsors = useQuery(api.sponsors.list);

  const groups = (sponsors ?? []).reduce<Record<string, typeof sponsors>>((acc, s) => {
    (acc[s.tier] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="Sponsors & Partners"
        description="The brands that power the Society — partners are managed live from The Den and appear here instantly."
      />

      {!sponsors ? (
        <div className="mt-10 grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse border-2 border-foreground bg-card" />
          ))}
        </div>
      ) : sponsors.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="No sponsors announced yet"
            description="Partnership announcements will be showcased here."
            action={
              <a
                href="mailto:wolfsocietygg@yahoo.com?subject=Partnership%20with%20Wolf%20Society%20Esports"
                className="neo-press inline-flex items-center gap-2 border-2 border-foreground bg-neo-yellow px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--neo-ink)]"
              >
                <Handshake className="size-4" />
                Partner with us
              </a>
            }
          />
        </div>
      ) : (
        <div className="mt-10 flex flex-col gap-10">
          {["platinum", "gold", "silver", "partner"].map((tier) => {
            const list = groups[tier];
            if (!list || list.length === 0) return null;
            const meta = TIER_META[tier];
            return (
              <section key={tier} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-block h-3.5 w-3.5 border-2 border-foreground ${meta.color.split(" ")[0]}`} />
                  <h2 className="text-lg font-bold">{meta.label}</h2>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {list.length}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {list.map((s) => (
                    <NeoCard key={s._id} className="gap-2 p-6">
                      <p className="text-xl font-bold tracking-tight">{s.name}</p>
                      {s.description ? (
                        <p className="text-sm leading-6 text-muted-foreground">{s.description}</p>
                      ) : null}
                      {s.website ? (
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-neo-blue hover:underline"
                        >
                          Visit site
                          <ExternalLink className="size-3" />
                        </a>
                      ) : null}
                    </NeoCard>
                  ))}
                </div>
              </section>
            );
          })}

          <NeoCard className="gap-3 border-2 border-foreground bg-neo-cream p-6">
            <p className="font-bold">Want to partner with Wolf Society Esports?</p>
            <p className="text-sm leading-6 text-muted-foreground">
              We work with brands across gaming, hardware, apparel and more. Reach out at{" "}
              <a href="mailto:wolfsocietygg@yahoo.com" className="font-bold text-foreground hover:underline">
                wolfsocietygg@yahoo.com
              </a>{" "}
              and the team will get back to you.
            </p>
          </NeoCard>
        </div>
      )}
    </div>
  );
}
