import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === 'string') {
    body = JSON.parse(body);
  }

  const { session_id } = body || {};

  if (!session_id) {
    return res.status(400).json({ error: "Missing session_id" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // الدفع ناجح فقط إذا payment_status = 'paid'
    const paid = session.payment_status === "paid";
    // لتفعيل المحاولة لمدة 80 دقيقة
    const expires_at = new Date(Date.now() + 80 * 60 * 1000).toISOString();

    res.status(200).json({
      id: session.id,
      paid,
      email: session.customer_email,
      expires_at,
      amount_total: session.amount_total,
      currency: session.currency,
      payment_status: session.payment_status,
    });
  } catch (err) {
    console.error("Stripe verify error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
