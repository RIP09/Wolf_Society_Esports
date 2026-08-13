/**
 * Client-side web-push helpers (VAPID). Requires the public key in the
 * environment as VITE_VAPID_PUBLIC_KEY — until then the site silently skips
 * push (browser notifications + email/SMS still work).
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function pushEnabled(): boolean {
  return typeof import.meta !== "undefined" && !!import.meta.env.VITE_VAPID_PUBLIC_KEY;
}

/**
 * Registers the service worker and subscribes this device. Returns the raw
 * PushSubscription so the caller can persist it via savePushSubscription.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    if (!pushEnabled()) return null;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;
    if (Notification.permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          (import.meta.env.VITE_VAPID_PUBLIC_KEY as string).trim(),
        ),
      });
    }
    return subscription;
  } catch {
    return null;
  }
}

/** Removes this device's push subscription (and the stored row on the server). */
export async function unsubscribeFromPush(): Promise<void> {
  try {
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) await subscription.unsubscribe();
  } catch {
    // ignore — nothing else to do
  }
}

export function serializeSubscription(sub: PushSubscription): {
  endpoint: string;
  keysJson: string;
} {
  return {
    endpoint: sub.endpoint,
    keysJson: JSON.stringify(sub.toJSON().keys ?? {}),
  };
}
