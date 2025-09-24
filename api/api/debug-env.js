// api/debug-env.js
export default async function handler(req, res) {
  const key = process.env.STRIPE_SECRET_KEY || null;
  const hasKey = !!key;

  // لا نظهر المفتاح، فقط أول 6 حروف لنتأكد
  const preview = key ? key.slice(0, 6) + '...' : null;

  res.status(200).json({
    ok: true,
    hasKey,
    preview,
    // مفيد للتأكد أنك على المشروع الصحيح
    vercelUrl: process.env.VERCEL_URL || null,
    // نعرض أي متغيرات تتضمن STRIPE للتأكد من الاسم
    envFound: Object.keys(process.env).filter(k => k.includes('STRIPE')),
  });
}
