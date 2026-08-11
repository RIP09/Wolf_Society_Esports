import { NeoCard } from "@/components/neo";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router";

export default function PublicDonateSuccess() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <NeoCard className="gap-5 p-10 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center border-2 border-foreground bg-neo-green text-white shadow-[4px_4px_0_0_var(--neo-ink)]">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">Thank you!</h1>
        <p className="text-sm leading-6 text-muted-foreground">
          Your donation is confirmed and recorded. A thank-you email is on its way — the
          whole Society appreciates your support.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link to="/" className="neo-press border-2 border-foreground bg-neo-yellow px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--neo-ink)]">
            Back to home
          </Link>
          <Link to="/news" className="border-2 border-foreground bg-card px-5 py-2.5 text-sm font-bold shadow-[3px_3px_0_0_var(--neo-ink)]">
            Read the latest news
          </Link>
        </div>
      </NeoCard>
    </div>
  );
}
