import { ConvexError, v } from "convex/values";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { action, mutation } from "./_generated/server";
import { api } from "./_generated/api";
import { sendSms } from "./notify";
import { enforceRateLimit } from "./rateLimit";
import { requireUser } from "./guards";

/**
 * SMS one-time-password service.
 *
 * Complements the email OTP login with phone-ownership verification:
 *  - `requestSmsOtp` generates a 6-digit code, stores it (15 min expiry,
 *    max 3 requests / 10 min per number) and delivers it over SMS via the
 *    same Vonage pipeline as every other platform notification.
 *  - `verifySmsOtp` checks the code (max 5 attempts), and when the caller is
 *    signed in as a player whose profile carries that phone number, stamps
 *    `phoneVerifiedAt` so management can see the number was proven.
 *
 * Used by the player registration form, and reusable anywhere a real phone
 * needs to be confirmed (contact form, access requests, tryouts…).
 */

const CODE_LIFETIME_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;
const REQUEST_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 3;

function generateCode(): string {
  const random: RandomReader = {
    read(bytes: Uint8Array) {
      crypto.getRandomValues(bytes);
    },
  };
  return generateRandomString(random, "0123456789", 6);
}

/** Loose international-format check: digits + optional +/spaces, at least 6 digits. */
function normalizePhone(raw: string): string {
  const phone = raw.trim().replace(/\s+/g, " ");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6 || digits.length > 15) {
    throw new ConvexError({ message: "Enter a valid phone number with country code (e.g. +91 98765 43210)." });
  }
  return phone;
}

/** Request a code — rate-limited per number, stored with an expiry, delivered by SMS. */
export const requestSmsOtp = mutation({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    const clean = normalizePhone(phone);
    await enforceRateLimit(ctx, `sms-otp:${clean}`, MAX_REQUESTS, REQUEST_WINDOW_MS);

    // Old codes for this number can never be reused — clear them first.
    const stale = await ctx.db
      .query("smsOtps")
      .withIndex("by_phone", (q) => q.eq("phone", clean))
      .collect();
    for (const row of stale) await ctx.db.delete(row._id);

    const code = generateCode();
    await ctx.db.insert("smsOtps", {
      phone: clean,
      code,
      expiresAt: Date.now() + CODE_LIFETIME_MS,
      attempts: 0,
      verified: false,
      createdAt: Date.now(),
    });

    // Deliver in the background so the request returns instantly.
    await ctx.scheduler.runAfter(0, api.smsOtp.sendOtpSms, { phone: clean, code });
    return { ok: true, expiresInSeconds: CODE_LIFETIME_MS / 1000 };
  },
});

/** Background delivery of an OTP code over SMS (Vonage). Never call directly from the client. */
export const sendOtpSms = action({
  args: { phone: v.string(), code: v.string() },
  handler: async (ctx, { phone, code }) => {
    return sendSms(
      ctx,
      phone,
      `Wolf Society Esports: your verification code is ${code}. It expires in 15 minutes. Never share it with anyone.`,
    );
  },
});

/** Verify a code. On success: marks it used (row deleted) and — for a signed-in
 *  player whose profile matches the number — stamps phoneVerifiedAt. */
export const verifySmsOtp = mutation({
  args: { phone: v.string(), code: v.string() },
  handler: async (ctx, { phone, code }) => {
    const clean = normalizePhone(phone);
    const row = await ctx.db
      .query("smsOtps")
      .withIndex("by_phone", (q) => q.eq("phone", clean))
      .order("desc")
      .first();
    if (!row) {
      throw new ConvexError({ message: "No code was requested for this number. Request one first." });
    }
    if (row.verified) {
      throw new ConvexError({ message: "This number is already verified." });
    }
    if (Date.now() > row.expiresAt) {
      await ctx.db.delete(row._id);
      throw new ConvexError({ message: "That code has expired — request a new one." });
    }
    if (row.attempts >= MAX_ATTEMPTS) {
      await ctx.db.delete(row._id);
      throw new ConvexError({ message: "Too many incorrect attempts — request a new code." });
    }
    if (row.code.trim() !== code.trim()) {
      const attempts = row.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await ctx.db.delete(row._id);
        throw new ConvexError({ message: "Too many incorrect attempts — request a new code." });
      }
      await ctx.db.patch(row._id, { attempts });
      throw new ConvexError({ message: "That code is incorrect — try again." });
    }

    await ctx.db.delete(row._id); // one-time use

    // If this caller is a registered player with this exact number, stamp it.
    try {
      const user = await requireUser(ctx);
      const profile = await ctx.db
        .query("players")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .first();
      if (profile && profile.phone && profile.phone.replace(/\s+/g, " ") === clean) {
        await ctx.db.patch(profile._id, { phoneVerifiedAt: Date.now() });
      }
    } catch {
      // Not signed in — phone is verified in the session; linking happens later.
    }
    return { ok: true, verified: true };
  },
});
