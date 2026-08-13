import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { ActionCtx } from "./_generated/server";
import { requireAdmin } from "./guards";

/**
 * Huginn automation layer.
 *
 * Replaces n8n with Huginn (https://github.com/huginn/huginn).
 * Every key event sends a POST to a Huginn webhook agent.
 *
 * Environment variables (set in Keys tab):
 *   HUGINN_WEBHOOK_URL       – main webhook for events
 *   HUGINN_CHAT_WEBHOOK_URL  – optional, for AI assistant
 *   HUGINN_WEBHOOK_SECRET    – optional, sent as header
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
    // outbox never breaks
  }
}

function parsePayload(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export const triggerWorkflow = action({
  args: {
    event: v.string(),
    payload: v.string(),
  },
  handler: async (ctx, { event, payload }): Promise<WebhookResult> => {
    const url = process.env.HUGINN_WEBHOOK_URL;
    if (!url) {
      await record(ctx, {
        channel: "webhook",
        subject: event,
        status: "skipped",
        error: "HUGINN_WEBHOOK_URL not configured",
      });
      return { ok: false, configured: false, status: "skipped" };
    }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const secret = process.env.HUGINN_WEBHOOK_SECRET;
      if (secret) headers["x-huginn-secret"] = secret;
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

// Helper to extract text from Huginn's typical JSON responses
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
    for (const key of ["reply", "response", "text", "output", "message", "answer"]) {
      const got = extractReply(obj[key]);
      if (got) return got;
    }
  }
  return null;
}

export const askAssistant = action({
  args: { message: v.string() },
  handler: async (ctx, { message }): Promise<{ ok: boolean; configured: boolean; reply: string }> => {
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
        error: "Huginn chat webhook not configured – canned reply used",
      });
      return { ok: false, configured: false, reply: fallback };
    }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const secret = process.env.HUGINN_WEBHOOK_SECRET;
      if (secret) headers["x-huginn-secret"] = secret;
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
