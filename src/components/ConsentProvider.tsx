import {
  CONSENT_EVENT,
  type ConsentCategory,
  type ConsentState,
  acceptAllConsent,
  declineAllConsent,
  defaultConsent,
  getConsent,
  saveConsent,
} from "@/lib/consent";
import { createContext, useContext, useEffect, useState } from "react";

/** Re-opens the cookie settings dialog from anywhere (footer link, etc.). */
export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent("wse:cookie-settings"));
}

interface ConsentContextValue {
  consent: ConsentState | null;
  /** True once the visitor answered (accept or decline) at least once. */
  answered: boolean;
  /** Toggle a single category (necessary is always on and not exposed). */
  update: (category: ConsentCategory, value: boolean) => void;
  acceptAll: () => void;
  declineAll: () => void;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentState | null>(() => getConsent());

  // Keep the context in sync with changes made from non-React code
  // (e.g. saveConsent called from a plain handler) or other tabs.
  useEffect(() => {
    const handle = () => setConsent(getConsent());
    window.addEventListener(CONSENT_EVENT, handle);
    window.addEventListener("storage", handle);
    return () => {
      window.removeEventListener(CONSENT_EVENT, handle);
      window.removeEventListener("storage", handle);
    };
  }, []);

  const value: ConsentContextValue = {
    consent,
    answered: consent !== null,
    update: (category, enabled) => {
      const next = saveConsent({ [category]: enabled });
      setConsent(next);
    },
    acceptAll: () => {
      const next = acceptAllConsent();
      setConsent(next);
    },
    declineAll: () => {
      const next = declineAllConsent();
      setConsent(next);
    },
  };

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    // Fallback when used outside the provider — never crash the UI.
    const state = getConsent();
    return {
      consent: state,
      answered: state !== null,
      update: (category, enabled) => {
        saveConsent({ [category]: enabled });
      },
      acceptAll: () => {
        acceptAllConsent();
      },
      declineAll: () => {
        declineAllConsent();
      },
    };
  }
  return ctx;
}
