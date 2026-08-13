const VISITOR_KEY = "wse_visitor_id";

/**
 * Persistent anonymous visitor id (localStorage). Shared by the analytics
 * pageview tracker and the realtime presence heartbeat so both count the
 * same person exactly once.
 */
export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
