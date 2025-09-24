import Stripe from "stripe";

// اجبر الدالة تشتغل على نود 18 (يدعم ESM)
export const config = { runtime: "nodejs18.x" };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // فحص المفتاح
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error("❌ Missing STRIPE_SECRET_KEY env var");
      return res.status(500).json({ error: "Missing STRIPE_SECRET_KEY" });
    }

    const origin = req.headers.origin || `https://${req.headers.host}`;
    console.log("🔎 origin =", origin);

    // لتبسيط الاختبار نحط USD مؤقتًا
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",            // جرّب usd مؤقتًا
            product_data: { name: "محاولة اختبار المحاسبة" },
            unit_amount: 900,           // 9.00$ (للاختبار)
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=true`,
    });

    console.log("✅ session created", session.id);
    return res.status(200).json({ url: session.url, id: session.id });
  } catch (e) {
    console.error("💥 [create-checkout-session] error:", e);
    return res.status(500).json({ error: e.message, code: e.code });
  }
}
