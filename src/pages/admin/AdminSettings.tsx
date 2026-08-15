import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NeoCard, NeoField, PageHeader, StatusBadge } from "@/components/neo";
import { btnYellow, input } from "@/lib/neo";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  Download,
  Loader2,
  Mail,
  MessageSquareWarning,
  Phone,
  PlugZap,
  Save,
  Settings,
  Smartphone,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type IntegrationMap = {
  [key: string]: {
    label: string;
    purpose: string;
    configured: boolean;
    keys: string[];
  };
};

const INTEGRATION_ORDER = [
  "email",
  "sms",
  "whatsapp",
  "push",
  "discord",
  "payments",
  "automation",
  "admin",
  "siteUrl",
] as const;

export default function AdminSettings() {
  const settings = useQuery(api.admin.getSettings);
  const integrations = useQuery(api.admin.getIntegrationStatus);
  const updateSettings = useMutation(api.admin.updateSettings);

  const [twitchChannel, setTwitchChannel] = useState("");
  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [discordInvite, setDiscordInvite] = useState("");
  const [tryoutFee, setTryoutFee] = useState("");

  const [orgEmail, setOrgEmail] = useState("");
  const [orgEmail2, setOrgEmail2] = useState("");
  const [orgPhone, setOrgPhone] = useState("");

  const [apkPack, setApkPack] = useState("");
  const [apkDen, setApkDen] = useState("");
  const [apkCoach, setApkCoach] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setTwitchChannel(settings.twitchChannel ?? "");
      setYoutubeChannel(settings.youtubeChannel ?? "");
      setDiscordInvite(settings.discordInvite ?? "");
      setTryoutFee(settings.tryoutFee ?? "");
      setOrgEmail(settings.orgEmail ?? "");
      setOrgEmail2(settings.orgEmail2 ?? "");
      setOrgPhone(settings.orgPhone ?? "");
      setApkPack(settings.apkPack ?? "");
      setApkDen(settings.apkDen ?? "");
      setApkCoach(settings.apkCoach ?? "");
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        settings: {
          twitchChannel,
          youtubeChannel,
          discordInvite,
          tryoutFee,
          orgEmail,
          orgEmail2,
          orgPhone,
          apkPack,
          apkDen,
          apkCoach,
        },
      });
      toast.success("Settings saved — the website and apps update instantly.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!settings || !integrations) {
    return <div className="h-40 animate-pulse border-2 border-foreground bg-card" />;
  }

  const list: IntegrationMap = integrations;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Configuration"
        title="Organization settings"
        description="Everything needed to run the complete website — API connections, app downloads, contact destinations and the public portal — in one place."
      />

      {/* ── Integration health ─────────────────────────────────────────── */}
      <NeoCard className="gap-0 p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-foreground px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-neo-blue text-white">
              <PlugZap className="size-5" />
            </span>
            <div>
              <p className="text-lg font-bold leading-tight">API connection status</p>
              <p className="text-xs text-muted-foreground">
                Shows whether each key is configured. Add the keys in the Convex dashboard
                (Keys tab) — they are never stored in this page.
              </p>
            </div>
          </div>
          <span className="border-2 border-foreground bg-background px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
            Live · realtime
          </span>
        </div>

        <div className="grid gap-px bg-foreground/10 sm:grid-cols-2">
          {INTEGRATION_ORDER.map((id) => {
            const item = list[id];
            if (!item) return null;
            return (
              <div key={id} className="flex flex-col gap-2 bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {item.purpose}
                    </p>
                  </div>
                  {item.configured ? (
                    <StatusBadge status="approved">
                      <CheckCircle2 className="size-3" /> Connected
                    </StatusBadge>
                  ) : (
                    <StatusBadge status="pending">
                      <XCircle className="size-3" /> Not connected
                    </StatusBadge>
                  )}
                </div>
                <p className="break-all font-mono text-[10px] text-muted-foreground/80">
                  Keys: {item.keys.join(", ")}
                </p>
              </div>
            );
          })}
        </div>
      </NeoCard>

      {/* ── App downloads ──────────────────────────────────────────────── */}
      <NeoCard className="gap-6 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-green text-white">
            <Smartphone className="size-5" />
          </span>
          <div>
            <p className="text-lg font-bold">Android app downloads</p>
            <p className="text-sm text-muted-foreground">
              Paste the direct .apk download links here. The homepage "Install" button then
              shows a confirm popup and downloads the app — no GitHub redirect.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <NeoField label="Wolf Pack (.apk)" hint="Players app — direct download URL">
            <Input
              className={input}
              value={apkPack}
              onChange={(e) => setApkPack(e.target.value)}
              placeholder="https://…/wolf-pack.apk"
            />
          </NeoField>
          <NeoField label="Wolf Den (.apk)" hint="Management app — direct download URL">
            <Input
              className={input}
              value={apkDen}
              onChange={(e) => setApkDen(e.target.value)}
              placeholder="https://…/wolf-den.apk"
            />
          </NeoField>
          <NeoField label="Wolf Coach (.apk)" hint="AI training app — direct download URL">
            <Input
              className={input}
              value={apkCoach}
              onChange={(e) => setApkCoach(e.target.value)}
              placeholder="https://…/wolf-coach.apk"
            />
          </NeoField>
        </div>
        <p className="flex items-center gap-2 border-2 border-foreground bg-neo-cream px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Download className="size-3.5" />
          Leave empty until the APK is built & hosted — the homepage will show "APK not
          published yet" instead of a broken link.
        </p>
      </NeoCard>

      {/* ── Contact destinations ───────────────────────────────────────── */}
      <NeoCard className="gap-6 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-purple text-white">
            <Mail className="size-5" />
          </span>
          <div>
            <p className="text-lg font-bold">Contact destinations</p>
            <p className="text-sm text-muted-foreground">
              Where contact-form submissions, registrations, reports and alerts are sent.
              Falls back to the built-in addresses when left empty.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <NeoField label="Primary org email" hint="All automated notifications land here">
            <Input
              className={input}
              value={orgEmail}
              onChange={(e) => setOrgEmail(e.target.value)}
              placeholder="wolfsocietygg@yahoo.com"
            />
          </NeoField>
          <NeoField label="Secondary org email" hint="Optional second mailbox">
            <Input
              className={input}
              value={orgEmail2}
              onChange={(e) => setOrgEmail2(e.target.value)}
              placeholder="deepanshumurmu0@gmail.com"
            />
          </NeoField>
          <NeoField label="Org SMS number" hint="Receives SMS for every contact inquiry">
            <Input
              className={input}
              value={orgPhone}
              onChange={(e) => setOrgPhone(e.target.value)}
              placeholder="+917857958722"
            />
          </NeoField>
          <div className="flex items-end pb-1">
            <p className="flex items-center gap-2 border-2 border-foreground bg-neo-cream px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Phone className="size-3.5" />
              Needs the Vonage keys connected above
            </p>
          </div>
        </div>
      </NeoCard>

      {/* ── Public portal ──────────────────────────────────────────────── */}
      <NeoCard className="gap-6 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
            <Settings className="size-5" />
          </span>
          <div>
            <p className="text-lg font-bold">Public portal</p>
            <p className="text-sm text-muted-foreground">Used by the Watch, Tryouts and Leadership pages.</p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <NeoField label="Twitch channel" hint="e.g. wolfsoctygg — powers the live embed on /watch">
            <Input className={input} value={twitchChannel} onChange={(e) => setTwitchChannel(e.target.value)} placeholder="wolfsoctygg" />
          </NeoField>
          <NeoField label="YouTube channel URL" hint="Full link shown on the watch page">
            <Input className={input} value={youtubeChannel} onChange={(e) => setYoutubeChannel(e.target.value)} placeholder="https://youtube.com/@wolfsoctygg" />
          </NeoField>
          <NeoField label="Discord invite" hint="e.g. https://discord.gg/wolf">
            <Input className={input} value={discordInvite} onChange={(e) => setDiscordInvite(e.target.value)} placeholder="https://discord.gg/…" />
          </NeoField>
          <NeoField label="Tryout fee (paise)" hint="e.g. 49900 = ₹499. Leave 0 for free tryouts only.">
            <Input className={input} type="number" min={0} value={tryoutFee} onChange={(e) => setTryoutFee(e.target.value)} placeholder="0" />
          </NeoField>
        </div>
      </NeoCard>

      <div className="flex items-center justify-end gap-3">
        <p className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:flex">
          <MessageSquareWarning className="size-3.5" />
          Changes apply instantly, everywhere
        </p>
        <Button className={btnYellow} onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving…" : "Save all settings"}
        </Button>
      </div>
    </div>
  );
}
