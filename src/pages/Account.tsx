import { api } from "@/convex/_generated/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { useAuth } from "@/hooks/use-auth";
import { fmtRelative } from "@/lib/format";
import { btnGhost, btnYellow, input, label } from "@/lib/neo";
import { pushEnabled, serializeSubscription, subscribeToPush } from "@/lib/push";
import { cn } from "@/lib/utils";
import { getVisitorId } from "@/lib/visitor";
import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  BellRing,
  Check,
  KeyRound,
  Loader2,
  LogOut,
  Mail,
  MessageSquareHeart,
  Phone,
  Send,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

/**
 * Public account hub — for players, staff and community members alike.
 * Manage your alert subscription (email + phone), push notifications,
 * leave feedback, and see your recent notification history.
 */
export default function Account() {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const account = useQuery(api.account.getMyAccount);
  const notifications = useQuery(api.account.getMyNotifications);

  const upsertAlerts = useMutation(api.account.upsertAlertSubscription);
  const unsubscribeAlerts = useMutation(api.account.unsubscribeAlerts);
  const savePush = useMutation(api.account.savePushSubscription);
  const removePush = useMutation(api.account.removePushSubscription);
  const submitFeedback = useMutation(api.account.submitFeedback);

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [pushState, setPushState] = useState<"checking" | "active" | "off" | "unsupported">("checking");
  const [rating, setRating] = useState<number | null>(null);
  const [fbMessage, setFbMessage] = useState("");
  const [fbName, setFbName] = useState("");
  const [sendingFb, setSendingFb] = useState(false);

  // Permanent self-deletion of the whole public account.
  const purgeMyAccount = useMutation(api.account.purgeMyAccount);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Prefill the alert form from the account query once it arrives.
  useEffect(() => {
    if (account) {
      setEmail((e) => e || account.email || "");
      setPhone((p) => p || account.subscriber?.phone || "");
    }
  }, [account]);

  // Detect push state on this device.
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

  const togglePush = async () => {
    if (pushState === "active") {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        try {
          await removePush({ endpoint: sub.endpoint });
        } catch {
          // ignore
        }
        await sub.unsubscribe();
      }
      setPushState("off");
      toast.success("Push notifications turned off for this device.");
      return;
    }
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
        // stored copy is a bonus
      }
      setPushState("active");
      toast.success("Push notifications enabled on this device!");
    } else {
      setPushState("off");
      toast.error("Could not enable push — allow browser notifications first, or add VITE_VAPID_PUBLIC_KEY.");
    }
  };

  const saveAlerts = async () => {
    if (!email.trim()) {
      toast.error("Enter your email address to receive alerts.");
      return;
    }
    setSavingAlerts(true);
    try {
      await upsertAlerts({ email: email.trim(), phone: phone.trim() || undefined, active: true });
      toast.success("Alert subscription updated — you'll get email and SMS updates.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update your subscription.");
    } finally {
      setSavingAlerts(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await unsubscribeAlerts({});
      toast.success("You've been unsubscribed from email/SMS alerts.");
    } catch {
      toast.error("Could not unsubscribe — please try again.");
    }
  };

  const sendFeedback = async () => {
    if (fbMessage.trim().length < 5) {
      toast.error("Please write a little more (at least 5 characters).");
      return;
    }
    setSendingFb(true);
    try {
      await submitFeedback({
        message: fbMessage.trim(),
        name: fbName.trim() || undefined,
        email: account?.email ?? undefined,
        rating: rating ?? undefined,
      });
      toast.success("Thanks! Your feedback is with the organization.");
      setFbMessage("");
      setFbName("");
      setRating(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit feedback.");
    } finally {
      setSendingFb(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Defensive: the route is already wrapped in RequireAuth, but never render
  // this page unauthenticated (side-effect redirect, not a render navigation).
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth?returnTo=%2Faccount");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (!isLoading && !isAuthenticated) {
    return null;
  }

  return (
    <div className="neo-grid-bg min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <PageHeader
          eyebrow="Wolf Society Esports · Public portal"
          title="My account"
          description="Manage how the organization reaches you — alerts, push notifications and feedback — all in one place."
          actions={
            <Button className={btnGhost} onClick={handleSignOut} disabled={isLoading}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          }
        />

        {/* Identity */}
        <NeoCard className="gap-4 p-5">
          <div className="flex items-center gap-2">
            <UserRound className="size-5" />
            <h2 className="font-bold">Your identity</h2>
          </div>
          {isLoading || account === undefined ? (
            <div className="h-16 animate-pulse" />
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="border-2 border-foreground bg-neo-cream px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest">
                  {account.name || "Community member"}
                </span>
                {account.isAnonymous ? (
                  <StatusBadge status="pending">Guest account</StatusBadge>
                ) : account.emailVerified ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-neo-green">
                    <Check className="size-3.5" /> Email verified
                  </span>
                ) : (
                  <StatusBadge status="pending">Email not verified</StatusBadge>
                )}
              </div>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4" />
                {account.email ?? "Anonymous — no email on this account"}
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                Verification: signing in by email uses a one-time code sent to your inbox
                (never a stored password). Staff accounts are additionally protected by
                per-user credentials issued by the organization.
              </p>
            </div>
          )}
        </NeoCard>

        {/* Alert subscription */}
        <NeoCard className="gap-4 p-5">
          <div className="flex items-center gap-2">
            <BellRing className="size-5" />
            <h2 className="font-bold">Alerts &amp; updates</h2>
          </div>
          {account === undefined ? (
            <div className="h-16 animate-pulse" />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <span className={label}>Email</span>
                  <Input
                    className={input}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className={label}>Contact number (with country code)</span>
                  <Input
                    className={input}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Announcements, news and urgent updates are sent to your email and SMS, plus
                a free, unlimited web push to this device. You can unsubscribe anytime.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button className={btnYellow} onClick={saveAlerts} disabled={savingAlerts || isLoading}>
                  {savingAlerts ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  {savingAlerts ? "Saving…" : "Save alerts"}
                </Button>
                {account.subscriber?.active && (
                  <Button variant="outline" className={btnGhost} onClick={handleUnsubscribe}>
                    Unsubscribe all
                  </Button>
                )}
                {account.subscriber && (
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <StatusBadge status={account.subscriber.active ? "approved" : "pending"}>
                      {account.subscriber.active ? "Subscribed" : "Unsubscribed"}
                    </StatusBadge>
                    {account.subscriber.phone && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="size-3.5" /> {account.subscriber.phone}
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
        </NeoCard>

        {/* Push notifications */}
        <NeoCard className="gap-4 p-5">
          <div className="flex items-center gap-2">
            <BellRing className="size-5" />
            <h2 className="font-bold">Always-on push (free &amp; unlimited)</h2>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            Unlike browser alerts (which need the tab open), web push delivers updates even
            when the site is closed. It uses VAPID — free forever, no per-message cost, and
            every major browser supports it.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className={pushState === "active" ? btnGhost : btnYellow}
              onClick={togglePush}
              disabled={pushState === "checking"}
            >
              {pushState === "checking" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : pushState === "active" ? (
                <ShieldCheck className="size-4" />
              ) : (
                <BellRing className="size-4" />
              )}
              {pushState === "checking"
                ? "Checking…"
                : pushState === "active"
                  ? "Disable push on this device"
                  : "Enable push on this device"}
            </Button>
            <span
              className={cn(
                "font-mono text-[10px] font-bold uppercase tracking-widest",
                pushState === "active" ? "text-neo-green" : "text-muted-foreground",
              )}
            >
              {pushState === "active"
                ? "Active on this device"
                : pushState === "unsupported"
                  ? "Unsupported browser"
                  : "Not enabled"}
            </span>
          </div>
        </NeoCard>

        {/* Feedback */}
        <NeoCard className="gap-4 p-5">
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="size-5" />
            <h2 className="font-bold">Send feedback</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className={label}>How's the experience?</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center border-2 border-foreground",
                      rating !== null && n <= rating
                        ? "bg-neo-yellow text-white"
                        : "bg-background text-muted-foreground hover:bg-neo-cream",
                    )}
                  >
                    <Star className="size-4" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className={label}>Your message</span>
              <Textarea
                className="min-h-20 rounded-none border-2 border-foreground bg-background"
                value={fbMessage}
                onChange={(e) => setFbMessage(e.target.value)}
                placeholder="What should we improve, fix or add?"
                maxLength={2000}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button className={btnYellow} onClick={sendFeedback} disabled={sendingFb}>
                {sendingFb ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {sendingFb ? "Sending…" : "Send feedback"}
              </Button>
            </div>
          </div>
        </NeoCard>

        {/* Notification history */}
        <NeoCard className="gap-0 p-0">
          <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
            <h2 className="flex items-center gap-2 font-bold">
              <KeyRound className="size-4" />
              Recent notifications
            </h2>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              your deliveries · live
            </span>
          </div>
          {notifications === undefined ? (
            <div className="h-24 animate-pulse" />
          ) : notifications.length === 0 ? (
            <EmptyState
              title="Nothing delivered yet"
              description="When the organization sends you an email, SMS or push update, it will show up here."
            />
          ) : (
            <div className="flex flex-col divide-y-2 divide-foreground/10">
              {notifications.map((n) => (
                <div key={n._id} className="flex items-center justify-between gap-2 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{n.subject || n.channel}</p>
                    <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {n.channel}
                      {n.error ? ` · ${n.error}` : ""} · {fmtRelative(n.createdAt)}
                    </p>
                  </div>
                  <StatusBadge
                    status={n.status === "sent" ? "approved" : n.status === "failed" ? "urgent" : "pending"}
                  >
                    {n.status}
                  </StatusBadge>
                </div>
              ))}
            </div>
          )}
        </NeoCard>

        {/* Danger zone — permanent self-service deletion of ALL account data */}
        <NeoCard className="gap-4 border-2 border-neo-red/70 p-6">
          <div className="flex flex-col gap-1">
            <h2 className="flex items-center gap-2 font-bold text-neo-red">
              <AlertTriangle className="size-5" />
              Danger zone
            </h2>
            <p className="text-xs leading-5 text-muted-foreground">
              Permanently delete your account and every piece of your data from the
              public portal — your Fan Zone profile (XP, votes, trivia answers and
              predictions), any player registration, alert subscriptions, push
              notifications, feedback and your login itself. This cannot be undone,
              and you would have to register from scratch to come back.
            </p>
          </div>
          <div>
            <Button
              type="button"
              className="neo-press rounded-none border-2 border-foreground bg-neo-red px-4 py-2 text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
              onClick={() => setDeleteOpen(true)}
              disabled={deleting}
            >
              <Trash2 className="size-4" />
              Delete my data permanently
            </Button>
          </div>
        </NeoCard>

        <AlertDialog open={deleteOpen} onOpenChange={(o) => !o && !deleting && setDeleteOpen(false)}>
          <AlertDialogContent className="rounded-none border-2 border-foreground bg-card shadow-[6px_6px_0_0_var(--neo-ink)]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-xl font-bold">
                <AlertTriangle className="size-5 text-neo-red" />
                Delete your account forever?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-6 text-muted-foreground">
                This permanently deletes your Fan Zone profile and XP, every poll vote,
                trivia answer and prediction you made, any player registration, your
                alert subscription, this device's push notification and your login
                account. Management will also see you removed from the system
                instantly. There is no undo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="rounded-none border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)]"
                disabled={deleting}
              >
                Keep my account
              </AlertDialogCancel>
              <AlertDialogAction
                className="neo-press rounded-none border-2 border-foreground bg-neo-red text-white shadow-[3px_3px_0_0_var(--neo-ink)] hover:shadow-[4px_4px_0_0_var(--neo-ink)]"
                disabled={deleting}
                onClick={(e) => {
                  e.preventDefault();
                  void (async () => {
                    setDeleting(true);
                    try {
                      await purgeMyAccount({ visitorId: getVisitorId() });
                      toast.success("Your account and all data were permanently deleted.");
                      setDeleteOpen(false);
                      await signOut().catch(() => {
                        // account is already gone — the redirect below is enough
                      });
                      navigate("/", { replace: true });
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not delete your data.");
                      setDeleting(false);
                    }
                  })();
                }}
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                {deleting ? "Deleting…" : "Delete everything"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
