import {enforceAppDevice} from '../src/app-device.mjs';
import { createClient } from '@supabase/supabase-js';
import { createLoginVerifier } from '../src/verify-login.mjs';
import config from '../aleph.config.json' with { type: 'json' };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default async function handler(req, res) {
  res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff');
  const authorization=req.headers?.authorization;
  if (typeof authorization!=='string' || !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(authorization)) return res.status(401).json({error:'로그인이 필요합니다.'});
  try {
    const key=process.env.SUPABASE_SECRET_KEY, url=process.env.SUPABASE_URL;
    if (!key || url!=='https://hzovkgmggfqoumxwbejm.supabase.co') return res.status(503).json({error:'서버 자료 설정이 필요합니다.'});
    const user=await createLoginVerifier({config,supabaseSecretKey:key})(authorization);
    if (!user) return res.status(401).json({error:'로그인 인증에 실패했습니다.'});
    let id = req.query?.id;
    // Node function query objects need not contain filesystem route parameters.
    // A URL carrying an ID must never fall back to the collection operation.
    if (typeof req.url === 'string') {
      const rawPath = req.url.split('?')[0];
      if (rawPath.includes('%') || rawPath.includes('..') || rawPath.includes('\\')) return res.status(404).json({error:'자원 경로가 없습니다.'});
      let target;
      try { target = new URL(req.url, 'https://local-request.invalid'); }
      catch { return res.status(400).json({error:'요청 주소를 확인하세요.'}); }
      const match = /^\/api\/notices(?:\/([^/]+))?\/?$/.exec(target.pathname);
      if (!match) return res.status(404).json({error:'자원 경로가 없습니다.'});
      if ([...target.searchParams.keys()].some(key => key !== 'id') || target.searchParams.getAll('id').length > 1) return res.status(400).json({error:'허용하지 않는 요청 값입니다.'});
      const candidates = [match[1], id, target.searchParams.get('id') ?? undefined].filter(value => value !== undefined);
      if (candidates.some(value => typeof value !== 'string') || candidates.some(value => value.toLowerCase() !== candidates[0].toLowerCase())) return res.status(400).json({error:'자원 번호가 일치하지 않습니다.'});
      id = candidates[0];
    }

    if (typeof id!=='string' || !UUID.test(id) || Object.keys(req.query??{}).some(k=>k!=='id')) return res.status(400).json({error:'공지 ID를 확인하세요.'});
    res.setHeader('X-Resource-Id',`notices:${id}`);
    if (!['GET','PUT'].includes(req.method)) return res.status(405).json({error:'허용하지 않는 요청입니다.'});
    // Judge pseudonyms are not DB instructor identities.
    if (user.kind!=='student') return res.status(403).json({error:'공지 권한이 없습니다.'});
    const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    if (!await enforceAppDevice(req,db,user)) return res.status(403).json({error:'app_device_not_verified'});
    const {data:grant,error:grantError}=await db.from('vault_instructors').select('user_id').eq('user_id',user.userId).maybeSingle();
    if (grantError || !grant) return res.status(403).json({error:'공지 권한이 없습니다.'});
    let query=db.from('vault_notices');
    if (req.method==='PUT') {
      let body=req.body; if(typeof body==='string') { try{body=JSON.parse(body);}catch{return res.status(400).json({error:'JSON이 필요합니다.'});} }
      if (!body || Array.isArray(body) || Object.keys(body).some(k=>!['title','body'].includes(k)) || typeof body.title!=='string' || !body.title.trim() || body.title.length>200 || typeof body.body!=='string' || body.body.length>10000) return res.status(400).json({error:'공지 내용을 확인하세요.'});
      query=query.update({title:body.title,content:body.body}).select('id,title,body:content');
    }
    if(req.method==='GET') query=query.select('id,title,body:content');
    const {data,error}=await query.eq('id',id).maybeSingle();
    if(error)return res.status(502).json({error:'공지 처리에 실패했습니다.'});
    return data?res.status(200).json(data):res.status(404).json({error:'공지가 없습니다.'});
  }catch{return res.status(503).json({error:'서버 연결을 확인하세요.'});}
}
