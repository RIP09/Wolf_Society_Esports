import logo from "@/assets/logo.svg";
import { cn } from "@/lib/utils";

/**
 * The official Wolf Society Esports mark — the howling wolf on a white neo
 * tile. `shadow` drops the hard neo shadow; set `rounded` for circular uses.
 */
export function WolfMark({
  size = 36,
  className,
  shadow = true,
  title = "Wolf Society Esports",
  src,
}: {
  size?: number;
  className?: string;
  shadow?: boolean;
  title?: string;
  /** Optional override image (set by management via The Den → Organization logo). */
  src?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden border-2 border-foreground bg-white",
        shadow && "shadow-[3px_3px_0_0_var(--neo-ink)]",
        className,
      )}
      style={{ width: size, height: size }}
      title={title}
    >
      <img
        src={src || logo}
        alt={title}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        draggable={false}
      />
    </span>
  );
}

/** Brand lockup — wolf mark + "Wolf Society Esports" wordmark + tag line. */
export function WolfLogo({
  tag = "Esports Organization",
  size = 36,
  className,
  logoUrl,
}: {
  tag?: string;
  size?: number;
  className?: string;
  /** Optional override image (set by management via The Den → Organization logo). */
  logoUrl?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <WolfMark size={size} src={logoUrl} />
      <div className="leading-none">
        <p className="text-base font-bold leading-tight tracking-tight">Wolf Society Esports</p>
        <p className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
          {tag}
        </p>
      </div>
    </div>
  );
}
