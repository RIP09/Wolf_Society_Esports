import { format } from "date-fns";

export function fmtDate(ts: number) {
  return format(new Date(ts), "MMM d, yyyy");
}

export function fmtDateTime(ts: number) {
  return format(new Date(ts), "MMM d, HH:mm");
}

export function fmtDay(ts: number) {
  return format(new Date(ts), "MMM d");
}

export function fmtShort(ts: number) {
  return format(new Date(ts), "MMM d, HH:mm");
}

export function fmtRelative(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return fmtDate(ts);
}

export function fmtPrize(prize?: number) {
  if (!prize || prize <= 0) return "—";
  return `$${prize.toLocaleString("en-US")}`;
}

export function fmtNum(n?: number) {
  return n?.toLocaleString("en-US") ?? "—";
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

export function tsToDateInput(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dateInputToTs(value: string) {
  if (!value) return 0;
  return new Date(`${value}T12:00:00`).getTime();
}

export function fmtKd(kills: number, deaths: number) {
  if (deaths <= 0) return kills > 0 ? kills.toFixed(1) : "0.0";
  return (kills / deaths).toFixed(2);
}
