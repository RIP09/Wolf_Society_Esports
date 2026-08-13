import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { requireAdmin } from "./guards";

/**
 * Huginn AI Automation layer.
 *
 * Every key event on the platform (contact form, new player, tryout, donation,
 * announcement, security alert…) fires a webhook into the organization's
 * Huginn instance (huginn.sh — the open-source, self-hosted automation
 * platform). Huginn agents then run the automation of your choice — AI
 * replies, CRM logging, Discord/Slack/Telegram notifications, spreadsheets,
 * anything Huginn agents support.
 *
 * Configuration (paste into the Keys tab, no code changes needed):
 *   HUGINN_WEBHOOK_URL      — webhook URL of the "Wolf Society Events" Webhook
 *                             Agent (https://your-huginn/users/1/web_requests/<id>/<secret>)
 *   HUGINN_CHAT_WEBHOOK_URL — (optional) webhook URL of the "Ask Wolf" chat
 *                             Webhook Agent — powers the public AI assistant
 *   HUGINN_WEBHOOK_SECRET   — (optional) shared secret. Sent as X-Huginn-Secret
 *                             on outbound calls and checked on /huginn-reply.
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

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through
  }
  return `h-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Fires a Huginn webhook for a platform event. Called from mutations via
 * ctx.scheduler.runAfter(0, api.automation.triggerWorkflow, { event, payload }).
 * Skips (and records) cleanly when HUGINN_WEBHOOK_URL isn't configured yet.
 */
export const triggerWorkflow = action({
  args: {
    event: v.string(),
    payload: v.string(), // JSON string — parsed before delivery
  },
  handler: async (ctx, { event, payload }): Promise<WebhookResult> => {
    const url = process.env.HUGINN_WEBHOOK_URL;
    if (!url) {
      await record(ctx, {
        channel: "webhook",
        subject: event,
        status: "skipped",
        error: "HUGINN_WEBHOOK_URL not configured — add it in the Keys tab",
      });
      return { ok: false, configured: false, status: "skipped" };
    }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const secret = process.env.HUGINN_WEBHOOK_SECRET;
      if (secret) headers["X-Huginn-Secret"] = secret;
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

/** Grabs a text reply out of the many JSON shapes Huginn workflows can return. */
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
 * Public AI assistant ("Ask Wolf"). Posts the visitor's question to the Huginn
 * "Ask Wolf" Webhook Agent together with a fresh chatId.
 *
 * Two delivery paths:
 *  1. If the webhook answers synchronously with JSON, the reply is returned
 *     directly (compatible with Huginn setups that answer inline).
 *  2. Otherwise the action returns { chatId, pending: true }. The recommended
 *     Huginn chat workflow (Webhook Agent → OpenAI LLM Agent → Post Agent)
 *     POSTs the finished reply to {SITE_URL}/huginn-reply, where it lands in
 *     the assistantReplies table; the chat widget picks it up via
 *     getAssistantReply. Falls back to a helpful canned answer (never an
 *     error page) when Huginn isn't connected yet.
 */
export const askAssistant = action({
  args: { message: v.string() },
  handler: async (
    ctx,
    { message },
  ): Promise<{ ok: boolean; configured: boolean; reply: string | null; chatId: string | null; pending: boolean }> => {
    const url = process.env.HUGINN_CHAT_WEBHOOK_URL ?? process.env.HUGINN_WEBHOOK_URL;
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
        error: "Huginn webhook not configured — canned reply used",
      });
      return { ok: false, configured: false, reply: fallback, chatId: null, pending: false };
    }
    const chatId = randomId();
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const secret = process.env.HUGINN_WEBHOOK_SECRET;
      if (secret) headers["X-Huginn-Secret"] = secret;
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          type: "chat",
          chatId,
          message: question,
          sentAt: Date.now(),
          source: "wolf-society-assistant",
        }),
      });
      const data = await res.json().catch(() => null);
      const syncReply = extractReply(data)?.slice(0, 1500);
      await record(ctx, {
        channel: "webhook",
        subject: "assistant",
        status: res.ok ? "sent" : "failed",
        error: res.ok ? undefined : `HTTP ${res.status}`,
      });
      if (syncReply) {
        return { ok: res.ok, configured: true, reply: syncReply, chatId, pending: false };
      }
      if (res.ok) {
        // Delivered — the Huginn chat workflow will post the real reply back.
        return { ok: true, configured: true, reply: null, chatId, pending: true };
      }
      return {
        ok: false,
        configured: true,
        reply: "The assistant is having a moment — please try again in a few seconds.",
        chatId: null,
        pending: false,
      };
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
        chatId: null,
        pending: false,
      };
    }
  },
});

/** Public: the finished AI reply for a chat, once the Huginn workflow posts it back. */
export const getAssistantReply = query({
  args: { chatId: v.string() },
  handler: async (ctx, { chatId }) => {
    const row = await ctx.db
      .query("assistantReplies")
      .withIndex("by_chatId", (q) => q.eq("chatId", chatId))
      .first();
    return row ? { reply: row.reply, createdAt: row.createdAt } : null;
  },
});

/** Internal: stores a reply POSTed back by the Huginn chat workflow (/huginn-reply). */
export const saveAssistantReply = internalMutation({
  args: { chatId: v.string(), reply: v.string() },
  handler: async (ctx, { chatId, reply }) => {
    const clean = reply.trim().slice(0, 2000);
    if (!chatId || !clean) return null;
    await ctx.db.insert("assistantReplies", {
      chatId,
      reply: clean,
      createdAt: Date.now(),
    });
    return { ok: true };
  },
});

/** Admin-only: live status of the Huginn automation layer + recent webhook runs. */
export const automationStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const webhook = process.env.HUGINN_WEBHOOK_URL;
    const chat = process.env.HUGINN_CHAT_WEBHOOK_URL;
    const recent = await ctx.db.query("notifications").order("desc").take(60);
    return {
      configured: !!webhook,
      webhook: !!webhook,
      chat: !!chat,
      keys: ["HUGINN_WEBHOOK_URL", "HUGINN_CHAT_WEBHOOK_URL", "HUGINN_WEBHOOK_SECRET"],
      recent: recent.filter((n) => n.channel === "webhook").slice(0, 20),
    };
  },
});

/** Admin-only: fire a sample event through the Huginn pipeline to test the wiring. */
export const testWorkflow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    await ctx.scheduler.runAfter(0, api.automation.triggerWorkflow, {
      event: "test",
      payload: JSON.stringify({
        message: "Test event from The Den — Huginn automation is wired up correctly!",
        from: "Wolf Society Esports · Automation Hub",
      }),
    });
    return { ok: true };
  },
});
