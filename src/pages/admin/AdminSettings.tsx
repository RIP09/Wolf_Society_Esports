import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NeoCard, NeoField, PageHeader } from "@/components/neo";
import { btnYellow, input } from "@/lib/neo";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Save, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminSettings() {
  const settings = useQuery(api.admin.getSettings);
  const updateSettings = useMutation(api.admin.updateSettings);

  const [twitchChannel, setTwitchChannel] = useState("");
  const [youtubeChannel, setYoutubeChannel] = useState("");
  const [discordInvite, setDiscordInvite] = useState("");
  const [tryoutFee, setTryoutFee] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setTwitchChannel(settings.twitchChannel ?? "");
      setYoutubeChannel(settings.youtubeChannel ?? "");
      setDiscordInvite(settings.discordInvite ?? "");
      setTryoutFee(settings.tryoutFee ?? "");
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
        },
      });
      toast.success("Settings saved — the public portal updates instantly.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div className="h-40 animate-pulse border-2 border-foreground bg-card" />;
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="The Den · Configuration"
        title="Organization settings"
        description="Public portal configuration — the watch page, tryout fees and community links read these values live."
      />

      <NeoCard className="gap-6 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-neo-purple text-white">
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

        <div className="flex justify-end">
          <Button className={btnYellow} onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </NeoCard>
    </div>
  );
}
