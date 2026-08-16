import { WolfMark } from "@/components/WolfLogo";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";

export interface MobileNavItem {
  to: string;
  label: string;
  end?: boolean;
}

/**
 * Full-screen neobrutal hamburger menu for small screens. Bold, modern,
 * uppercase links with a staggered entrance; closes automatically on
 * navigation, on Escape, and locks page scroll while open.
 */
export function MobileNav({
  items,
  footer,
  accent = "bg-neo-yellow",
  title = "Menu",
}: {
  items: MobileNavItem[];
  footer?: React.ReactNode;
  /** Active-link background class (e.g. "bg-neo-yellow" / "bg-neo-blue"). */
  accent?: string;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close the menu whenever the route changes (a link was tapped).
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  // Escape closes the menu; body scroll is locked while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Hamburger trigger — three neo bars that fold into an X */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-foreground bg-card shadow-[2px_2px_0_0_var(--neo-ink)] transition-all hover:shadow-[3px_3px_0_0_var(--neo-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      >
        <span className="relative block h-3.5 w-5" aria-hidden>
          <span
            className={cn(
              "absolute left-0 top-0 h-0.5 w-full bg-foreground transition-all duration-200",
              open && "top-[6px] rotate-45",
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-[6px] h-0.5 w-full bg-foreground transition-all duration-200",
              open && "opacity-0",
            )}
          />
          <span
            className={cn(
              "absolute left-0 top-3 h-0.5 w-full bg-foreground transition-all duration-200",
              open && "top-[6px] -rotate-45",
            )}
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-background"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="flex min-h-full flex-col">
              {/* Top bar — logo + close */}
              <div className="flex items-center justify-between gap-3 border-b-2 border-foreground bg-card px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <WolfMark size={36} />
                  <div className="leading-none">
                    <p className="text-sm font-bold tracking-tight">Wolf Society Esports</p>
                    <p className="mt-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                      {title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-10 w-10 items-center justify-center border-2 border-foreground bg-background shadow-[2px_2px_0_0_var(--neo-ink)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Bold, modern navigation links */}
              <nav className="flex flex-col gap-1.5 px-4 py-6">
                {items.map((item, i) => (
                  <motion.div
                    key={item.to}
                    initial={{ opacity: 0, x: -28 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.045 * i, type: "spring", stiffness: 220, damping: 22 }}
                  >
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center justify-between gap-3 border-2 border-foreground px-4 py-3.5 text-2xl font-bold uppercase leading-none tracking-tight transition-all",
                          isActive
                            ? `${accent} text-white shadow-[4px_4px_0_0_var(--neo-ink)]`
                            : "bg-card hover:translate-x-1 hover:bg-neo-cream",
                        )
                      }
                    >
                      <span>{item.label}</span>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-foreground">
                        //{String(i + 1).padStart(2, "0")}
                      </span>
                    </NavLink>
                  </motion.div>
                ))}
              </nav>

              {/* Footer actions (sign in / account / sign out) */}
              {footer && (
                <div className="mt-auto border-t-2 border-foreground bg-card px-4 py-4">
                  {footer}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
