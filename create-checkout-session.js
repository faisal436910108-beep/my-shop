import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'sar',
            product_data: {
              name: 'محاولة اختبار واحدة',
            },
            unit_amount: 900, // السعر بالهللة (9 ريال)
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/index.html?success=true`,
      cancel_url: `${req.headers.origin}/index.html?canceled=true`,
    });

    res.status(200).json({ id: session.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل إنشاء جلسة الدفع' });
  }
}
