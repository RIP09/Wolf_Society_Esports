import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { fmtRelative } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, HandCoins, Swords, XCircle } from "lucide-react";
import { toast } from "sonner";

function money(amount: number, currency: string): string {
  const major = amount / 100;
  return `${currency.toUpperCase()} ${major.toLocaleString(currency === "inr" ? "en-IN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminDonations() {
  const donations = useQuery(api.payments.listDonations);
  const tryouts = useQuery(api.payments.listTryouts);
  const setTryoutStatus = useMutation(api.payments.setTryoutStatus);

  const pendingTryouts = (tryouts ?? []).filter((t) => t.status === "pending");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Revenue & recruitment"
        title="Donations & tryouts"
        description="Every donation and tryout registration from the public portal — live from the database."
      />

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <HandCoins className="size-5" />
          <h2 className="font-bold">Donations ({donations?.length ?? 0})</h2>
        </div>
        {!donations ? (
          <div className="h-24 animate-pulse border-2 border-foreground bg-card" />
        ) : donations.length === 0 ? (
          <EmptyState
            title="No donations yet"
            description="Donations from the public donate page appear here as they come in."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {donations.map((d) => (
              <NeoCard key={d._id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-bold">{d.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {d.email} · {fmtRelative(d.createdAt)}
                  </p>
                  {d.note ? <p className="mt-1 text-xs text-muted-foreground">“{d.note}”</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5 font-mono text-xs font-bold tabular-nums">
                    {money(d.amount, d.currency)}
                  </span>
                  <StatusBadge status={d.status === "paid" ? "approved" : "pending"}>{d.status}</StatusBadge>
                </div>
              </NeoCard>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Swords className="size-5" />
          <h2 className="font-bold">
            Tryouts ({tryouts?.length ?? 0})
            {pendingTryouts.length > 0 ? (
              <span className="ml-2 border-2 border-foreground bg-neo-yellow px-2 py-0.5 font-mono text-[10px] font-bold text-white">
                {pendingTryouts.length} to review
              </span>
            ) : null}
          </h2>
        </div>
        {!tryouts ? (
          <div className="h-24 animate-pulse border-2 border-foreground bg-card" />
        ) : tryouts.length === 0 ? (
          <EmptyState
            title="No tryouts yet"
            description="Public tryout registrations appear here for the coaching staff to review."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {tryouts.map((t) => (
              <NeoCard key={t._id} className="gap-3 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">{t.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t.email} · {fmtRelative(t.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={t.status === "approved" ? "approved" : t.status === "rejected" ? "rejected" : "pending"}>
                      {t.status}
                    </StatusBadge>
                    <StatusBadge status={t.feeStatus === "paid" ? "approved" : t.feeStatus === "pending" ? "pending" : "info"}>
                      {t.feeStatus === "paid" ? "Fee paid" : t.feeStatus === "pending" ? "Fee pending" : "Free entry"}
                    </StatusBadge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5">{t.game}</span>
                  {t.inGameRole ? (
                    <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5">{t.inGameRole}</span>
                  ) : null}
                  {t.region ? (
                    <span className="border-2 border-foreground bg-neo-cream px-2 py-0.5">{t.region}</span>
                  ) : null}
                </div>
                {t.note ? <p className="text-sm text-muted-foreground">“{t.note}”</p> : null}
                {t.status === "pending" ? (
                  <div className="flex gap-2 border-t-2 border-foreground/20 pt-3">
                    <Button
                      size="sm"
                      className="neo-press rounded-none border-2 border-foreground bg-neo-green px-3 py-1.5 text-xs font-bold text-white shadow-[2px_2px_0_0_var(--neo-ink)]"
                      onClick={async () => {
                        await setTryoutStatus({ tryoutId: t._id, status: "approved" });
                        toast.success(`${t.name} approved for tryouts.`);
                      }}
                    >
                      <CheckCircle2 className="size-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="neo-press rounded-none border-2 border-foreground bg-neo-red px-3 py-1.5 text-xs font-bold text-white shadow-[2px_2px_0_0_var(--neo-ink)]"
                      onClick={async () => {
                        await setTryoutStatus({ tryoutId: t._id, status: "rejected" });
                        toast.success(`Tryout from ${t.name} declined.`);
                      }}
                    >
                      <XCircle className="size-3.5" />
                      Decline
                    </Button>
                  </div>
                ) : null}
              </NeoCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
