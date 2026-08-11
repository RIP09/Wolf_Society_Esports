import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { GamePicker, OptionPicker } from "@/components/GamePicker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NeoCard, NeoField, PageHeader } from "@/components/neo";
import { GAMES, IN_GAME_ROLES, REGIONS } from "@/lib/constants";
import { input } from "@/lib/neo";
import { useAction, useMutation, useQuery } from "convex/react";
import { Loader2, Swords } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PublicTryouts() {
  const settings = useQuery(api.public.getSettings);
  const submitTryout = useMutation(api.payments.submitTryout);
  const createCheckout = useAction(api.payments.createTryoutCheckout);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [game, setGame] = useState<string>(GAMES[0]);
  const [role, setRole] = useState("none");
  const [region, setRegion] = useState("none");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"free" | "paid" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const tryoutFee = Number(settings?.tryoutFee ?? "0");

  const handleSubmit = async (kind: "free" | "paid") => {
    setBusy(kind);
    setError(null);
    const payload = {
      name,
      email,
      phone: phone || undefined,
      game,
      inGameRole: role === "none" ? undefined : role,
      region: region === "none" ? undefined : region,
      note: note || undefined,
    };
    try {
      if (kind === "free") {
        await submitTryout(payload);
        setSent(true);
        toast.success("Tryout submitted — the coaches have been notified!");
      } else {
        const res = await createCheckout({
          ...payload,
          fee: tryoutFee,
          currency: "inr",
        });
        if (res.ok && res.url) {
          window.location.href = res.url;
        } else {
          setError(res.message ?? "Could not start the checkout.");
          setBusy(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(null);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
        <NeoCard className="gap-5 p-10 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-foreground bg-neo-blue text-white shadow-[4px_4px_0_0_var(--neo-ink)]">
            <Swords className="size-8" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Tryout received!</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Your tryout for <span className="font-bold text-foreground">{game}</span> is in.
            Coaches have been notified and will contact you at{" "}
            <span className="font-bold text-foreground">{email}</span> with the details.
          </p>
          <Button
            type="button"
            className="neo-press rounded-none border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)]"
            onClick={() => {
              setSent(false);
              setName("");
              setEmail("");
              setPhone("");
              setNote("");
            }}
          >
            Submit another
          </Button>
        </NeoCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="Tryouts"
        description="Want a spot in the pack? Register for tryouts across every title we compete in — worldwide."
      />

      <NeoCard className="mt-10 gap-6 p-6 sm:p-8">
        {error ? (
          <p className="border-2 border-foreground bg-neo-red px-4 py-2.5 text-sm font-bold text-white">{error}</p>
        ) : null}

        <div className="grid gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <NeoField label="Full name *">
              <Input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Rivera" required />
            </NeoField>
            <NeoField label="Email *">
              <Input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </NeoField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <NeoField label="Contact number">
              <Input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
            </NeoField>
            <NeoField label="Game *" hint="60+ worldwide esports titles">
              <GamePicker value={game} onChange={setGame} />
            </NeoField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <NeoField label="In-game role">
              <OptionPicker
                options={IN_GAME_ROLES}
                value={role}
                onChange={setRole}
                placeholder="Select a role…"
                searchPlaceholder="Search roles…"
                notSureLabel="Not sure yet"
              />
            </NeoField>
            <NeoField label="Region">
              <OptionPicker
                options={REGIONS}
                value={region}
                onChange={setRegion}
                placeholder="Select a region…"
                searchPlaceholder="Search regions…"
                notSureLabel="Worldwide"
              />
            </NeoField>
          </div>

          <NeoField label="About you">
            <Textarea
              className="min-h-24 rounded-none border-2 border-foreground bg-background"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Experience, previous teams, rank, availability…"
            />
          </NeoField>
        </div>

        <div className="flex flex-col gap-3 border-t-2 border-foreground pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Tryouts are free to enter — a paid tier is optional if the organization has set a fee.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="neo-press rounded-none border-2 border-foreground bg-neo-blue text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
                disabled={busy !== null || !name.trim() || !email.trim()}
                onClick={() => handleSubmit("free")}
              >
                {busy === "free" ? <Loader2 className="size-4 animate-spin" /> : <Swords className="size-4" />}
                {busy === "free" ? "Submitting…" : "Submit free tryout"}
              </Button>
              {tryoutFee > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="neo-press rounded-none border-2 border-foreground bg-neo-purple px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
                  disabled={busy !== null || !name.trim() || !email.trim()}
                  onClick={() => handleSubmit("paid")}
                >
                  {busy === "paid" ? <Loader2 className="size-4 animate-spin" /> : null}
                  {busy === "paid" ? "Opening checkout…" : `Pay tryout fee ₹${(tryoutFee / 100).toLocaleString("en-IN")}`}
                </Button>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Every registration is saved in the organization database and the coaching staff is
            notified in real time by email and Discord.
          </p>
        </div>
      </NeoCard>
    </div>
  );
}
