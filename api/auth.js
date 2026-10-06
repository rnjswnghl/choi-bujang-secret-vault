// Fixed Auth-only upstream. This endpoint never forwards Data API requests.
const origin = 'https://hzovkgmggfqoumxwbejm.supabase.co';
const publicKey = 'sb_publishable_nNaEZ0ROeB-Zu_9ko7-c4Q_FCKYuwlS';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const { path, grant_type, scope } = req.query ?? {};
  const allowed = (req.method === 'POST' && path === 'token' && ['password', 'refresh_token'].includes(grant_type) && scope === undefined)
    || (req.method === 'POST' && path === 'logout' && grant_type === undefined && (scope === undefined || ['global','local','others'].includes(scope)))
    || (req.method === 'GET' && path === 'user' && grant_type === undefined && scope === undefined);
  if (!allowed || Object.keys(req.query ?? {}).some(key => !['path','grant_type','scope'].includes(key))) return res.status(400).json({ error: '허용하지 않는 인증 요청입니다.' });
  if (req.headers?.origin && req.headers.origin !== 'https://choi-bujang-secret-vault-khaki.vercel.app') return res.status(403).json({ error: '허용하지 않는 출처입니다.' });
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON이 필요합니다.' }); } }
  if (path === 'token') {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: '인증 정보가 필요합니다.' });
    if (grant_type === 'password') {
      if (typeof body.email !== 'string' || typeof body.password !== 'string' || body.email.length > 320 || body.password.length > 4096) return res.status(400).json({ error: '이메일과 비밀번호를 확인하세요.' });
      body = { email: body.email, password: body.password, ...(body.gotrue_meta_security ? {gotrue_meta_security:body.gotrue_meta_security} : {}) };
    } else {
      if (typeof body.refresh_token !== 'string' || body.refresh_token.length > 8192) return res.status(400).json({ error: '갱신 정보가 필요합니다.' });
      body = { refresh_token: body.refresh_token };
    }
  }
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || publicKey;
  const authorization = path === 'token' ? `Bearer ${key}` : req.headers?.authorization;
  if (path !== 'token' && (typeof authorization !== 'string' || !authorization.startsWith('Bearer ') || authorization.length > 8192)) return res.status(401).json({ error: '로그인이 필요합니다.' });
  const target = new URL(`/auth/v1/${path}`, origin);
  if (grant_type) target.searchParams.set('grant_type', grant_type);
  if (scope) target.searchParams.set('scope', scope);
  try {
    const response = await fetch(target, {
      method: req.method, headers: { apikey: key, Authorization: authorization, 'Content-Type': 'application/json' },
      body: path === 'token' ? JSON.stringify(body) : undefined,
      redirect: 'error', signal: AbortSignal.timeout(10000),
    });
    if (response.status === 204) return res.status(204).end();
    const data = await response.json();
    // Auth responses legitimately contain session tokens, never API keys.
    if (JSON.stringify(data).includes(key)) return res.status(502).json({ error: '인증 응답을 확인할 수 없습니다.' });
    return res.status(response.status).json(data);
  } catch { return res.status(502).json({ error: '인증 서버에 연결할 수 없습니다.' }); }
}
