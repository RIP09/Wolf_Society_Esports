import { NeoCard, PageHeader } from "@/components/neo";
import { openCookieSettings } from "@/components/ConsentProvider";
import { ShieldCheck } from "lucide-react";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "What we collect",
    body: "Player registration data (gamertag, real name, email, game, role, region, rank and optional details), performance entries you log, management access requests, contact-form messages, and alert subscriptions (email and optionally phone number). We only collect what you choose to give us.",
  },
  {
    title: "Who can see it",
    body: "Player profiles and performance data are visible to the organization's management team in The Den. The public website only shows approved, active players and live team, tournament and match data. Your personal details are never sold or shared with third parties for marketing.",
  },
  {
    title: "Cookies and local storage",
    body: "The website uses cookies and local storage to keep you signed in, remember your cookie preference and alert subscriptions, and understand how visitors use the site. You can accept or decline non-essential cookies through the cookie banner at any time.",
  },
  {
    title: "Email and SMS notifications",
    body: "If you register as a player, request management access, or subscribe to alerts, we may contact you by email or SMS with confirmations, credentials and organization news. Automated messages are sent only in response to your actions or your subscription.",
  },
  {
    title: "How long we keep it",
    body: "Data stays in the Society's database for as long as your account is active. You can ask management to delete your profile and data at any time through the contact page, and we will remove it.",
  },
  {
    title: "Your rights",
    body: "You can request a copy of the data we hold about you, ask for corrections, or request deletion. Email wolfsocietygg@yahoo.com and the management team will respond.",
  },
  {
    title: "PROGA Act 2025–2026 compliance",
    body: "Wolf Society Esports is fully compliant with the PROGA Act 2025–2026. All player registrations, data handling, online-gaming activities, fair-play enforcement and content published through this platform operate in line with the Act as in force for the 2025–2026 period, and the organization keeps its practices aligned with the Act at all times.",
  },
];

export default function PublicPrivacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports · Legal"
        title="Privacy policy"
        description="Last updated with the launch of the Society platform. Simple language, no surprises."
      />

      <div className="mt-10 flex flex-col gap-4">
        {SECTIONS.map((s) => (
          <NeoCard key={s.title} className="gap-2 p-6">
            <p className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <ShieldCheck className="size-5" />
              {s.title}
            </p>
            <p className="text-sm leading-7 text-muted-foreground">{s.body}</p>
          </NeoCard>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-start justify-between gap-4 border-2 border-foreground bg-neo-cream p-6 sm:flex-row sm:items-center">
        <div>
          <p className="font-bold">Manage your cookie preferences</p>
          <p className="mt-1 text-sm text-muted-foreground">
            You can change your choice any time.
          </p>
        </div>
        <button
          type="button"
          onClick={openCookieSettings}
          className="neo-press border-2 border-foreground bg-neo-yellow px-4 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
        >
          Open cookie settings
        </button>
      </div>

      <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Wolf Society Esports · wolfsocietygg@yahoo.com
      </p>
    </div>
  );
}
