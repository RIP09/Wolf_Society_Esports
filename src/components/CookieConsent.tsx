import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { openCookieSettings, useConsent } from "@/components/ConsentProvider";
import { btnGhost, btnYellow, card } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Cookie, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

interface CategoryMeta {
  key: "analytics" | "preferences" | "marketing";
  name: string;
  desc: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: "analytics",
    name: "Analytics",
    desc: "Anonymous page views, visitor counts and country breakdowns so the organization understands how fans use the site. No personal details are stored.",
  },
  {
    key: "preferences",
    name: "Preferences",
    desc: "Saved choices like your theme (light/dark), region and layout options so the site looks the way you set it on your next visit.",
  },
  {
    key: "marketing",
    name: "Marketing & alerts",
    desc: "Push notifications and broadcast alerts about matches, news and giveaways, plus browser permission prompts to deliver them.",
  },
];

/** The cookie settings dialog — reachable from the banner, footer link and Privacy Policy. */
function ConsentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { consent, update, acceptAll, declineAll } = useConsent();
  const [draft, setDraft] = useState({
    analytics: consent?.analytics ?? false,
    preferences: consent?.preferences ?? false,
    marketing: consent?.marketing ?? false,
  });

  // Sync the draft whenever the dialog opens or stored consent changes.
  useEffect(() => {
    if (open) {
      setDraft({
        analytics: consent?.analytics ?? false,
        preferences: consent?.preferences ?? false,
        marketing: consent?.marketing ?? false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, consent]);

  const applyDraft = () => {
    update("analytics", draft.analytics);
    update("preferences", draft.preferences);
    update("marketing", draft.marketing);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)] sm:max-w-xl"
      >
        <DialogHeader className="text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
              <Cookie className="size-5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Cookie settings
              </DialogTitle>
              <DialogDescription className="mt-1">
                Choose what data you share with Wolf Society Esports. You can
                change this anytime from the footer.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Necessary — always on */}
        <div className="flex items-start gap-3 border-2 border-foreground bg-neo-cream p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-foreground bg-neo-green text-white">
            <ShieldCheck className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-bold">
              Necessary
              <span className="border border-foreground bg-background px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Always on
              </span>
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Required for the site to work — keeping you signed in, protecting
              against fraud and remembering that you made this choice. No consent
              needed, no data shared.
            </p>
          </div>
          <Switch checked disabled aria-label="Necessary cookies (always on)" />
        </div>

        {/* Optional categories */}
        <div className="flex flex-col gap-3">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              className="flex items-start gap-3 border-2 border-foreground bg-background p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{cat.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{cat.desc}</p>
              </div>
              <Switch
                checked={draft[cat.key]}
                onCheckedChange={(checked) =>
                  setDraft((d) => ({ ...d, [cat.key]: checked }))
                }
                aria-label={`${cat.name} cookies`}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-foreground/20 pt-4">
          <Button
            variant="outline"
            className={cn(btnGhost, "text-xs font-bold")}
            onClick={() => {
              declineAll();
              onOpenChange(false);
            }}
          >
            <X className="size-4" />
            Decline all
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className={cn(btnGhost, "text-xs font-bold")}
              onClick={() => {
                acceptAll();
                onOpenChange(false);
              }}
            >
              <Check className="size-4" />
              Accept all
            </Button>
            <Button className={cn(btnYellow, "text-xs font-bold")} onClick={applyDraft}>
              <Cookie className="size-4" />
              Apply selection
            </Button>
          </div>
        </div>
        <p className="text-[10px] leading-4 text-muted-foreground">
          See the{" "}
          <Link to="/privacy" className="font-bold underline hover:text-neo-yellow">
            Privacy Policy
          </Link>{" "}
          for full details on how your data is used.
        </p>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Neo cookie consent banner + settings. Shows on first visit, remembers the
 * choice, and the settings dialog can be reopened via the footer link
 * ({@link openCookieSettings}) or from the Privacy Policy.
 */
export function CookieConsent() {
  const { consent, acceptAll, declineAll } = useConsent();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);

  useEffect(() => {
    // First visit → show the banner. Reopened via the footer/Privacy link.
    const showBanner = () => setBannerOpen(true);
    const showSettings = () => setSettingsOpen(true);
    if (consent === null) showBanner();
    window.addEventListener("wse:cookie-settings", showSettings);
    window.addEventListener("wse:cookie-banner", showBanner);
    return () => {
      window.removeEventListener("wse:cookie-settings", showSettings);
      window.removeEventListener("wse:cookie-banner", showBanner);
    };
  }, [consent]);

  return (
    <>
      <ConsentDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AnimatePresence>
        {bannerOpen && consent === null && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4"
            role="dialog"
            aria-live="polite"
            aria-label="Cookie consent"
          >
            <div className={cn(card, "mx-auto w-full max-w-3xl gap-4 bg-card p-5 sm:p-6")}>
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
                  <Cookie className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="text-base font-bold tracking-tight">We use cookies</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    Wolf Society Esports uses cookies and local storage to keep you signed
                    in, remember your preferences and understand how visitors use the
                    website. You're in control — accept what you're comfortable with, or
                    decline everything except the essentials.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Read our{" "}
                    <Link to="/privacy" className="font-bold underline hover:text-neo-yellow">
                      Privacy Policy
                    </Link>{" "}
                    for the full details.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t-2 border-foreground/20 pt-4">
                <Button className={btnYellow} onClick={acceptAll}>
                  <Check className="size-4" />
                  Accept all
                </Button>
                <Button variant="outline" className={btnGhost} onClick={declineAll}>
                  <X className="size-4" />
                  Decline
                </Button>
                <Button
                  variant="outline"
                  className={cn(btnGhost, "ml-auto")}
                  onClick={() => setSettingsOpen(true)}
                >
                  <Cookie className="size-4" />
                  Customize
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
