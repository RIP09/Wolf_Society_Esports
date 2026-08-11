import { NeoCard, PageHeader } from "@/components/neo";
import { FileText } from "lucide-react";
import { Link } from "react-router";

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "Using the website",
    body: "By using this website you agree to use it lawfully and not to disrupt the platform, attempt unauthorized access to the management or player portals, or interfere with other users.",
  },
  {
    title: "Player registration",
    body: "Registration is a request to join Wolf Society Esports. Profiles are reviewed by management and may be approved, suspended or declined. Players must provide accurate information and keep their credentials secure.",
  },
  {
    title: "Management access",
    body: "Management portal access is granted by the organization. Generated User IDs and passwords are for the individual recipient only and must not be shared. The organization may revoke access at any time.",
  },
  {
    title: "Content and data",
    body: "Rosters, schedules, results and news shown on the public website reflect the organization's live database. The organization updates and corrects this information in its sole discretion.",
  },
  {
    title: "Fair play and conduct",
    body: "Players must follow the organization's fair-play standards: no cheating, no abuse, no match manipulation. Violations may result in suspension or removal from the Society.",
  },
  {
    title: "Limitation of liability",
    body: "The website is provided as-is. Wolf Society Esports is not liable for indirect or consequential damages arising from use of the site or the services, to the maximum extent permitted by law.",
  },
  {
    title: "Changes to these terms",
    body: "We may update these terms from time to time. Continued use of the website after changes are posted means you accept the updated terms.",
  },
  {
    title: "Contact",
    body: "Questions about these terms can be sent to wolfsocietygg@yahoo.com or through the contact page.",
  },
];

export default function PublicTerms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports · Legal"
        title="Terms of service"
        description="The rules of the Society — for players, managers and visitors."
      />

      <div className="mt-10 flex flex-col gap-4">
        {SECTIONS.map((s) => (
          <NeoCard key={s.title} className="gap-2 p-6">
            <p className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <FileText className="size-5" />
              {s.title}
            </p>
            <p className="text-sm leading-7 text-muted-foreground">{s.body}</p>
          </NeoCard>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        See the{" "}
        <Link to="/privacy" className="font-bold underline hover:text-neo-yellow">
          Privacy Policy
        </Link>{" "}
        for how we handle your data.
      </p>
    </div>
  );
}
