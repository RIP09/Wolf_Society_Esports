import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { btnYellow, card } from "@/lib/neo";
import { pushEnabled, serializeSubscription, subscribeToPush } from "@/lib/push";
import { cn } from "@/lib/utils";
import { getVisitorId } from "@/lib/visitor";
import { marketingAllowed } from "@/lib/consent";
import { useMutation, useQuery } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BellRing,
  Camera,
  Check,
  LocateFixed,
  Mic,
  MonitorUp,
  ShieldCheck,
  ShieldX,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Perm = "notifications" | "location" | "camera" | "microphone" | "screen";
type Status = "granted" | "denied" | "prompt" | "unavailable";

const STORAGE_KEY = "wse-permissions";
const LAST_ANNOUNCEMENT_KEY = "wse-last-announcement";

const DEFAULTS: Record<Perm, Status> = {
  notifications: "prompt",
  location: "prompt",
  camera: "prompt",
  microphone: "prompt",
  screen: "prompt",
};

const META: {
  key: Perm;
  name: string;
  desc: string;
  icon: typeof Bell;
  color: string;
}[] = [
  {
    key: "notifications",
    name: "Notifications",
    desc: "Browser alerts for every announcement, news and update — while you're on the site.",
    icon: BellRing,
    color: "bg-neo-yellow",
  },
  {
    key: "location",
    name: "Location",
    desc: "Used only to show your region on the roster pages. Never stored on our servers.",
    icon: LocateFixed,
    color: "bg-neo-blue",
  },
  {
    key: "camera",
    name: "Camera",
    desc: "Reserved for tryouts, interviews and stream check-ins.",
    icon: Camera,
    color: "bg-neo-green",
  },
  {
    key: "microphone",
    name: "Microphone",
    desc: "Reserved for voice check-ins during scrims and team meetings.",
    icon: Mic,
    color: "bg-neo-purple",
  },
  {
    key: "screen",
    name: "Screen share",
    desc: "Reserved for VOD reviews and coach screen checks.",
    icon: MonitorUp,
    color: "bg-neo-orange",
  },
];

function readStored(): Partial<Record<Perm, Status>> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<Record<Perm, Status>>;
  } catch {
    return {};
  }
}

function writeStored(next: Record<Perm, Status>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // private mode — ignore
  }
}

/**
 * Browser permission request panel (neo style, floating bottom-right).
 * Requests real Chrome permissions — notifications, location, camera, microphone
 * and screen share — and, when notifications are granted, fires a real browser
 * notification the moment a new announcement/news item is published (reactive
 * Convex subscription, not a simulation).
 */
export function PermissionCenter() {
  const [open, setOpen] = useState(false);
  const [statuses, setStatuses] = useState<Record<Perm, Status>>(() => ({
    ...DEFAULTS,
    ...readStored(),
  }));
  const [pushState, setPushState] = useState<
    "checking" | "active" | "off" | "unsupported"
  >("checking");
  const latestIdRef = useRef<string | null>(null);

  const announcements = useQuery(api.public.listAnnouncements);
  const savePush = useMutation(api.account.savePushSubscription);

  // Detect whether this device is already subscribed to web push.
  useEffect(() => {
    (async () => {
      if (!pushEnabled()) {
        setPushState("off");
        return;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setPushState("unsupported");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        setPushState(sub ? "active" : "off");
      } catch {
        setPushState("unsupported");
      }
    })();
  }, []);

  // Sync live browser permission state where queryable.
  useEffect(() => {
    const next = { ...DEFAULTS, ...readStored() };
    if (typeof window !== "undefined" && "Notification" in window) {
      next.notifications = window.Notification.permission as Status;
    }
    setStatuses(next);
    writeStored(next);

    if (navigator.permissions?.query) {
      (["geolocation", "camera", "microphone"] as PermissionName[]).forEach((name) => {
        navigator.permissions
          .query({ name })
          .then((r) => {
            const state = r.state as Status;
            const key =
              name === "geolocation" ? "location" : (name as "camera" | "microphone");
            setStatuses((s) => ({ ...s, [key]: state }));
          })
          .catch(() => {
            // permission name not queryable in this browser — keep stored state
          });
      });
    }
  }, []);

  // Auto-open the panel once per visitor so they know alerts exist — but only
  // when the visitor accepted marketing/alerts cookies.
  useEffect(() => {
    if (!marketingAllowed()) return;
    const t = window.setTimeout(() => {
      const stored = readStored();
      const anyAnswered = Object.values({ ...DEFAULTS, ...stored }).some(
        (s) => s === "granted" || s === "denied",
      );
      if (!anyAnswered) setOpen(true);
    }, 2500);
    return () => window.clearTimeout(t);
  }, []);

  const setStatus = (key: Perm, value: Status) => {
    setStatuses((s) => {
      const next = { ...s, [key]: value };
      writeStored(next);
      return next;
    });
  };

  // Realtime: fire a browser notification whenever a NEW announcement appears.
  useEffect(() => {
    if (!announcements?.length) return;
    const latest = announcements[0];
    latestIdRef.current = latest._id;
    const lastSeen = localStorage.getItem(LAST_ANNOUNCEMENT_KEY);
    if (
      lastSeen &&
      lastSeen !== latest._id &&
      statuses.notifications === "granted" &&
      document.visibilityState === "visible"
    ) {
      try {
        new Notification(
          `${latest.priority === "urgent" ? "🚨" : "📢"} ${latest.title}`,
          {
            body: latest.body.length > 140 ? `${latest.body.slice(0, 140)}…` : latest.body,
            tag: latest._id,
          },
        );
      } catch {
        // notifications unavailable in this context — ignore
      }
    }
    localStorage.setItem(LAST_ANNOUNCEMENT_KEY, latest._id);
  }, [announcements, statuses.notifications]);

  const enablePush = async () => {
    setPushState("checking");
    const sub = await subscribeToPush();
    if (sub) {
      const serialized = serializeSubscription(sub);
      try {
        await savePush({
          endpoint: serialized.endpoint,
          keysJson: serialized.keysJson,
          visitorId: getVisitorId(),
        });
      } catch {
        // the subscription still works in-browser — the stored copy is a bonus
      }
      setPushState("active");
    } else {
      setPushState("off");
    }
  };

  const requestNotifications = async () => {
    if (!("Notification" in window)) {
      setStatus("notifications", "unavailable");
      return;
    }
    const perm = await window.Notification.requestPermission();
    const status: Status =
      perm === "granted" ? "granted" : perm === "denied" ? "denied" : "prompt";
    setStatus("notifications", status);
    if (status === "granted") {
      try {
        new Notification("Wolf Society Esports", {
          body: "You're all set — new announcements will appear here the moment they go live.",
        });
      } catch {
        // ignore
      }
      void enablePush();
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus("location", "unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setStatus("location", "granted"),
      () => setStatus("location", "denied"),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  };

  const requestCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("camera", "unavailable");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setStatus("camera", "granted");
    } catch {
      setStatus("camera", "denied");
    }
  };

  const requestMicrophone = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("microphone", "unavailable");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setStatus("microphone", "granted");
    } catch {
      setStatus("microphone", "denied");
    }
  };

  const requestScreen = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setStatus("screen", "unavailable");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setStatus("screen", "granted");
    } catch {
      setStatus("screen", "denied");
    }
  };

  const requesters: Record<Perm, () => void> = {
    notifications: requestNotifications,
    location: requestLocation,
    camera: requestCamera,
    microphone: requestMicrophone,
    screen: requestScreen,
  };

  const grantedCount = Object.values(statuses).filter((s) => s === "granted").length;

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "neo-press fixed bottom-4 right-4 z-[85] flex items-center gap-2 border-2 border-foreground bg-card px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider shadow-[4px_4px_0_0_var(--neo-ink)] hover:shadow-[5px_5px_0_0_var(--neo-ink)]",
          statuses.notifications === "granted" ? "bg-neo-green text-white" : "bg-card",
        )}
        aria-label="Site permissions and alerts"
      >
        <Bell className="size-4" />
        {open ? "Close" : "Alerts"}
        <span
          className={cn(
            "ml-0.5 inline-block h-2 w-2 border border-foreground",
            grantedCount > 0 ? "bg-neo-green" : "bg-neo-yellow",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-20 right-4 z-[85] w-[min(22rem,calc(100vw-2rem))]"
            role="dialog"
            aria-label="Site permission requests"
          >
            <div className={cn(card, "gap-4 bg-card p-5")}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-bold tracking-tight">Stay in the loop</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Allow browser permissions so Wolf Society Esports can notify you about
                    announcements, news and updates in real time.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="shrink-0 border-2 border-foreground bg-background p-1 hover:bg-neo-cream"
                  aria-label="Close permissions panel"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="divide-y-2 divide-foreground/10 border-2 border-foreground bg-background">
                {META.map((item) => {
                  const status = statuses[item.key];
                  const granted = status === "granted";
                  const denied = status === "denied" || status === "unavailable";
                  return (
                    <div key={item.key} className="flex items-center gap-3 px-3 py-2.5">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center border-2 border-foreground text-white",
                          item.color,
                        )}
                      >
                        <item.icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 text-xs font-bold">
                          {item.name}
                          {granted ? (
                            <Check className="size-3 text-neo-green" />
                          ) : denied ? (
                            <ShieldX className="size-3 text-neo-red" />
                          ) : null}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[10px] leading-4 text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className={cn(
                          "shrink-0 rounded-none border-2 border-foreground px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                          granted
                            ? "bg-neo-green text-white shadow-none"
                            : "bg-background text-foreground shadow-[2px_2px_0_0_var(--neo-ink)] hover:bg-neo-cream",
                        )}
                        disabled={granted || status === "unavailable"}
                        onClick={requesters[item.key]}
                      >
                        {granted ? (
                          <>
                            <ShieldCheck className="size-3" /> On
                          </>
                        ) : status === "unavailable" ? (
                          "N/A"
                        ) : status === "denied" ? (
                          "Retry"
                        ) : (
                          "Enable"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <p className="border-t-2 border-foreground/20 pt-3 text-[10px] leading-4 text-muted-foreground">
                Chrome will show its own prompt for each permission — choose{" "}
                <span className="font-bold text-foreground">Allow</span> to activate. You can
                change these anytime in Chrome settings.
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  className={btnYellow}
                  disabled={statuses.notifications === "granted"}
                  onClick={requestNotifications}
                >
                  <BellRing className="size-4" />
                  {statuses.notifications === "granted"
                    ? "Notifications enabled"
                    : "Enable all updates"}
                </Button>
                <p
                  className={cn(
                    "flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-widest",
                    pushState === "active" ? "text-neo-green" : "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-1.5 w-1.5 border border-foreground",
                      pushState === "active" ? "bg-neo-green" : "bg-neo-yellow",
                    )}
                  />
                  {pushState === "active"
                    ? "Push active — updates arrive even when the site is closed (free, unlimited)"
                    : pushState === "unsupported"
                      ? "Web push unsupported in this browser"
                      : pushState === "off"
                        ? "Always-on push needs VITE_VAPID_PUBLIC_KEY — the org can enable it free"
                        : "Checking push support…"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
