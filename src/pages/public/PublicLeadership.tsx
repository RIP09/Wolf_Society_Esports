import { api } from "@/convex/_generated/api";
import { EmptyState, NeoCard, PageHeader } from "@/components/neo";
import { useQuery } from "convex/react";
import { ShieldCheck, Users } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Super Admin",
  admin: "Management",
};

export default function PublicLeadership() {
  const staff = useQuery(api.public.getStaff);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="Leadership"
        description="The people running the Society — every manager listed here holds real access in The Den."
      />

      <div className="mt-10">
        {!staff ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse border-2 border-foreground bg-card" />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <EmptyState
            title="Leadership not announced yet"
            description="Management profiles appear here automatically once the team is set up in The Den."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {staff.map((m, i) => (
              <NeoCard key={`${m.name}-${i}`} className="gap-4 p-6">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center border-2 border-foreground bg-neo-purple text-xl font-bold text-white shadow-[3px_3px_0_0_var(--neo-ink)]">
                    {(m.name ?? "?").slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-lg font-bold leading-tight">{m.name}</p>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {ROLE_LABELS[m.role ?? ""] ?? m.role}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 border-t-2 border-foreground/20 pt-3 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5 text-neo-green" />
                  Verified Wolf Society management
                </div>
              </NeoCard>
            ))}
          </div>
        )}
      </div>

      <NeoCard className="mt-10 flex items-center gap-4 bg-neo-cream p-6">
        <Users className="size-6 shrink-0" />
        <p className="text-sm leading-6 text-muted-foreground">
          Want to join the leadership team? Apply for management access through{" "}
          <a href="/auth/den" className="font-bold text-foreground hover:underline">
            The Den
          </a>{" "}
          — requests are reviewed by the organization.
        </p>
      </NeoCard>
    </div>
  );
}
