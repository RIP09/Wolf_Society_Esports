import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

/**
 * Stripe Checkout webhook. Verifies the `stripe-signature` header with the
 * webhook secret, then confirms the matching donation / tryout and notifies
 * the organization in real time.
 */
http.route({
  path: "/stripe-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      });
    }
    const sig = request.headers.get("stripe-signature");
    const raw = await request.text();
    if (!sig) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify the signature: signed payload is `t=<ts>.v1=<raw body>`,
    // HMAC-SHA256 with the webhook secret.
    const parts = new Map<string, string>();
    for (const pair of sig.split(",")) {
      const [k, ...rest] = pair.split("=");
      parts.set(k, rest.join("="));
    }
    const timestamp = parts.get("t");
    const expected = parts.get("v1");
    if (!timestamp || !expected) {
      return new Response(JSON.stringify({ error: "Malformed signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const signedPayload = `${timestamp}.${raw}`;
    let digest = "";
    try {
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedPayload));
      digest = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      return new Response(JSON.stringify({ error: "Signature verification failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (digest !== expected) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let event: { type?: string; data?: { object?: { id?: string; amount_total?: number; currency?: string } } };
    try {
      event = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      if (session?.id) {
        const donation = await ctx.runQuery(internal.payments.findDonationBySession, { sessionId: session.id });
        if (donation) {
          await ctx.runMutation(internal.payments.confirmDonation, {
            donationId: donation._id,
            amount: session.amount_total ?? donation.amount,
            currency: session.currency ?? donation.currency,
          });
          return new Response("ok", { status: 200 });
        }
        const tryout = await ctx.runQuery(internal.payments.findTryoutBySession, { sessionId: session.id });
        if (tryout) {
          await ctx.runMutation(internal.payments.confirmTryout, { tryoutId: tryout._id });
          return new Response("ok", { status: 200 });
        }
      }
    }

    return new Response("ok", { status: 200 });
  }),
});

export default http;
