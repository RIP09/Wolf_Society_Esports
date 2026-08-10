import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

/**
 * Sends the OTP through your own Resend key (RESEND_API_KEY), which keeps
 * player login emails working after deploying to Vercel + your own Convex
 * project. Returns false (so the caller can fall back) when the key is not
 * configured — e.g. in the Freebuff preview, where the relay below is used.
 */
async function sendViaResend(email: string, token: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const from =
    process.env.NOTIFY_FROM_EMAIL ??
    "Wolf Society Esports <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your sign-in code — Wolf Society Esports",
      html: `<!doctype html><html><body style="margin:0;padding:0;background:#f4f3fb;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3fb;padding:32px 12px;">
          <tr><td align="center">
            <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:2px solid #1b1d3a;border-radius:8px;overflow:hidden;">
              <tr><td style="background:#7b5cf0;padding:18px 28px;">
                <span style="color:#ffffff;font-size:18px;font-weight:bold;">Wolf Society Esports</span>
              </td></tr>
              <tr><td style="padding:28px;color:#1b1d3a;font-size:14px;line-height:1.7;">
                <h2 style="margin:0 0 12px;">Your sign-in code</h2>
                <p>Use this code to sign in to the Wolf Society Esports platform. It expires in 15 minutes.</p>
                <p style="margin:24px 0;padding:16px;background:#f4f3fb;border:2px dashed #7b5cf0;border-radius:8px;text-align:center;font-size:30px;font-weight:bold;letter-spacing:8px;color:#1b1d3a;">${token}</p>
                <p style="font-size:12px;color:#63658a;">If you didn't request this code, you can safely ignore this email.</p>
              </td></tr>
              <tr><td style="padding:14px 28px;border-top:1px solid #e8e7f5;color:#63658a;font-size:12px;">
                This is an automated message from the Wolf Society Esports platform.
              </td></tr>
            </table>
          </td></tr>
        </table></body></html>`,
    }),
  });
  return res.ok;
}

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    try {
      // 1) Preferred: your own Resend key (works on Vercel + own Convex).
      if (await sendViaResend(email, token)) return;
      // 2) Fallback: Freebuff's built-in relay (dev/preview environment only).
      await axios.post(
        "https://auth.freebuff.app/send_otp",
        {
          to: email,
          otp: token,
          appName: process.env.VLY_APP_NAME || "a freebuff.com application",
        },
        {
          headers: {
            "x-api-key": "fb_email_2crN1hqIArZP2bEfvjp5Qik4",
          },
        },
      );
    } catch (error) {
      throw new Error(JSON.stringify(error));
    }
  },
});
