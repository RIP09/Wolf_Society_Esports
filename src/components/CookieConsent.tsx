import { Button } from "@/components/ui/button";
import { btnGhost, btnYellow, card } from "@/lib/neo";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

const STORAGE_KEY = "wse-cookie-consent";
export type CookieChoice = "accepted" | "declined";

/** Broadcast so the footer "Cookie settings" link can re-open the banner. */
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent("wse:cookie-settings"));
}

export function getCookieChoice(): CookieChoice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "accepted" || raw === "declined" ? raw : null;
  } catch {
    return null;
  }
}

function setCookieChoice(choice: CookieChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // private mode — ignore
  }
}

/**
 * Neo-styled cookie consent banner. Shows until the visitor makes a choice,
 * remembers it in localStorage, and can be re-opened via {@link openCookieSettings}.
 * Choices are visible in the footer link + the Privacy Policy page.
 */
export function CookieConsent() {
  const [choice, setChoice] = useState<CookieChoice | null>(() => getCookieChoice());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Show on first visit (no stored choice yet).
    if (getCookieChoice() === null) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    // The footer "Cookie settings" link re-opens the banner at any time.
    const handle = () => setOpen(true);
    window.addEventListener("wse:cookie-settings", handle);
    return () => window.removeEventListener("wse:cookie-settings", handle);
  }, []);

  const choose = (next: CookieChoice) => {
    setCookieChoice(next);
    setChoice(next);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && choice === null && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-[90] p-3 sm:p-4"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
        >
          <div className={cn(card, "mx-auto w-full max-w-3xl gap-4 bg-card p-5 sm:p-6")}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-foreground bg-neo-yellow text-white">
                <Cookie className="size-5" />
              </span>
              <div className="flex-1">
                <p className="text-base font-bold tracking-tight">We use cookies</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Wolf Society Esports uses cookies and local storage to keep you signed
                  in, remember your preferences and understand how visitors use the
                  website. You can accept them all, or decline — only the essentials
                  needed for the site to work will be used.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Read our{" "}
                  <Link to="/privacy" className="font-bold underline hover:text-neo-yellow">
                    Privacy Policy
                  </Link>{" "}
                  for the full details.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t-2 border-foreground/20 pt-4">
              <Button className={btnYellow} onClick={() => choose("accepted")}>
                <Cookie className="size-4" />
                Accept all
              </Button>
              <Button variant="outline" className={btnGhost} onClick={() => choose("declined")}>
                <X className="size-4" />
                Decline
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
