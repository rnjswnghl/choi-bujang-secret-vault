import {enforceAppDevice} from '../src/app-device.mjs';
import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { createLoginVerifier } from '../src/verify-login.mjs';
import config from '../aleph.config.json' with { type: 'json' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const clientRequestId=req.headers?.['x-client-request-id'];
  res.setHeader('X-Request-Id', UUID.test(clientRequestId??'') ? clientRequestId : randomUUID());
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const authorization = req.headers?.authorization;
  if (typeof authorization !== 'string' || authorization.length > 8192 || !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization)) return res.status(401).json({ error: '로그인이 필요합니다.' });
  try {
    const key = process.env.SUPABASE_SECRET_KEY;
    const url = process.env.SUPABASE_URL;
    if (!key || url !== 'https://hzovkgmggfqoumxwbejm.supabase.co') return res.status(503).json({ error: '서버 자료 설정이 필요합니다.' });
    const verify = createLoginVerifier({ config, supabaseSecretKey: key });
    const user = await verify(authorization);
    if (!user) return res.status(401).json({ error: '로그인 인증에 실패했습니다.' });
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    if (!await enforceAppDevice(req,db,user)) return res.status(403).json({error:'app_device_not_verified'});
    let id = req.query?.id;
    // Node function query objects need not contain filesystem route parameters.
    // A URL carrying an ID must never fall back to the collection operation.
    if (typeof req.url === 'string') {
      const rawPath = req.url.split('?')[0];
      if (rawPath.includes('%') || rawPath.includes('..') || rawPath.includes('\\')) return res.status(404).json({error:'자원 경로가 없습니다.'});
      let target;
      try { target = new URL(req.url, 'https://local-request.invalid'); }
      catch { return res.status(400).json({error:'요청 주소를 확인하세요.'}); }
      const match = /^\/api\/notes(?:\/([^/]+))?\/?$/.exec(target.pathname);
      if (!match) return res.status(404).json({error:'자원 경로가 없습니다.'});
      if ([...target.searchParams.keys()].some(key => key !== 'id') || target.searchParams.getAll('id').length > 1) return res.status(400).json({error:'허용하지 않는 요청 값입니다.'});
      const candidates = [match[1], id, target.searchParams.get('id') ?? undefined].filter(value => value !== undefined);
      if (candidates.some(value => typeof value !== 'string') || candidates.some(value => value.toLowerCase() !== candidates[0].toLowerCase())) return res.status(400).json({error:'자원 번호가 일치하지 않습니다.'});
      id = candidates[0];
    }

    if (id !== undefined && (typeof id !== 'string' || !UUID.test(id))) return res.status(400).json({ error: 'UUID가 필요합니다.' });
    res.setHeader('X-Resource-Id', id ? `notes:${id}` : 'notes:own-list');
    const table = () => db.from('vault_notes');
    const fields = 'id,title,body:content';
    if (req.query && Object.keys(req.query).some(key => key !== 'id')) return res.status(400).json({ error: '허용하지 않는 요청 값입니다.' });
    if (req.method === 'GET') {
      const readFields = 'id,title,body:content,owner_id';
      const query = id ? table().select(readFields).eq('id', id).eq('owner_id', user.userId).maybeSingle() : table().select(readFields).eq('owner_id', user.userId).order('id');
      const { data, error } = await query;
      if (error) return res.status(502).json({ error: '자료를 읽을 수 없습니다.' });
      // Verify the returned stored owner again before exposing any read result.
      const own = row => row && typeof row.owner_id === 'string'
        && row.owner_id.toLowerCase() === user.userId.toLowerCase();
      const publicNote = row => ({id:row.id,title:row.title,body:row.body});
      if (id) {
        if (!own(data) || typeof data.id !== 'string' || data.id.toLowerCase() !== id.toLowerCase()) return res.status(404).json({error:'메모가 없습니다.'});
        return res.status(200).json(publicNote(data));
      }
      if (!Array.isArray(data)) return res.status(502).json({error:'자료 형식이 올바르지 않습니다.'});
      return res.status(200).json(data.filter(own).map(publicNote));
    }
    if (req.method === 'POST' || req.method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON이 필요합니다.' }); } }
      if (body && (Object.hasOwn(body, 'owner_id') || Object.hasOwn(body, 'userId') || Object.hasOwn(body, 'role'))) return res.status(403).json({ error: '소유자와 신원은 서버가 결정합니다.' });
      const allowed = req.method === 'POST' ? ['id', 'title', 'body'] : ['title', 'body'];
      if (!body || Array.isArray(body) || Object.keys(body).some(key => !allowed.includes(key))) return res.status(400).json({ error: '허용하지 않는 메모 값입니다.' });
      if (!body || typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200 || typeof body.body !== 'string' || body.body.length > 10000) return res.status(400).json({ error: '제목과 본문을 확인하세요.' });
      if (req.method === 'POST') {
        if (id) return res.status(405).json({ error: '목록 경로에 추가하세요.' });
        const newId = body.id ?? randomUUID();
        if (typeof newId !== 'string' || !UUID.test(newId)) return res.status(400).json({ error: 'UUID가 필요합니다.' });
        const { error } = await table().insert({ id: newId, title: body.title, content: body.body, owner_id: user.userId });
        return error ? res.status(error.code === '23505' ? 409 : 502).json({ error: '메모 추가에 실패했습니다.' }) : res.status(201).json({ id: newId });
      }
      if (!id) return res.status(400).json({ error: '메모 ID가 필요합니다.' });
      // Filter the existing row by verified owner; never update ownership.
      const { data, error } = await table().update({ title: body.title, content: body.body }).eq('id', id).eq('owner_id', user.userId).select(fields).maybeSingle();
      if (error) return res.status(502).json({ error: '메모 수정에 실패했습니다.' });
      return data ? res.status(200).json(data) : res.status(404).json({ error: '메모가 없습니다.' });
    }
    if (req.method === 'DELETE' && id) {
      const { data, error } = await table().delete().eq('id', id).eq('owner_id', user.userId).select('id').maybeSingle();
      if (error) return res.status(502).json({ error: '메모 삭제에 실패했습니다.' });
      return data ? res.status(200).json({ id: data.id }) : res.status(404).json({ error: '메모가 없습니다.' });
    }
    res.setHeader('Allow', id ? 'GET, PUT, DELETE' : 'GET, POST');
    return res.status(405).json({ error: '허용하지 않는 요청입니다.' });
  } catch { return res.status(503).json({ error: '서버 연결을 확인하세요.' }); }
}
