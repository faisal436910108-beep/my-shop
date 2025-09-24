// api/verify-session.js
import Stripe from "stripe";
import fetch from "node-fetch";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: "Missing session_id" });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session || session.payment_status !== "paid") {
      return res.status(400).json({ paid: false });
    }

    // حفظ السجل في Supabase (مفتاح Service Role سيُوضع كمتغير بيئة)
    const SUPA_URL = process.env.SUPABASE_URL;
    const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
    const paymentsTable = process.env.SUPABASE_PAYMENTS_TABLE || "payments_open";

    const payload = {
      email: session.customer_email,
      amount: session.amount_total / 100,
      currency: session.currency,
      stripe_session_id: session.id,
      paid: true,
      // صلاحية المحاولة = 80 دقيقة من الآن
      expires_at: new Date(Date.now() + (80 * 60 * 1000)).toISOString()
    };

    const r = await fetch(`${SUPA_URL}/rest/v1/${paymentsTable}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPA_SERVICE_KEY,
        "Authorization": `Bearer ${SUPA_SERVICE_KEY}`
      },
      body: JSON.stringify(payload)
    });

    // حتى لو فشل الإدخال في Supabase، نرجّع نجاح الدفع لأن Stripe أكّد الدفع
    if (!r.ok) {
      const txt = await r.text();
      console.warn("Supabase write failed", r.status, txt);
    }

    return res.json({ paid: true, email: session.customer_email, expires_at: payload.expires_at });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
