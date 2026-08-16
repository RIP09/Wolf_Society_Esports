/**
 * Cookie & data-sharing consent — real, per-category, user-controlled.
 *
 * Choices are stored in localStorage and actually gate the data the site
 * collects:
 *  - analytics  → pageview tracking, visitor counts, country auto-detection
 *  - preferences → saved theme choice & UI preferences
 *  - marketing  → push notifications / broadcast alerts, permission prompts
 *  - necessary  → always on (auth session, security, fraud prevention)
 *
 * `analyticsAllowed()` / `marketingAllowed()` / `preferencesAllowed()` are
 * safe to call from non-React code (e.g. the pageview tracker in main.tsx).
 */

export type ConsentCategory = "analytics" | "preferences" | "marketing";

export interface ConsentState {
  /** Increment when the meaning of the categories changes. */
  version: number;
  analytics: boolean;
  preferences: boolean;
  marketing: boolean;
  updatedAt: number;
}

const STORAGE_KEY = "wse-cookie-consent";
const CONSENT_VERSION = 2;

export const CONSENT_EVENT = "wse:consent-change";

/** All categories default to off until the visitor chooses. */
export function defaultConsent(): ConsentState {
  return {
    version: CONSENT_VERSION,
    analytics: false,
    preferences: false,
    marketing: false,
    updatedAt: 0,
  };
}

/** Read the stored consent, or null when the visitor hasn't answered yet. */
export function getConsent(): ConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (typeof parsed !== "object" || parsed === null) return null;
    return {
      ...defaultConsent(),
      ...parsed,
      version: CONSENT_VERSION,
    };
  } catch {
    return null;
  }
}

/** True once the visitor has made ANY consent choice (accept or decline). */
export function hasConsent(): boolean {
  return getConsent() !== null;
}

/** Persist a new consent state and broadcast the change to the app. */
export function saveConsent(
  next: Partial<Pick<ConsentState, "analytics" | "preferences" | "marketing">>,
): ConsentState {
  const merged: ConsentState = {
    ...defaultConsent(),
    ...(getConsent() ?? defaultConsent()),
    ...next,
    updatedAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // private mode — consent lasts for this session only
  }
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: merged }));
  } catch {
    // event dispatch unavailable — ignore
  }
  return merged;
}

export function acceptAllConsent(): ConsentState {
  return saveConsent({ analytics: true, preferences: true, marketing: true });
}

export function declineAllConsent(): ConsentState {
  return saveConsent({ analytics: false, preferences: false, marketing: false });
}

/** Whether analytics collection is allowed. Never consented = false. */
export function analyticsAllowed(): boolean {
  return getConsent()?.analytics === true;
}

/** Whether marketing (push alerts, permission prompts) is allowed. */
export function marketingAllowed(): boolean {
  return getConsent()?.marketing === true;
}

/** Whether preferences (theme, UI choices) may be saved. */
export function preferencesAllowed(): boolean {
  return getConsent()?.preferences === true;
}
