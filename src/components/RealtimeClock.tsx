import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function to12Hour(date: Date) {
  const hours24 = date.getHours();
  const period = hours24 >= 12 ? "PM" : "AM";
  const hours = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return {
    time: `${pad(hours)}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    period,
  };
}

/**
 * Realtime clock — ticks every second and renders the visitor's local time
 * in 12-hour format (e.g. "09:41:23 PM"). A pulsing dot marks it as live.
 */
export function RealtimeClock({
  className,
  showDate = true,
}: {
  className?: string;
  showDate?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { time, period } = to12Hour(now);
  const date = now.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex size-2 shrink-0" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neo-red opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-neo-red" />
      </span>
      {showDate && <span className="hidden sm:inline">{date}</span>}
      <span className="tabular-nums">
        {time} <span className="opacity-70">{period}</span>
      </span>
    </div>
  );
}

export default RealtimeClock;
