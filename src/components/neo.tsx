import { cn } from "@/lib/utils";
import { card } from "@/lib/neo";
import type { ReactNode } from "react";

/** Neo card — square, 2px border, hard offset shadow. */
export function NeoCard({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn(card, className)} {...props}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "yellow" | "orange" | "green" | "blue" | "red" | "purple" | "cream";
}) {
  const colors: Record<string, string> = {
    yellow: "bg-neo-yellow",
    orange: "bg-neo-orange",
    green: "bg-neo-green",
    blue: "bg-neo-blue text-white",
    red: "bg-neo-red text-white",
    purple: "bg-neo-purple text-white",
    cream: "bg-neo-cream",
  };
  return (
    <NeoCard className="gap-1 px-5 py-4">
      <span
        className={cn(
          "inline-block h-2.5 w-2.5 border-2 border-foreground",
          colors[accent ?? "yellow"],
        )}
      />
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </NeoCard>
  );
}

/** Status → flat premium chip classes. */
const STATUS_COLORS: Record<string, string> = {
  active: "bg-neo-green text-white",
  approved: "bg-neo-green text-white",
  completed: "bg-neo-green text-white",
  win: "bg-neo-green text-white",
  pending: "bg-neo-cream text-foreground",
  upcoming: "bg-neo-cream text-foreground",
  scheduled: "bg-neo-cream text-foreground",
  info: "bg-neo-cream text-foreground",
  suspended: "bg-neo-red text-white",
  rejected: "bg-neo-red text-white",
  cancelled: "bg-neo-red text-white",
  loss: "bg-neo-red text-white",
  urgent: "bg-neo-red text-white",
  live: "bg-neo-orange text-white",
  draw: "bg-neo-cream text-foreground",
  important: "bg-neo-blue text-white",
  ranked: "bg-neo-blue text-white",
  scrim: "bg-neo-cream text-foreground",
  tournament: "bg-neo-orange text-white",
  tryout: "bg-neo-yellow text-white",
  admin: "bg-neo-yellow text-white",
  superadmin: "bg-neo-yellow text-white",
  granted: "bg-neo-green text-white",
  player: "bg-neo-blue text-white",
  member: "bg-neo-cream text-foreground",
  user: "bg-neo-cream text-foreground",
};

export function StatusBadge({
  status,
  className,
  children,
}: {
  status: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-none border-2 border-foreground px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider",
        STATUS_COLORS[status] ?? "bg-neo-cream text-foreground",
        className,
      )}
    >
      {children ?? status}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-foreground/40 bg-card px-6 py-14 text-center">
      <span className="inline-block h-3 w-3 border-2 border-foreground bg-neo-yellow" />
      <p className="text-lg font-bold">{title}</p>
      {description ? <p className="max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function NeoField({
  label,
  children,
  hint,
  className,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
        {label}
      </span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </div>
  );
}
