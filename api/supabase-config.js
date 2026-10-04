// Vercel Serverless API Route para expor as credenciais públicas do Supabase
// Injetadas automaticamente pela integração Supabase do Vercel
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  return res.status(200).json({
    configured: Boolean(url && anonKey),
    url: url || null,
    anonKey: anonKey || null
  });
}
