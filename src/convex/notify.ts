import { v } from "convex/values";
import { action, internalMutation, query, type ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { requireAdmin } from "./guards";

/** Organization mailboxes that receive every automated notification. */
const ORG_EMAILS = ["wolfsocietygg@yahoo.com", "deepanshumurmu0@gmail.com"];

/** Public site URL used in email buttons (set SITE_URL in Keys). */
function siteUrl(): string {
  return process.env.SITE_URL ?? "http://localhost:5173";
}

type Outbox = { channel: "email" | "sms" | "discord"; recipient?: string; subject?: string; status: "sent" | "failed" | "skipped"; error?: string };

/** Records a delivery attempt so The Den can watch it in real time. */
export const recordNotification = internalMutation({
  args: {
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("discord")),
    recipient: v.optional(v.string()),
    subject: v.optional(v.string()),
    status: v.union(v.literal("sent"), v.literal("failed"), v.literal("skipped")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      channel: args.channel,
      recipient: args.recipient,
      subject: args.subject,
      status: args.status,
      error: args.error,
      createdAt: Date.now(),
    });
  },
});

async function record(ctx: ActionCtx, entry: Outbox): Promise<void> {
  try {
    await ctx.runMutation(internal.notify.recordNotification, entry);
  } catch {
    // the outbox must never break the notification being sent
  }
}

/** Sends an SMS via Vonage's REST API. Skips (and records) when keys aren't configured. */
async function sendSms(ctx: ActionCtx, to: string, text: string) {
  const apiKey = process.env.VONAGE_API_KEY;
  const apiSecret = process.env.VONAGE_API_SECRET;
  if (!apiKey || !apiSecret) {
    await record(ctx, { channel: "sms", recipient: to, subject: text.slice(0, 60), status: "skipped", error: "VONAGE_API_KEY / VONAGE_API_SECRET not configured" });
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch("https://rest.nexmo.com/sms/json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        api_key: apiKey,
        api_secret: apiSecret,
        from: process.env.SMS_FROM ?? "WolfSociety",
        to,
        text,
      }).toString(),
    });
    const data = (await res.json()) as { messages?: { status?: string; "error-text"?: string }[] };
    const ok = data.messages?.[0]?.status === "0";
    await record(ctx, { channel: "sms", recipient: to, subject: text.slice(0, 60), status: ok ? "sent" : "failed", error: ok ? undefined : data.messages?.[0]?.["error-text"] });
    return { ok, error: ok ? undefined : data.messages?.[0]?.["error-text"] };
  } catch (error) {
    await record(ctx, { channel: "sms", recipient: to, subject: text.slice(0, 60), status: "failed", error: String(error) });
    return { ok: false, error: String(error) };
  }
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function shell(subject: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f4f3fb;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3fb;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #1b1d3a;border-radius:8px;overflow:hidden;">
          <tr><td style="background:#7b5cf0;padding:18px 28px;">
            <span style="color:#ffffff;font-size:18px;font-weight:bold;">Wolf Society Esports</span>
          </td></tr>
          <tr><td style="padding:28px;color:#1b1d3a;font-size:14px;line-height:1.7;">
            ${body}
          </td></tr>
          <tr><td style="padding:14px 28px;border-top:1px solid #e8e7f5;color:#63658a;font-size:12px;">
            This is an automated message from the Wolf Society Esports platform.
          </td></tr>
        </table>
      </td></tr>
    </table></body></html>`;
}

async function send(
  ctx: ActionCtx,
  opts: { to: string | string[]; subject: string; html: string },
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await record(ctx, { channel: "email", recipient: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to, subject: opts.subject, status: "skipped", error: "RESEND_API_KEY not configured" });
    return { ok: false, skipped: true };
  }
  const from = process.env.NOTIFY_FROM_EMAIL ?? "Wolf Society Esports <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(opts.to) ? opts.to : [opts.to],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    await record(ctx, { channel: "email", recipient: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to, subject: opts.subject, status: res.ok ? "sent" : "failed", error: res.ok ? undefined : `HTTP ${res.status}` });
    return { ok: res.ok, status: res.status };
  } catch (error) {
    await record(ctx, { channel: "email", recipient: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to, subject: opts.subject, status: "failed", error: String(error) });
    return { ok: false, error: String(error) };
  }
}

/**
 * Posts a message to the organization's Discord server via webhook.
 * Set DISCORD_WEBHOOK_URL in Keys to activate — every notification then
 * lands in your Discord channel in real time.
 */
async function sendDiscord(ctx: ActionCtx, content: string, title?: string) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) {
    await record(ctx, { channel: "discord", subject: title ?? content.slice(0, 60), status: "skipped", error: "DISCORD_WEBHOOK_URL not configured" });
    return { ok: false, skipped: true };
  }
  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Wolf Society Esports",
        content,
        embeds: title
          ? [{ title, description: content.slice(0, 1900), color: 0x7b5cf0 }]
          : undefined,
      }),
    });
    await record(ctx, { channel: "discord", subject: title ?? content.slice(0, 60), status: res.ok ? "sent" : "failed", error: res.ok ? undefined : `HTTP ${res.status}` });
    return { ok: res.ok, status: res.status };
  } catch (error) {
    await record(ctx, { channel: "discord", subject: title ?? content.slice(0, 60), status: "failed", error: String(error) });
    return { ok: false, error: String(error) };
  }
}

/** Admin-only: the recent notification outbox, newest first. */
export const listRecent = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return await ctx.db.query("notifications").order("desc").take(30);
  },
});

/** Alert the organization whenever a blocked unauthorized-access attempt occurs. */
export const securityAlert = action({
  args: { email: v.optional(v.string()), reason: v.string() },
  handler: async (ctx, { email, reason }) => {
    const body = `
      <h2 style="margin:0 0 12px;color:#c0392b;">Security alert</h2>
      <p>An unauthorized access attempt was blocked by the platform.</p>
      <table style="border-collapse:collapse;margin-top:8px;">
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Account</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(email ?? "Not signed in")}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Reason</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(reason)}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Time</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${new Date().toLocaleString()}</td></tr>
      </table>
      <p style="margin-top:16px;">No action is needed if this was an expected redirect. Review the security log in The Den for details.</p>`;
    const emailRes = await send(ctx, { to: ORG_EMAILS, subject: "Security alert — blocked access attempt", html: shell("Security alert", body) });
    await sendDiscord(ctx, `🔒 **Security alert** — blocked access attempt${email ? ` from ${email}` : ""}.\n${reason}`, "Security alert");
    return emailRes;
  },
});

/** Notify the organization when a new player registers through The Pack. */
export const newRegistration = action({
  args: { gamertag: v.string(), game: v.string(), email: v.string() },
  handler: async (ctx, { gamertag, game, email }) => {
    const body = `
      <h2 style="margin:0 0 12px;">New player registration</h2>
      <p>A new player just registered through The Pack and is awaiting approval.</p>
      <table style="border-collapse:collapse;margin-top:8px;">
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Gamertag</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(gamertag)}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Game</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(game)}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Email</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(email)}</td></tr>
      </table>
      <p style="margin-top:16px;">Open The Den → Players to approve or suspend this registration.</p>`;
    const emailRes = await send(ctx, { to: ORG_EMAILS, subject: `New player registration — ${gamertag}`, html: shell("New player registration", body) });
    await sendDiscord(ctx, `🎮 **New registration** — ${gamertag} (${game}) just signed up and is awaiting approval.`, "New player registration");
    return emailRes;
  },
});

/** Forward public contact submissions to the org and thank the sender automatically. */
export const newContact = action({
  args: { name: v.string(), email: v.string(), subject: v.string(), message: v.string() },
  handler: async (ctx, { name, email, subject, message }) => {
    const orgBody = `
      <h2 style="margin:0 0 12px;">New contact inquiry</h2>
      <table style="border-collapse:collapse;margin-top:8px;">
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Name</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(name)}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Email</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(email)}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Subject</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(subject)}</td></tr>
      </table>
      <p style="margin-top:12px;">${esc(message)}</p>
      <p style="margin-top:16px;">Reply to the inquiry from The Den → Inquiries, or directly at ${esc(email)}.</p>`;
    const replyBody = `
      <h2 style="margin:0 0 12px;">Thank you, ${esc(name)}!</h2>
      <p>We received your message and will get back to you shortly.</p>
      <table style="border-collapse:collapse;margin-top:8px;">
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Subject</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(subject)}</td></tr>
      </table>
      <p style="margin-top:12px;font-style:italic;">“${esc(message)}”</p>
      <p style="margin-top:16px;">— The Wolf Society Esports team</p>`;
    const org = await send(ctx, { to: ORG_EMAILS, subject: `New inquiry: ${subject}`, html: shell("New contact inquiry", orgBody) });
    const reply = await send(ctx, { to: email, subject: `Thank you — we received your message`, html: shell("Thank you", replyBody) });
    await sendDiscord(ctx, `✉️ **New inquiry** from ${name} — "${subject}"\n${message.slice(0, 280)}`, "New contact inquiry");
    return { org, reply };
  },
});

/** Alerts the organization when someone requests management access, with a button to the grant page. */
export const accessRequested = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    requestedRole: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { name, email, phone, requestedRole, reason }) => {
    const url = `${siteUrl()}/grant`;
    const body = `
      <h2 style="margin:0 0 12px;">Management access request</h2>
      <p>${esc(name)} has requested access to the management portal (The Den).</p>
      <table style="border-collapse:collapse;margin-top:8px;">
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Name</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(name)}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Email</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(email)}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Phone</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(phone)}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Requested role</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(requestedRole)}</td></tr>
      </table>
      ${reason ? `<p style="margin-top:12px;">“${esc(reason)}”</p>` : ""}
      <p style="margin-top:20px;">
        <a href="${url}" style="display:inline-block;padding:12px 22px;background:#7b5cf0;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:6px;">
          Review &amp; grant access
        </a>
      </p>
      <p style="margin-top:12px;font-size:12px;color:#63658a;">
        Opens the secret access-granting page. You can also sign in with the super admin
        credentials if the button doesn't open.
      </p>`;
    const org = await send(ctx, { to: ORG_EMAILS, subject: `Management access request — ${name}`, html: shell("Access request", body) });
    const applicant = await send(ctx, {
      to: email,
      subject: `We received your access request — Wolf Society Esports`,
      html: shell("Request received", `
        <h2 style="margin:0 0 12px;">Thank you, ${esc(name)}!</h2>
        <p>We've received your request for <strong>${esc(requestedRole)}</strong> access to the management portal (The Den).</p>
        <p>Our team reviews every request. If your access is granted, your login credentials will be sent to this email and to your phone by SMS.</p>
      `),
    });
    await sendDiscord(ctx, `🔑 **Access request** — ${name} wants ${requestedRole} access.\n${reason ? `"${reason}"\n` : ""}Review at ${url}`, "Management access request");
    return { org, applicant };
  },
});

/** Sends the auto-generated User ID + password to a granted user by email and SMS. */
export const credentialsIssued = action({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    userId: v.string(),
    password: v.string(),
    role: v.string(),
  },
  handler: async (ctx, { name, email, phone, userId, password, role }) => {
    const url = `${siteUrl()}/auth/den?returnTo=%2Fadmin`;
    const body = `
      <h2 style="margin:0 0 12px;">Your management access is ready</h2>
      <p>Hi ${esc(name)}, your access to the <strong>Wolf Society Esports</strong> management portal (The Den) has been granted with the role <strong>${esc(role)}</strong>.</p>
      <table style="border-collapse:collapse;margin-top:8px;">
        <tr><td style="padding:8px 14px;border:1px solid #e8e7f5;font-weight:bold;">User ID</td>
            <td style="padding:8px 14px;border:1px solid #e8e7f5;font-family:monospace;font-size:15px;">${esc(userId)}</td></tr>
        <tr><td style="padding:8px 14px;border:1px solid #e8e7f5;font-weight:bold;">Password</td>
            <td style="padding:8px 14px;border:1px solid #e8e7f5;font-family:monospace;font-size:15px;">${esc(password)}</td></tr>
      </table>
      <p style="margin-top:20px;">
        <a href="${url}" style="display:inline-block;padding:12px 22px;background:#7b5cf0;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:6px;">
          Sign in to The Den
        </a>
      </p>
      <p style="margin-top:12px;font-size:12px;color:#63658a;">Keep these credentials safe. They are generated once and sent only to you.</p>`;
    const emailRes = await send(ctx, {
      to: email,
      subject: `Your management access — Wolf Society Esports`,
      html: shell("Management credentials", body),
    });
    const smsRes = await sendSms(
      ctx,
      phone,
      `Wolf Society Esports: your management access is ready. User ID: ${userId} Password: ${password} Sign in: ${siteUrl()}/auth/den`,
    );
    return { email: emailRes, sms: smsRes };
  },
});

/** Notifies an applicant that their access request was declined. */
export const accessRejected = action({
  args: { name: v.string(), email: v.string(), reason: v.optional(v.string()) },
  handler: async (ctx, { name, email, reason }) => {
    const body = `
      <h2 style="margin:0 0 12px;">About your access request</h2>
      <p>Hi ${esc(name)}, thank you for your interest in joining the Wolf Society Esports management team.</p>
      <p>After review, your access request was <strong>declined</strong>${reason ? `: “${esc(reason)}”` : " at this time"}.</p>
      <p>If you believe this is a mistake, reply to this email or contact the organization directly.</p>`;
    return send(ctx, { to: email, subject: `Update on your access request — Wolf Society Esports`, html: shell("Access request update", body) });
  },
});

/** Thank-you confirmation when someone subscribes to public alerts. */
export const subscribeConfirmed = action({
  args: { name: v.optional(v.string()), email: v.string(), phone: v.optional(v.string()) },
  handler: async (ctx, { name, email, phone }) => {
    const body = `
      <h2 style="margin:0 0 12px;">You're subscribed!</h2>
      <p>Hi ${esc(name ?? "there")}, you'll now receive email and SMS alerts whenever Wolf Society Esports publishes something new — match results, tournaments, roster news and more.</p>
      <p style="margin-top:16px;"><a href="${siteUrl()}" style="color:#7b5cf0;font-weight:bold;">Visit the website</a> any time for the full story.</p>`;
    const emailRes = await send(ctx, { to: email, subject: `You're subscribed — Wolf Society Esports`, html: shell("Subscription confirmed", body) });
    const smsRes = phone
      ? await sendSms(ctx, phone, `You're subscribed to Wolf Society Esports alerts. We'll text you the headlines — full stories at ${siteUrl()}`)
      : { ok: false, skipped: true };
    return { email: emailRes, sms: smsRes };
  },
});

/** Broadcasts a public announcement to every alert subscriber by email + SMS + Discord. */
export const broadcast = action({
  args: {
    title: v.string(),
    body: v.string(),
    subscribers: v.array(
      v.object({
        name: v.optional(v.string()),
        email: v.string(),
        phone: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { title, body, subscribers }) => {
    const url = `${siteUrl()}/news`;
    let emailSent = 0;
    let smsSent = 0;
    for (const sub of subscribers) {
      const bodyHtml = `
        <h2 style="margin:0 0 12px;">${esc(title)}</h2>
        <p>${esc(body.slice(0, 400))}</p>
        <p style="margin-top:20px;">
          <a href="${url}" style="display:inline-block;padding:12px 22px;background:#7b5cf0;color:#ffffff;text-decoration:none;font-weight:bold;border-radius:6px;">
            Read the full story
          </a>
        </p>
        <p style="margin-top:12px;font-size:12px;color:#63658a;">You're receiving this because you subscribed to Wolf Society Esports alerts.</p>`;
      const res = await send(ctx, { to: sub.email, subject: `Wolf Society Esports: ${title}`, html: shell(title, bodyHtml) });
      if (res.ok) emailSent++;
      if (sub.phone) {
        const sms = await sendSms(ctx, sub.phone, `Wolf Society Esports: ${title.slice(0, 80)} — ${url}`);
        if (sms.ok) smsSent++;
      }
    }
    await sendDiscord(ctx, `📢 **${title}**\n${body.slice(0, 700)} — full story: ${url}`, "New announcement");
    return { emailSent, smsSent, total: subscribers.length };
  },
});

/** Alerts the org + Discord when a Super Admin revokes a management user's access. */
export const staffRemoved = action({
  args: { name: v.string(), email: v.string(), removedBy: v.string() },
  handler: async (ctx, { name, email, removedBy }) => {
    const body = `
      <h2 style="margin:0 0 12px;">Management access revoked</h2>
      <p><strong>${esc(name)}</strong>${email ? ` (${esc(email)})` : ""} has been removed from the management portal by <strong>${esc(removedBy)}</strong>.</p>
      <p>Their login credentials have been revoked immediately and all active sessions were closed. This person can no longer sign in to The Den.</p>`;
    const emailRes = await send(ctx, {
      to: ORG_EMAILS,
      subject: `Management access revoked — ${name}`,
      html: shell("Access revoked", body),
    });
    await sendDiscord(
      ctx,
      `🚫 **Management access revoked** — ${name}${email ? ` (${email})` : ""} was removed by ${removedBy}. All sessions closed.`,
      "Access revoked",
    );
    return emailRes;
  },
});

/** Confirms a successful donation (called from the Stripe webhook). */
export const paymentReceived = action({
  args: { name: v.string(), email: v.string(), amount: v.number(), currency: v.string() },
  handler: async (ctx, { name, email, amount, currency }) => {
    const major = (amount / 100).toFixed(2);
    const body = `
      <h2 style="margin:0 0 12px;">New donation 🎉</h2>
      <p><strong>${esc(name)}</strong> donated <strong>${currency.toUpperCase()} ${major}</strong> to Wolf Society Esports.</p>
      <p>Thank them at ${esc(email)}.</p>`;
    await send(ctx, { to: ORG_EMAILS, subject: `Donation received — ${currency.toUpperCase()} ${major}`, html: shell("Donation received", body) });
    await sendDiscord(ctx, `💜 **New donation** — ${name} donated ${currency.toUpperCase()} ${major}. Thank them at ${email}!`, "Donation received");
    await send(ctx, {
      to: email,
      subject: `Thank you for your donation — Wolf Society Esports`,
      html: shell("Thank you", `
        <h2 style="margin:0 0 12px;">Thank you, ${esc(name)}!</h2>
        <p>Your donation of <strong>${currency.toUpperCase()} ${major}</strong> helps the Society grow — more scrims, better gear, bigger stages.</p>
        <p style="margin-top:16px;">— The Wolf Society Esports team</p>
      `),
    });
    return { ok: true };
  },
});

/** Alerts the org + Discord when a tryout registration lands (paid or free). */
export const tryoutReceived = action({
  args: {
    name: v.string(),
    email: v.string(),
    game: v.string(),
    role: v.optional(v.string()),
    region: v.optional(v.string()),
    paid: v.boolean(),
  },
  handler: async (ctx, { name, email, game, role, region, paid }) => {
    const body = `
      <h2 style="margin:0 0 12px;">New tryout registration</h2>
      <table style="border-collapse:collapse;margin-top:8px;">
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Name</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(name)}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Game</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(game)}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Role</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(role ?? "—")}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Region</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${esc(region ?? "—")}</td></tr>
        <tr><td style="padding:6px 12px;border:1px solid #e8e7f5;font-weight:bold;">Fee</td>
            <td style="padding:6px 12px;border:1px solid #e8e7f5;">${paid ? "Paid ✅" : "Free entry"}</td></tr>
      </table>
      <p style="margin-top:16px;">Review tryouts in The Den → Tryouts.</p>`;
    await send(ctx, { to: ORG_EMAILS, subject: `New tryout — ${name} (${game})`, html: shell("New tryout", body) });
    await sendDiscord(ctx, `🏆 **New tryout** — ${name} signed up for ${game}${role ? ` as ${role}` : ""}${paid ? " (fee paid ✅)" : " (free entry)"}.`, "New tryout registration");
    await send(ctx, {
      to: email,
      subject: `Tryout received — Wolf Society Esports`,
      html: shell("Tryout received", `
        <h2 style="margin:0 0 12px;">Thank you, ${esc(name)}!</h2>
        <p>Your tryout for <strong>${esc(game)}</strong> has been received${paid ? " and your fee is confirmed" : ""}. Our coaches will contact you at this email with tryout details.</p>
        <p style="margin-top:16px;">— The Wolf Society Esports team</p>
      `),
    });
    return { ok: true };
  },
});
