// api/create-checkout-session.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2022-11-15" });

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Missing email" });

    const domain = process.env.PUBLIC_DOMAIN || (req.headers.origin || `https://${req.headers.host}`);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Apple Pay/Google Pay تُفعّل تلقائيًا في Checkout
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "sar",
          product_data: { name: "محاولة الاختبار - سعر الدخول" },
          unit_amount: 9 * 100, // 9 SAR
        },
        quantity: 1
      }],
      customer_email: email,
      success_url: `${domain}/?checkout_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/?canceled=1`
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
