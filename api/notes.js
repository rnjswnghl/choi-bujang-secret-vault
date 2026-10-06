import { createClient } from '@supabase/supabase-js';

// Stage 2 deliberately has no caller authentication. Use fictional data only.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: '허용하지 않는 요청입니다.' });
  }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) return res.status(503).json({ error: '서버 자료 설정이 필요합니다.' });
  try {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await client.from('vault_notes')
      .select('title,content').order('id');
    if (error) return res.status(502).json({ error: '자료를 읽을 수 없습니다.' });
    return res.status(200).json({ notes: data });
  } catch {
    return res.status(502).json({ error: '자료를 읽을 수 없습니다.' });
  }
}
