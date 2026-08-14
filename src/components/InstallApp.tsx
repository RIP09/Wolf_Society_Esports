import { Button } from "@/components/ui/button";
import { btnGhost, btnYellow, card } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  CheckCircle2,
  Crosshair,
  Download,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

/** Chrome/Edge fire this before showing the native install UI. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const OPEN_EVENT = "wse-open-install";

const ANDROID_APPS = [
  {
    name: "Wolf Pack",
    tag: "Players app",
    desc: "Daily attendance check-ins, match reports, verified badges and your performance dashboard.",
    pkg: "gg.wolfsociety.pack",
    color: "bg-neo-green",
    repo: "https://github.com/RIP09/Wolf_Society_Esports/tree/main/mobile/wolf-players",
    icon: Crosshair,
  },
  {
    name: "Wolf Den",
    tag: "Management app",
    desc: "Approve & suspend players, run the attendance board, review reports and watch the org live.",
    pkg: "gg.wolfsociety.den",
    color: "bg-neo-yellow",
    repo: "https://github.com/RIP09/Wolf_Society_Esports/tree/main/mobile/wolf-management",
    icon: ShieldCheck,
  },
  {
    name: "Wolf Coach",
    tag: "AI training app",
    desc: "AI coaching chat, weekly training plans, drill library and performance analytics.",
    pkg: "gg.wolfsociety.coach",
    color: "bg-neo-blue",
    repo: "https://github.com/RIP09/Wolf_Society_Esports/tree/main/mobile/wolf-coaching",
    icon: Bot,
  },
] as const;

/** Opens the install modal from anywhere (used by the homepage hero button). */
export function openInstallApp() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function InstallAppButton({
  className,
  label = "Install app",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <Button onClick={openInstallApp} className={cn(btnGhost, "h-11 px-6 text-sm", className)}>
      <Smartphone className="size-4" />
      {label}
    </Button>
  );
}

/** The install modal — one-tap web-app install (PWA) + the three Android apps. */
export function InstallAppModal() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  const [pwaBusy, setPwaBusy] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener(OPEN_EVENT, onOpen);
    };
  }, []);

  const installPwa = async () => {
    if (!deferred) return;
    setPwaBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      // user dismissed the prompt — keep the modal open
    }
    setDeferred(null);
    setPwaBusy(false);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-foreground/60 p-4"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              card,
              "relative w-full max-w-lg overflow-hidden bg-card p-6 sm:p-8",
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close install dialog"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center border-2 border-foreground bg-background hover:bg-neo-cream"
            >
              <X className="size-4" />
            </button>

            <div className="mb-4 inline-block border-2 border-foreground bg-neo-yellow px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
              Wolf Society apps
            </div>
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Take the Pack anywhere.
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Install the web app for one-tap access on any phone or desktop — or grab
              the dedicated Android apps. All of them run on the same live database, so
              attendance, reports and approvals sync instantly everywhere.
            </p>

            {/* Web app install */}
            <div
              className={cn(
                card,
                "mt-5 flex flex-col gap-3 bg-neo-cream p-4 sm:flex-row sm:items-center sm:justify-between",
              )}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-foreground bg-foreground text-background">
                  <Smartphone className="size-5" />
                </span>
                <div>
                  <p className="font-bold leading-tight">Install the web app</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {installed
                      ? "Installed — find Wolf Society in your app list."
                      : deferred
                        ? "One tap — works on any Android phone, tablet or desktop browser."
                        : "Open the browser menu and choose “Add to Home screen”."}
                  </p>
                </div>
              </div>
              {deferred && !installed ? (
                <Button
                  onClick={installPwa}
                  className={cn(btnYellow, "shrink-0")}
                  disabled={pwaBusy}
                >
                  <Download className="size-4" />
                  {pwaBusy ? "Installing…" : "Install now"}
                </Button>
              ) : installed ? (
                <span className="flex shrink-0 items-center gap-1.5 border-2 border-foreground bg-neo-green px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white">
                  <CheckCircle2 className="size-4" />
                  Installed
                </span>
              ) : null}
            </div>

            <div className="my-5 flex items-center gap-3">
              <span className="h-0.5 flex-1 bg-foreground/20" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Dedicated Android apps
              </span>
              <span className="h-0.5 flex-1 bg-foreground/20" />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {ANDROID_APPS.map((app) => (
                <a
                  key={app.name}
                  href={app.repo}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    card,
                    "neo-press group flex flex-col gap-2 p-4",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center border-2 border-foreground text-white",
                      app.color,
                    )}
                  >
                    <app.icon className="size-4" />
                  </span>
                  <div>
                    <p className="font-bold leading-tight">{app.name}</p>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      {app.tag}
                    </p>
                  </div>
                  <p className="text-[11px] leading-4 text-muted-foreground">{app.desc}</p>
                  <p className="mt-auto break-all font-mono text-[9px] text-muted-foreground/70">
                    {app.pkg}
                  </p>
                </a>
              ))}
            </div>

            <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
              All three apps support Android 6.0+ — same data as the website, in real time
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The homepage "Get the apps" band — install button lives here (and in the hero). */
export function InstallSection() {
  return (
    <section className="border-y-2 border-foreground bg-neo-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-col gap-2">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Install · Android 6.0+ & web
          </p>
          <h2 className="text-3xl font-bold tracking-tight">Get the Wolf Society apps</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            One shared database behind everything. Check in for attendance, file match
            reports, approve players and talk to the AI coach — from the website or a
            dedicated app, with every update synced live.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Web app install card */}
          <InstallAppButtonCard />
          {ANDROID_APPS.map((app) => (
            <a
              key={app.name}
              href={app.repo}
              target="_blank"
              rel="noreferrer"
              className={cn(card, "neo-press group flex flex-col gap-3 p-5")}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center border-2 border-foreground text-white",
                  app.color,
                )}
              >
                <app.icon className="size-5" />
              </span>
              <div>
                <p className="text-lg font-bold leading-tight">{app.name}</p>
                <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {app.tag}
                </p>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">{app.desc}</p>
              <p className="mt-auto break-all font-mono text-[9px] text-muted-foreground/70">
                {app.pkg}
              </p>
              <span className="mt-1 flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-neo-blue transition-transform group-hover:translate-x-1">
                <Download className="size-3.5" />
                Get the app
              </span>
            </a>
          ))}
        </div>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          The dedicated apps connect to the same secure backend as this site — one source
          of truth, zero copying.
        </p>
      </div>
      <InstallAppModal />
    </section>
  );
}

/** Web-app install tile used inside the band. */
function InstallAppButtonCard() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) {
      openInstallApp();
      return;
    }
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      // dismissed
    }
    setDeferred(null);
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={install}
      className={cn(card, "neo-press group flex flex-col gap-3 p-5 text-left")}
    >
      <span className="flex h-11 w-11 items-center justify-center border-2 border-foreground bg-foreground text-background">
        <Smartphone className="size-5" />
      </span>
      <div>
        <p className="text-lg font-bold leading-tight">Web app</p>
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
          {installed ? "Installed" : "Any device"}
        </p>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        {installed
          ? "Wolf Society is on your home screen — open it like any other app."
          : "One-tap install on Android, iPhone or desktop. Offline-ready and gets all push alerts."}
      </p>
      <span className="mt-auto flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-neo-blue">
        {installed ? (
          <CheckCircle2 className="size-3.5" />
        ) : (
          <Download className="size-3.5" />
        )}
        {installed ? "Installed" : busy ? "Installing…" : "Install web app"}
      </span>
    </button>
  );
}
