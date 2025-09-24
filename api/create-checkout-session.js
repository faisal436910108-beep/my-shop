import Stripe from "stripe";

console.log("Stripe Secret Loaded:", process.env.STRIPE_SECRET_KEY ? "YES" : "NO");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "sar", // الريال السعودي
              product_data: {
                name: "محاولة اختبار"
              },
              unit_amount: 900, // 9 ريال بالهللة (Stripe يحسبها بالـ "halala" = 100)
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.headers.origin}/results.html?success=true`,
        cancel_url: `${req.headers.origin}/results.html?canceled=true`,
      });

      res.status(200).json({ id: session.id });
    } catch (err) {
      console.error("Stripe error:", err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
