import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    res.status(500).json({ error: 'Missing STRIPE_SECRET_KEY on server (env var not set).' });
    return;
  }

  try {
    let body = req.body;
    // إذا جاء body كسلسلة نصية (string) حوله إلى JSON
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const { amount, currency } = body || {};
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency || 'usd',
            product_data: { name: 'Test Product' },
            unit_amount: amount || 1000,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error(error); // مهم لفحص الأخطاء في Vercel
    res.status(500).json({ error: error.message });
  }
}
