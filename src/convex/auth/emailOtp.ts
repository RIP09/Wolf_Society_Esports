import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

/**
 * Sends the OTP through your own Resend key (RESEND_API_KEY), which keeps
 * player login emails working after deploying to Vercel + your own Convex
 * project. Returns false (so the caller can fall back) when the key is not
 * configured — e.g. in the Freebuff preview, where the relay below is used.
 *
 * The email is fully branded: "Wolf Society Esports" appears in the subject,
 * header, body and footer — the code that lands in the player's inbox can
 * never show another organization's name.
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
      subject: "Your Wolf Society Esports sign-in code",
      html: `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f3fb;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3fb;padding:36px 12px;">
      <tr><td align="center">
        <!-- Card -->
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:100%;background:#ffffff;border:3px solid #141414;box-shadow:8px 8px 0 0 #141414;">

          <!-- Brand bar -->
          <tr>
            <td style="background:#141414;padding:20px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" style="width:44px;height:44px;background:#facc15;border:2px solid #141414;">
                            <tr><td align="center" style="font-size:22px;line-height:44px;">🐺</td></tr>
                          </table>
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">WOLF SOCIETY ESPORTS</span>
                          <div style="color:#facc15;font-size:11px;font-weight:bold;letter-spacing:2px;margin-top:2px;text-transform:uppercase;">The Pack · Management · Esports</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;color:#141414;font-size:14px;line-height:1.7;">
              <h2 style="margin:0 0 6px;font-size:22px;color:#141414;">Thank you, Wolf! 🐺</h2>
              <p style="margin:0 0 18px;color:#141414;">
                Thanks for signing in to the <strong>Wolf Society Esports</strong> platform. Use the code
                below to finish logging in — it expires in <strong>15 minutes</strong>.
              </p>

              <!-- OTP box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:#f4f3fb;border:3px dashed #141414;">
                <tr>
                  <td align="center" style="padding:22px 16px;">
                    <div style="font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:#5b5b5b;margin-bottom:10px;">Your one-time sign-in code</div>
                    <span style="font-family:monospace,Consolas,'Courier New',monospace;font-size:38px;font-weight:bold;letter-spacing:12px;color:#141414;background:#facc15;padding:10px 18px;border:2px solid #141414;">${token}</span>
                  </td>
                </tr>
              </table>

              <!-- Safety note -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#141414;">
                <tr>
                  <td style="padding:12px 16px;">
                    <span style="color:#facc15;font-size:12px;font-weight:bold;">
                      🔒 Never share this code with anyone. Wolf Society Esports staff will never ask for it.
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#5b5b5b;">
                Didn't request this code? You can safely ignore this email — your account stays protected.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 28px;border-top:3px solid #141414;background:#f4f3fb;color:#5b5b5b;font-size:12px;line-height:1.6;">
              <strong style="color:#141414;">Wolf Society Esports</strong> — official esports organization platform.<br/>
              This is an automated message — do not reply to this email.
            </td>
          </tr>
        </table>

        <p style="margin:22px 0 0;font-size:11px;color:#8a8a8a;">
          © ${new Date().getFullYear()} Wolf Society Esports · All rights reserved
        </p>
      </td></tr>
    </table>
  </body>
</html>`,
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
          appName: process.env.VLY_APP_NAME || "Wolf Society Esports",
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
