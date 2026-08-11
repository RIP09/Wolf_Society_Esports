import { NeoCard, PageHeader } from "@/components/neo";
import { card } from "@/lib/neo";
import { cn } from "@/lib/utils";
import {
  Crosshair,
  Eye,
  Flag,
  Gamepad2,
  Handshake,
  Heart,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router";

const VALUES = [
  {
    icon: Swords,
    title: "Competitive excellence",
    body: "Every roster, scrim and tournament is treated like a final. We train, review and improve as one pack.",
  },
  {
    icon: Users,
    title: "One society",
    body: "Players, coaches and management share one system. No silos — the whole organization sees the same live data.",
  },
  {
    icon: ShieldCheck,
    title: "Fair play",
    body: "Clean records, honest results and zero tolerance for cheating. Our integrity is our brand.",
  },
  {
    icon: Zap,
    title: "Always improving",
    body: "Performance is tracked match by match, so decisions come from data instead of guesswork.",
  },
];

const MILESTONES = [
  { year: "Founded", text: "Wolf Society Esports is built as a single, shared organization — one database powering the public site, the player portal and management." },
  { year: "Today", text: "Rosters across multiple titles, live schedules, tracked performance and automated notifications keep the Society moving." },
];

export default function PublicAbout() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports · About"
        title="The Society"
        description="Who we are, what we stand for, and how a modern esports organization should run."
      />

      {/* Story */}
      <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <NeoCard className="gap-4 p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
              <Flag className="size-6" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Our story</h2>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">
            Wolf Society Esports is a competitive esports organization built around a
            simple idea: a team works best when everyone can see the same picture. Our
            players register through their own portal, log their performance after every
            match, and management reviews everything from a single command center — the
            Den.
          </p>
          <p className="text-sm leading-7 text-muted-foreground">
            We compete across the world's biggest titles, from tactical shooters to
            MOBAs, fighting games and racing. Every roster, fixture and result you see on
            this website is live data from the organization's own system — nothing is
            static, nothing is staged.
          </p>
          <div className="grid gap-3 border-t-2 border-foreground/20 pt-4 sm:grid-cols-3">
            {[
              [<Users key="u" className="size-4" />, "One shared database"],
              [<Trophy key="t" className="size-4" />, "Results published live"],
              [<Gamepad2 key="g" className="size-4" />, "Multiple esports titles"],
            ].map(([icon, label]) => (
              <div key={String(label)} className="flex items-center gap-2 border-2 border-foreground bg-neo-cream px-3 py-2.5 text-xs font-bold">
                {icon}
                {label}
              </div>
            ))}
          </div>
        </NeoCard>

        <NeoCard className="gap-4 bg-neo-yellow p-7 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-foreground text-background">
              <Eye className="size-6" />
            </span>
            <h2 className="text-2xl font-bold tracking-tight">Mission</h2>
          </div>
          <p className="text-base leading-7 text-white/90">
            To build a professional, transparent esports organization where talented
            players get real opportunities and every achievement is earned, recorded and
            shared.
          </p>
          <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-widest text-white/70">
            No shortcuts. No hidden stats. Just the pack.
          </p>
        </NeoCard>
      </section>

      {/* Values */}
      <section className="mt-12">
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          What we stand for
        </p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight">Our values</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <NeoCard key={v.title} className="neo-press group gap-3 p-6">
              <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-cream transition-colors group-hover:bg-neo-yellow group-hover:text-white">
                <v.icon className="size-5" />
              </span>
              <p className="text-lg font-bold leading-tight">{v.title}</p>
              <p className="text-xs leading-6 text-muted-foreground">{v.body}</p>
            </NeoCard>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-12 border-t-2 border-foreground bg-neo-cream px-4 py-10 sm:px-8">
        <div className="flex items-center gap-2">
          <Crosshair className="size-5" />
          <h2 className="text-2xl font-bold tracking-tight">How the Society runs</h2>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Users,
              step: "01",
              title: "Players",
              body: "Register in the player portal (The Pack), log your performance, and follow team broadcasts.",
            },
            {
              icon: ShieldCheck,
              step: "02",
              title: "Management",
              body: "Approves rosters, runs tournaments and matches, and reviews every entry from The Den.",
            },
            {
              icon: Handshake,
              step: "03",
              title: "The public",
              body: "Sees teams, schedules, news and results here — updated live from the same database.",
            },
          ].map((s) => (
            <div key={s.step} className={cn(card, "flex flex-col gap-3 bg-card p-6")}>
              <div className="flex items-center justify-between">
                <span className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
                  <s.icon className="size-5" />
                </span>
                <span className="font-mono text-2xl font-bold text-muted-foreground/40">{s.step}</span>
              </div>
              <p className="text-lg font-bold leading-tight">{s.title}</p>
              <p className="text-xs leading-6 text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Milestones + CTA */}
      <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div>
          <div className="flex items-center gap-2">
            <Heart className="size-5" />
            <h2 className="text-2xl font-bold tracking-tight">Milestones</h2>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            {MILESTONES.map((m) => (
              <NeoCard key={m.year} className="gap-1 p-5">
                <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{m.year}</p>
                <p className="text-sm leading-6 text-muted-foreground">{m.text}</p>
              </NeoCard>
            ))}
          </div>
        </div>
        <div className="relative border-2 border-foreground bg-neo-yellow p-7 text-white shadow-[6px_6px_0_0_var(--neo-ink)]">
          <div className="absolute -top-3 left-5 border-2 border-foreground bg-background px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-foreground">
            Join us
          </div>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Want to be part of it?</h2>
          <p className="mt-2 text-sm leading-6 text-white/85">
            Players can register through The Pack and show what they're made of.
            Organizations, sponsors and partners can reach out through the contact page.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/auth?returnTo=%2Fplayer%2Fregister">
              <span className="neo-press inline-block border-2 border-foreground bg-foreground px-5 py-2.5 text-sm font-bold text-background shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]">
                Player registration
              </span>
            </Link>
            <Link to="/contact">
              <span className="neo-press inline-block border-2 border-foreground bg-background px-5 py-2.5 text-sm font-bold text-foreground shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]">
                Contact us
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
