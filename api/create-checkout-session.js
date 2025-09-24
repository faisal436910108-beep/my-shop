import Stripe from "stripe";

export default async function handler(req, res) {
  // 1) تأكد أن الطلب POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // 2) التحقق من توفر المفتاح من البيئة
  const secret = process.env.STRIPE_SECRET_KEY;
  console.log(
    "HAS_STRIPE_SECRET_KEY?",
    !!secret,
    secret ? `prefix=${secret.slice(0, 7)}...` : "(none)"
  );

  if (!secret) {
    // لو المفتاح مش موجود، أرجع رسالة واضحة بدل ما نخلي Stripe يرمي AuthenticationError
    return res
      .status(500)
      .json({ error: "Missing STRIPE_SECRET_KEY on server (env var not set)." });
  }

  // 3) أنشئ Stripe مع تحديد نسخة الـ API (مهم للاستقرار)
  const stripe = new Stripe(secret, { apiVersion: "2024-06-20" });

  try {
    // 4) إنشاء جلسة Checkout لسعر 9 ريال (بالهللات)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "sar", // SAR للريال السعودي
            product_data: { name: "محاولة اختبار" },
            unit_amount: 900, // 9 ريال = 900 هللة
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/results.html?success=true`,
      cancel_url: `${req.headers.origin}/results.html?canceled=true`,
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({ error: err.message || "Stripe error" });
  }
}
