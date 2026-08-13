import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/neo";
import { fmtRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { BellRing, Megaphone, Radio, Send } from "lucide-react";
import { Link } from "react-router";

/**
 * Realtime notification bell for both portals. Everything is a live Convex
 * subscription — the moment The Den posts an announcement (or a delivery
 * lands), the badge and list update without a refresh.
 */
export function NotificationBell({ variant = "player" }: { variant?: "player" | "admin" }) {
  // Announcements are public; the delivery outbox is admin-only (skip when not).
  const announcements = useQuery(api.public.listAnnouncements);
  const notifications = useQuery(api.notify.listRecent, variant === "admin" ? {} : "skip");

  if (variant === "player") {
    const recent = (announcements ?? []).filter(
      (a) => Date.now() - a.createdAt < 7 * 24 * 60 * 60 * 1000,
    );
    const count = recent.length;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Announcements"
            title="Announcements"
            className="relative size-9 shrink-0 rounded-none border-2 border-foreground bg-background shadow-[2px_2px_0_0_var(--neo-ink)] hover:bg-neo-cream hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
          >
            <BellRing className="size-4" />
            {count > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center border-2 border-foreground bg-neo-red px-1 font-mono text-[9px] font-bold text-white">
                {count}
              </span>
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 rounded-none border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--neo-ink)]">
          <DropdownMenuLabel className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Megaphone className="size-3.5" />
              Announcements
            </span>
            <span className="flex items-center gap-1.5 text-neo-green">
              <Radio className="size-3" />
              live
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!announcements ? (
            <div className="h-16 animate-pulse" />
          ) : announcements.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nothing broadcast yet.
            </p>
          ) : (
            <>
              {announcements.slice(0, 5).map((a) => (
                <DropdownMenuItem
                  key={a._id}
                  asChild
                  className="cursor-pointer rounded-none px-4 py-3"
                >
                  <Link to="/player/announcements" className="flex flex-col items-start gap-1">
                    <span className="flex items-center gap-2">
                      <StatusBadge status={a.priority}>{a.priority}</StatusBadge>
                      <span className="text-xs font-bold leading-tight">{a.title}</span>
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                      {fmtRelative(a.createdAt)}
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer rounded-none">
                <Link
                  to="/player/announcements"
                  className="flex items-center justify-center gap-1 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                >
                  View all announcements →
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // ---- Admin variant: the live delivery outbox (email / SMS / Discord / webhook) ----
  const failed = (notifications ?? []).filter((n) => n.status === "failed").length;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Delivery outbox"
          title="Notification deliveries"
          className="relative size-9 shrink-0 rounded-none border-2 border-foreground bg-background shadow-[2px_2px_0_0_var(--neo-ink)] hover:bg-neo-cream hover:shadow-[3px_3px_0_0_var(--neo-ink)]"
        >
          <BellRing className="size-4" />
          {failed > 0 ? (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center border-2 border-foreground bg-neo-red px-1 font-mono text-[9px] font-bold text-white">
              {failed}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 rounded-none border-2 border-foreground bg-card shadow-[4px_4px_0_0_var(--neo-ink)]">
        <DropdownMenuLabel className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Send className="size-3.5" />
            Delivery outbox
          </span>
          <span className="flex items-center gap-1.5 text-neo-green">
            <Radio className="size-3" />
            live
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!notifications ? (
          <div className="h-16 animate-pulse" />
        ) : notifications.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No notifications sent yet.
          </p>
        ) : (
          <>
            {notifications.slice(0, 7).map((n) => (
              <div key={n._id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{n.subject || n.channel}</p>
                  <p className="truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                    {n.channel}
                    {n.error ? ` · ${n.error}` : ""} · {fmtRelative(n.createdAt)}
                  </p>
                </div>
                <StatusBadge
                  status={n.status === "sent" ? "approved" : n.status === "failed" ? "urgent" : "pending"}
                  className={cn("shrink-0")}
                >
                  {n.status}
                </StatusBadge>
              </div>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer rounded-none">
              <Link
                to="/admin"
                className="flex items-center justify-center gap-1 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Open command center →
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
