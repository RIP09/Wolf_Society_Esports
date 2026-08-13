import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { requireAdmin } from "./guards";

/**
 * n8n AI Automation layer.
 *
 * Every key event on the platform (contact form, new player, tryout, donation,
 * announcement, security alert…) fires a webhook into the organization's n8n
 * instance. n8n then runs the AI/automation workflow of your choice — replies,
 * CRM logging, Discord/Slack/Telegram notifications, Google Sheets, AI agents,
 * anything n8n supports.
 *
 * Configuration (paste into the Keys tab, no code changes needed):
 *   N8N_WEBHOOK_URL       — webhook URL of the main "Wolf Society" n8n workflow
 *   N8N_CHAT_WEBHOOK_URL  — (optional) webhook URL of the AI assistant workflow
 *   N8N_WEBHOOK_SECRET    — (optional) secret sent as x-n8n-secret header
 *
 * Every fire is recorded in the notification outbox (channel "webhook"), so
 * The Den → Automations shows live delivery status with zero extra services.
 */

type WebhookResult = {
  ok: boolean;
  configured: boolean;
  status: "sent" | "failed" | "skipped";
  error?: string;
};

async function record(ctx: ActionCtx, entry: {
  channel: "webhook";
  subject?: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
}): Promise<void> {
  try {
    await ctx.runMutation(internal.notify.recordNotification, entry);
  } catch {
    // the outbox must never break the automation fire
  }
}

/** Parses JSON payload strings sent by schedulers; falls back to the raw string. */
function parsePayload(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/**
 * Fires an n8n workflow webhook for a platform event. Called from mutations via
 * ctx.scheduler.runAfter(0, api.automation.triggerWorkflow, { event, payload }).
 * Skips (and records) cleanly when N8N_WEBHOOK_URL isn't configured yet.
 */
export const triggerWorkflow = action({
  args: {
    event: v.string(),
    payload: v.string(), // JSON string — parsed before delivery
  },
  handler: async (ctx, { event, payload }): Promise<WebhookResult> => {
    const url = process.env.N8N_WEBHOOK_URL;
    if (!url) {
      await record(ctx, {
        channel: "webhook",
        subject: event,
        status: "skipped",
        error: "N8N_WEBHOOK_URL not configured — add it in the Keys tab",
      });
      return { ok: false, configured: false, status: "skipped" };
    }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const secret = process.env.N8N_WEBHOOK_SECRET;
      if (secret) headers["x-n8n-secret"] = secret;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          event,
          payload: parsePayload(payload),
          sentAt: Date.now(),
          source: "wolf-society-platform",
        }),
      });
      const ok = res.ok;
      await record(ctx, {
        channel: "webhook",
        subject: event,
        status: ok ? "sent" : "failed",
        error: ok ? undefined : `HTTP ${res.status}`,
      });
      return { ok, configured: true, status: ok ? "sent" : "failed" };
    } catch (error) {
      await record(ctx, {
        channel: "webhook",
        subject: event,
        status: "failed",
        error: String(error),
      });
      return { ok: false, configured: true, status: "failed", error: String(error) };
    }
  },
});

/** Grabs a text reply out of the many JSON shapes n8n workflows can return. */
function extractReply(data: unknown): string | null {
  if (typeof data === "string") return data;
  if (Array.isArray(data)) {
    for (const item of data) {
      const got = extractReply(item);
      if (got) return got;
    }
    return null;
  }
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["reply", "response", "text", "output", "message", "answer", "json", "data"]) {
      const got = extractReply(obj[key]);
      if (got) return got;
    }
  }
  return null;
}

/**
 * Public AI assistant ("Ask Wolf"). Posts the visitor's question to the n8n
 * AI-agent workflow and returns the reply. Falls back to a helpful canned
 * answer (never an error page) when n8n isn't connected yet.
 */
export const askAssistant = action({
  args: { message: v.string() },
  handler: async (ctx, { message }): Promise<{ ok: boolean; configured: boolean; reply: string }> => {
    const url = process.env.N8N_CHAT_WEBHOOK_URL ?? process.env.N8N_WEBHOOK_URL;
    const question = message.trim().slice(0, 2000);

    const fallback =
      "Thanks for reaching out! Right now the AI assistant is warming up, but here's how we can help: " +
      "• Join the org — register through the Player portal (Sign in → The Pack). " +
      "• Tryouts — check the Tryouts page and sign up for your game. " +
      "• Donate — the Donate page has one-tap support options. " +
      "• Anything else — use the Contact form and the team replies personally.";

    if (!url) {
      await record(ctx, {
        channel: "webhook",
        subject: "assistant",
        status: "skipped",
        error: "n8n webhook not configured — canned reply used",
      });
      return { ok: false, configured: false, reply: fallback };
    }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const secret = process.env.N8N_WEBHOOK_SECRET;
      if (secret) headers["x-n8n-secret"] = secret;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "chat",
          message: question,
          sentAt: Date.now(),
          source: "wolf-society-assistant",
        }),
      });
      const data = await res.json().catch(() => null);
      const reply =
        extractReply(data)?.slice(0, 1500) ??
        (res.ok
          ? "I received that, but couldn't form a reply yet — the team will follow up via the contact form."
          : "The assistant is having a moment — please try again in a few seconds.");
      await record(ctx, {
        channel: "webhook",
        subject: "assistant",
        status: res.ok ? "sent" : "failed",
        error: res.ok ? undefined : `HTTP ${res.status}`,
      });
      return { ok: res.ok, configured: true, reply };
    } catch (error) {
      await record(ctx, {
        channel: "webhook",
        subject: "assistant",
        status: "failed",
        error: String(error),
      });
      return {
        ok: false,
        configured: true,
        reply: "The assistant couldn't reach the AI service just now. Please try again in a moment, or use the contact form.",
      };
    }
  },
});

/** Admin-only: live status of the n8n automation layer + recent webhook runs. */
export const automationStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const webhook = process.env.N8N_WEBHOOK_URL;
    const chat = process.env.N8N_CHAT_WEBHOOK_URL;
    const recent = await ctx.db.query("notifications").order("desc").take(60);
    return {
      configured: !!webhook,
      webhook: !!webhook,
      chat: !!chat,
      keys: ["N8N_WEBHOOK_URL", "N8N_CHAT_WEBHOOK_URL", "N8N_WEBHOOK_SECRET"],
      recent: recent.filter((n) => n.channel === "webhook").slice(0, 20),
    };
  },
});

/** Admin-only: fire a sample event through the n8n pipeline to test the wiring. */
export const testWorkflow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    await ctx.scheduler.runAfter(0, api.automation.triggerWorkflow, {
      event: "test",
      payload: JSON.stringify({
        message: "Test event from The Den — n8n automation is wired up correctly!",
        from: "Wolf Society Esports · Automation Hub",
      }),
    });
    return { ok: true };
  },
});
