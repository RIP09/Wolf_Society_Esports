import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/Loading";
import { EmptyState, NeoCard, PageHeader, StatusBadge } from "@/components/neo";
import { btnGhost, btnYellow } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { CalendarClock, Check, Minus, Swords, X } from "lucide-react";
import { useState } from "react";
import { Navigate } from "react-router";
import { toast } from "sonner";

function fmt12(h: number, m: number) {
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${period}`;
}

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function PlayerSchedule() {
  const data = useQuery(api.schedules.mySchedule);
  const setConf = useMutation(api.schedules.setMyConfirmation);
  const [busy, setBusy] = useState<string | null>(null);

  const handleSet = async (blockId: string, date: number, status: "confirmed" | "declined" | "maybe" | "none") => {
    if (busy) return;
    setBusy(`${blockId}:${date}`);
    try {
      await setConf({ blockId: blockId as Id<"routineBlocks">, date, status });
      toast.success(status === "none" ? "Response cleared." : `Marked as ${status}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save your response.");
    } finally {
      setBusy(null);
    }
  };

  if (!data) return <LoadingScreen label="Loading your schedule…" />;
  if (!data.profile) return <Navigate to="/player/register" replace />;

  const today = startOfDay(Date.now());
  const weekStart = data.days[0]?.date ?? today;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Wolf Society Esports · The Pack"
        title="My schedule"
        description={
          data.teamName
            ? `Your ${data.teamName} week — attendance syncs to management live.`
            : "Your weekly routine — attendance syncs to management live."
        }
        actions={
          <Button variant="outline" className={btnGhost} disabled>
            <CalendarClock className="size-4" />
            Next 7 days
          </Button>
        }
      />

      {data.days.every((d) => d.blocks.length === 0) ? (
        <EmptyState
          title="No routine blocks for you yet"
          description="Management in The Den builds the weekly template. Blocks assigned to your team or game will appear here — check back soon."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {data.days.map((day) => {
            const isToday = day.date === today;
            const dayLabel = isToday
              ? "Today"
              : day.date === weekStart + 24 * 60 * 60 * 1000
                ? "Tomorrow"
                : new Date(day.date).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
            if (day.blocks.length === 0) return null;
            return (
              <NeoCard key={day.date} className="gap-0 p-0">
                <div className={cn("flex items-center justify-between border-b-2 border-foreground px-5 py-3", isToday ? "bg-neo-yellow" : "bg-neo-cream")}>
                  <h2 className="font-bold">{dayLabel}</h2>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {new Date(day.date).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
                  </span>
                </div>
                <div className="divide-y-2 divide-foreground/10">
                  {day.blocks.map((b) => (
                    <div key={b._id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-foreground bg-neo-yellow font-mono text-[10px] font-bold">
                          {fmt12(b.startHour, b.startMinute)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold">{b.title}</p>
                            <StatusBadge status={b.type} />
                            {b.required ? <StatusBadge status="urgent">required</StatusBadge> : null}
                          </div>
                          <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {b.game} · {b.durationMin} min{b.location ? ` · ${b.location}` : ""}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-neo-green">{b.confirmed} confirmed</span>
                            {b.declined > 0 ? <span className="text-neo-red"> · {b.declined} out</span> : null}
                            {b.maybe > 0 ? <span className="text-muted-foreground"> · {b.maybe} maybe</span> : null}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Button
                          size="sm"
                          className={cn(
                            "neo-press rounded-none border-2 border-foreground shadow-[2px_2px_0_0_var(--neo-ink)]",
                            b.myStatus === "confirmed"
                              ? "bg-neo-green text-white"
                              : "bg-background hover:bg-neo-green/20",
                          )}
                          disabled={busy === `${b._id}:${day.date}`}
                          onClick={() => handleSet(b._id, day.date, "confirmed")}
                        >
                          <Check className="size-3.5" />
                          Confirm
                        </Button>
                        <Button
                          size="sm"
                          className={cn(
                            "neo-press rounded-none border-2 border-foreground shadow-[2px_2px_0_0_var(--neo-ink)]",
                            b.myStatus === "maybe" ? "bg-neo-yellow text-white" : "bg-background hover:bg-neo-cream",
                          )}
                          disabled={busy === `${b._id}:${day.date}`}
                          onClick={() => handleSet(b._id, day.date, "maybe")}
                        >
                          <Minus className="size-3.5" />
                          Maybe
                        </Button>
                        <Button
                          size="sm"
                          className={cn(
                            "neo-press rounded-none border-2 border-foreground shadow-[2px_2px_0_0_var(--neo-ink)]",
                            b.myStatus === "declined" ? "bg-neo-red text-white" : "bg-background hover:bg-neo-red/20",
                          )}
                          disabled={busy === `${b._id}:${day.date}`}
                          onClick={() => handleSet(b._id, day.date, "declined")}
                        >
                          <X className="size-3.5" />
                          Can't make
                        </Button>
                        {b.myStatus ? (
                          <Button size="sm" variant="outline" className={btnGhost} disabled={busy === `${b._id}:${day.date}`} onClick={() => handleSet(b._id, day.date, "none")}>
                            Clear
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </NeoCard>
            );
          })}
        </div>
      )}

      <NeoCard className="gap-0 p-0">
        <div className="flex items-center justify-between border-b-2 border-foreground px-5 py-4">
          <h2 className="flex items-center gap-2 font-bold">
            <Swords className="size-4" />
            My scrims
          </h2>
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            confirmed fixtures + reminders
          </span>
        </div>
        <div className="flex flex-col divide-y-2 divide-foreground/10">
          {data.scrims.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">
              No scrims scheduled for your team. When management confirms one, you'll get an
              email, SMS and Discord reminder automatically — and it shows up here.
            </p>
          ) : (
            data.scrims.map((s) => (
              <div key={s._id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold">{s.title}</p>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="truncate font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    vs {s.opponentName} · {s.game} · {s.format ?? "TBD"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-xs font-bold tabular-nums">
                    {new Date(s.scheduledAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground">
                    {s.scheduledAt >= Date.now()
                      ? Math.max(0, Math.round((s.scheduledAt - Date.now()) / 3600000)) + "h away"
                      : "happening now"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </NeoCard>

      <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <CalendarClock className="size-3.5" />
        Your confirmations appear in The Den instantly — this page is a live database view.
      </p>
    </div>
  );
}
