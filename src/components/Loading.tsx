import { motion } from "framer-motion";
import logo from "@/assets/logo.svg";

const BRAND = "Wolf Society";

/** Howl ripple rings expanding behind the logo tile (neo squares). */
function RippleRings() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute border-2 border-foreground"
          initial={{ width: 72, height: 72, opacity: 0.9 }}
          animate={{ width: 300, height: 300, opacity: 0 }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeOut",
            delay: i * 0.8,
          }}
        />
      ))}
    </>
  );
}

/** The logo tile: stamps in with a neo hard shadow + shine sweep. */
function LogoTile() {
  return (
    <motion.span
      initial={{ scale: 0.3, rotate: -8, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 16 }}
      className="relative flex h-28 w-28 items-center justify-center overflow-hidden border-2 border-foreground bg-white shadow-[8px_8px_0_0_var(--neo-ink)]"
    >
      <img src={logo} alt="Wolf Society Esports" className="h-full w-full object-cover" draggable={false} />
      {/* shine sweep */}
      <motion.span
        aria-hidden
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent"
        initial={{ x: "-160%" }}
        animate={{ x: "380%" }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.9 }}
      />
    </motion.span>
  );
}

/** Bouncing uppercase brand letters under the tile. */
function BouncingLetters() {
  return (
    <div
      className="flex items-center font-mono text-sm font-bold uppercase tracking-[0.3em]"
      aria-label={BRAND}
    >
      {BRAND.split("").map((ch, i) => (
        <motion.span
          key={i}
          className="inline-block"
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.07 }}
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </div>
  );
}

/** Neo striped progress bar. */
function NeoBar() {
  return (
    <div className="h-3 w-56 overflow-hidden border-2 border-foreground bg-card p-0.5">
      <motion.div
        className="relative h-full overflow-hidden bg-neo-yellow"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 2.2, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }}
      >
        <span
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, rgba(255,255,255,0.9) 0 6px, transparent 6px 12px)",
          }}
        />
      </motion.div>
    </div>
  );
}

/**
 * Branded loading screen — the howling wolf stamps in with echo ripples,
 * a shine sweep, bouncing brand letters and a neo progress bar.
 */
export function LoadingScreen({
  label = "Loading…",
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 bg-background">
        <div className="relative flex items-center justify-center">
          <motion.span
            aria-hidden
            className="absolute border-2 border-foreground"
            initial={{ width: 48, height: 48, opacity: 0.9 }}
            animate={{ width: 150, height: 150, opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
          <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden border-2 border-foreground bg-white shadow-[4px_4px_0_0_var(--neo-ink)]">
            <img src={logo} alt="Wolf Society Esports" className="h-full w-full object-cover" draggable={false} />
          </span>
        </div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background">
      <div className="relative flex items-center justify-center">
        <RippleRings />
        <LogoTile />
      </div>
      <BouncingLetters />
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <NeoBar />
    </div>
  );
}
