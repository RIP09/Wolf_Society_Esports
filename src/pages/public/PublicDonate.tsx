import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NeoCard, NeoField, PageHeader } from "@/components/neo";
import { input } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useAction } from "convex/react";
import { Heart, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const PRESETS = [199, 499, 999, 1999, 4999];

export default function PublicDonate() {
  const createCheckout = useAction(api.payments.createDonationCheckout);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState(499);
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalAmount = custom ? Math.max(50, Math.round(Number(custom) * 100)) : amount * 100;

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalAmount || finalAmount < 100) {
      setError("Please choose an amount of at least ₹1.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await createCheckout({
        name,
        email,
        amount: finalAmount,
        currency: "inr",
        note: note || undefined,
      });
      if (res.ok && res.url) {
        window.location.href = res.url;
      } else {
        setError(res.message ?? "Could not start the checkout.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="Support the Society"
        description="Your donation funds scrims, gear, travel and the stages we compete on. Every rupee goes back into the pack."
      />

      <NeoCard className="mt-10 gap-6 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-purple text-white shadow-[3px_3px_0_0_var(--neo-ink)]">
            <Heart className="size-6" />
          </span>
          <div>
            <p className="text-xl font-bold">Donate once</p>
            <p className="text-sm text-muted-foreground">Secure checkout by Stripe — UPI, cards and more.</p>
          </div>
        </div>

        {error ? (
          <p className="border-2 border-foreground bg-neo-red px-4 py-2.5 text-sm font-bold text-white">{error}</p>
        ) : null}

        <form onSubmit={handleDonate} className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <NeoField label="Your name *">
              <Input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" required />
            </NeoField>
            <NeoField label="Email *">
              <Input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </NeoField>
          </div>

          <NeoField label="Amount (₹)">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setAmount(p);
                    setCustom("");
                  }}
                  className={cn(
                    "border-2 border-foreground px-4 py-2 font-mono text-sm font-bold transition-colors",
                    !custom && amount === p ? "bg-neo-purple text-white shadow-[2px_2px_0_0_var(--neo-ink)]" : "bg-card hover:bg-neo-cream",
                  )}
                >
                  ₹{p}
                </button>
              ))}
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-mono text-sm font-bold">₹</span>
                <Input
                  className={cn(input, "w-28 pl-7")}
                  type="number"
                  min={1}
                  placeholder="Custom"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                />
              </div>
            </div>
          </NeoField>

          <NeoField label="Message (optional)">
            <Textarea
              className="min-h-20 rounded-none border-2 border-foreground bg-background"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="A note for the team…"
            />
          </NeoField>

          <div className="flex flex-col gap-3 border-t-2 border-foreground pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Donations are recorded in the organization database and confirmed by email automatically.
            </p>
            <Button type="submit" className="neo-press rounded-none border-2 border-foreground bg-neo-purple text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]" disabled={loading || !name.trim() || !email.trim()}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Heart className="size-4" />}
              {loading ? "Opening checkout…" : `Donate ${custom ? "custom" : `₹${amount}`}`}
            </Button>
          </div>
        </form>

        <p className="flex items-center gap-2 border-t-2 border-foreground/20 pt-4 text-xs text-muted-foreground">
          <Mail className="size-3.5" />
          Prefer to wire or pay another way? Email{" "}
          <a href="mailto:wolfsocietygg@yahoo.com" className="font-bold text-foreground hover:underline">
            wolfsocietygg@yahoo.com
          </a>
        </p>
      </NeoCard>
    </div>
  );
}
