import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NeoCard, PageHeader } from "@/components/neo";
import { HelpCircle } from "lucide-react";
import { Link } from "react-router";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I join Wolf Society Esports as a player?",
    a: "Register through the player portal (The Pack). Fill in your gamertag, real name, primary game and details — management in The Den reviews every profile and approves it. You'll see your status on your dashboard.",
  },
  {
    q: "How do I get access to the management portal?",
    a: "Management access is granted by the organization, not self-signed. From the sign-in page, choose The Den and submit a request with the role you need. If approved, your generated User ID and password are sent to your email and phone automatically.",
  },
  {
    q: "Where does the data on this website come from?",
    a: "Everything — teams, players, tournaments, matches and news — is live data from the Society's own shared database. When management updates or removes something in The Den, the change appears here and in the player portal in real time.",
  },
  {
    q: "Which games does the organization compete in?",
    a: "We cover a wide range of competitive titles — tactical shooters, MOBAs, fighting games, racing and more. See the Teams page for the current rosters and the Tournaments page for where we're competing next.",
  },
  {
    q: "Can I sponsor or partner with the organization?",
    a: "Yes. Use the contact page to reach the management team with partnership or sponsorship inquiries. Your message is saved in the system and forwarded to the organization automatically.",
  },
  {
    q: "How do I get SMS and email alerts?",
    a: "Use the subscription box in the website footer. Enter your email (and optionally your phone) and you'll receive notifications whenever the organization broadcasts news — match results, tournaments and announcements.",
  },
  {
    q: "What cookies does this website use?",
    a: "The site uses cookies and local storage to keep you signed in, remember your preferences (like your cookie choice and alert subscriptions) and understand how visitors use the site. You can accept or decline via the cookie banner, and change your choice any time through the Cookie settings link in the footer.",
  },
  {
    q: "Is my personal information safe?",
    a: "Yes. Player profiles, performance entries and contact details are stored in the Society's private database and only visible to the management team. See the Privacy Policy page for full details.",
  },
];

export default function PublicFaq() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports · Help"
        title="Frequently asked questions"
        description="Everything players, fans and partners usually want to know."
      />

      <NeoCard className="mt-10 gap-0 p-0">
        <Accordion type="single" collapsible className="px-2 sm:px-5">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`item-${i}`} className="border-foreground/30">
              <AccordionTrigger className="rounded-none px-2 py-5 text-left text-sm font-bold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <div className="border-l-2 border-foreground bg-neo-cream px-4 py-3 leading-7">
                  {f.a}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </NeoCard>

      <div className="mt-8 border-2 border-foreground bg-neo-yellow p-6 text-center text-white shadow-[5px_5px_0_0_var(--neo-ink)]">
        <p className="flex items-center justify-center gap-2 text-lg font-bold">
          <HelpCircle className="size-5" />
          Still have a question?
        </p>
        <p className="mt-1 text-sm text-white/85">Reach out through the contact page and the team will get back to you.</p>
        <Link to="/contact" className="mt-4 inline-block border-2 border-foreground bg-foreground px-5 py-2.5 text-sm font-bold text-background shadow-[3px_3px_0_0_var(--neo-ink)]">
          Contact us
        </Link>
      </div>
    </div>
  );
}
