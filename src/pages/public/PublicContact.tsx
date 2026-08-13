import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { OptionPicker } from "@/components/GamePicker";
import { PhoneField } from "@/components/PhoneField";
import { NeoCard, NeoField, PageHeader } from "@/components/neo";
import {
  CONTACT_CATEGORIES,
  CONTACT_REPLY_PREFS,
  CONTACT_SUBJECTS,
  GAMES,
  REGIONS,
} from "@/lib/constants";
import { input } from "@/lib/neo";
import { useMutation } from "convex/react";
import { Mail, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function PublicContact() {
  const contact = useMutation(api.public.contact);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dialCode, setDialCode] = useState("+91");
  const [localNumber, setLocalNumber] = useState("");
  const [category, setCategory] = useState("");
  const [game, setGame] = useState("");
  const [organization, setOrganization] = useState("");
  const [country, setCountry] = useState("");
  const [replyPreference, setReplyPreference] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — bots fill this
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const phone = [dialCode, localNumber].filter(Boolean).join(" ").trim();
    try {
      await contact({
        name,
        email,
        subject,
        message,
        phone: phone || undefined,
        phoneCountryCode: phone ? dialCode : undefined,
        category: category || undefined,
        game: game || undefined,
        organization: organization.trim() || undefined,
        country: country || undefined,
        replyPreference: replyPreference || undefined,
        website: website || undefined,
      });
      setSent(true);
      toast.success("Message sent — thank you!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      toast.error("Could not send your message.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <NeoCard className="gap-4 p-10 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
            <Mail className="size-7" />
          </span>
          <h1 className="text-3xl font-bold tracking-tight">Thank you, {name || "friend"}!</h1>
          <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
            Your message has been saved and sent to the organization. Our team will get
            back to you at <span className="font-bold text-foreground">{email}</span>
            {localNumber ? (
              <>
                {" "}
                or <span className="font-bold text-foreground">{dialCode} {localNumber}</span>
              </>
            ) : null}{" "}
            shortly. A confirmation email is on its way.
          </p>
          <Button
            type="button"
            className="neo-press rounded-none border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
            onClick={() => {
              setSent(false);
              setName("");
              setEmail("");
              setDialCode("+91");
              setLocalNumber("");
              setCategory("");
              setGame("");
              setOrganization("");
              setCountry("");
              setReplyPreference("");
              setSubject("");
              setMessage("");
            }}
          >
            Send another message
          </Button>
        </NeoCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Wolf Society Esports"
        title="Contact us"
        description="Partnerships, sponsorships, tryouts, media or general inquiries — fill in your details, pick a subject (or write your own) and the organization will get back to you."
      />

      <NeoCard className="mt-10 gap-6 p-6 sm:p-8">
        {error ? (
          <p className="border-2 border-foreground bg-neo-red px-4 py-2.5 text-sm font-bold text-white">
            {error}
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="grid gap-5">
          {/* Honeypot — hidden from humans, irresistible to bots */}
          <div className="hidden" aria-hidden="true">
            <label>
              Website
              <input
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <NeoField label="Your name *">
              <Input
                className={input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                required
              />
            </NeoField>
            <NeoField label="Email *">
              <Input
                className={input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </NeoField>
          </div>

          <NeoField label="Phone (with country code)">
            <PhoneField
              dialCode={dialCode}
              localNumber={localNumber}
              onDialChange={setDialCode}
              onLocalChange={setLocalNumber}
            />
          </NeoField>

          <div className="grid gap-5 sm:grid-cols-2">
            <NeoField label="I am a…">
              <OptionPicker
                options={CONTACT_CATEGORIES}
                value={category}
                onChange={(v) => setCategory(v === "none" ? "" : v)}
                placeholder="Player, Fan, Organization…"
                searchPlaceholder="Search or write your own…"
                notSureLabel="Something else — I'll write it"
                emptyText="Nothing matches — type your own."
              />
            </NeoField>
            <NeoField label="Game / esports title">
              <OptionPicker
                options={GAMES}
                value={game || "none"}
                onChange={(v) => setGame(v === "none" ? "" : v)}
                placeholder="Which game is it about?"
                searchPlaceholder="Search esports titles…"
                notSureLabel="Not about a specific game"
                emptyText="No games found — type your own."
              />
            </NeoField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <NeoField label="Organization / team / brand">
              <Input
                className={input}
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Your Brand or Team Name"
              />
            </NeoField>
            <NeoField label="Country / region">
              <OptionPicker
                options={REGIONS}
                value={country}
                onChange={(v) => setCountry(v === "none" ? "" : v)}
                placeholder="Where are you from?"
                searchPlaceholder="Search countries or regions…"
                notSureLabel="Prefer not to say"
                emptyText="No match — type your own."
              />
            </NeoField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <NeoField label="How should we reply?">
              <OptionPicker
                options={CONTACT_REPLY_PREFS}
                value={replyPreference}
                onChange={(v) => setReplyPreference(v === "none" ? "" : v)}
                placeholder="Email, phone or both…"
                searchPlaceholder="Search…"
                notSureLabel="No preference"
                emptyText="Nothing matches — type your own."
              />
            </NeoField>
            <NeoField label="Subject *">
              <OptionPicker
                options={CONTACT_SUBJECTS}
                value={subject}
                onChange={(v) => setSubject(v === "none" ? "" : v)}
                placeholder="Choose a subject…"
                searchPlaceholder="Pick one or write your own…"
                notSureLabel="Write my own subject"
                emptyText="Nothing matches — type your own subject."
              />
            </NeoField>
          </div>

          <NeoField label="Message *">
            <Textarea
              className="min-h-32 rounded-none border-2 border-foreground bg-background"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what's on your mind…"
              required
            />
          </NeoField>

          <div className="flex flex-col gap-3 border-t-2 border-foreground pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Your message is saved in the organization database and forwarded to the team
              automatically by email and SMS.
            </p>
            <Button type="submit" className="neo-press rounded-none border-2 border-foreground bg-neo-yellow text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]" disabled={submitting}>
              <Send className="size-4" />
              {submitting ? "Sending…" : "Send message"}
            </Button>
          </div>
        </form>
      </NeoCard>
    </div>
  );
}
