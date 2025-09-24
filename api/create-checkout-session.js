import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  console.log("STRIPE: Handler called, method:", req.method);

  if (req.method !== 'POST') {
    console.log("STRIPE: Wrong method");
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    console.log("STRIPE: STRIPE_SECRET_KEY missing");
    res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY on server (env var not set).' });
    return;
  }

  try {
    let body = req.body;
    console.log("STRIPE: Raw body:", body);

    if (typeof body === 'string') {
      body = JSON.parse(body);
      console.log("STRIPE: Parsed string body:", body);
    }

    const email = body?.email || '';
    const amount = 9 * 100;
    console.log("STRIPE: Creating session for email:", email, "amount:", amount);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'sar',
            product_data: { name: 'محاكاة اختبار محاسبة (محاولة واحدة)' },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/index.html?checkout_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/index.html?cancelled=1`,
    });

    console.log("STRIPE: Session created:", session.id);
    res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error("STRIPE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}
