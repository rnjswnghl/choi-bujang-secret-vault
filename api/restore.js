import {createClient} from '@supabase/supabase-js';
import {createLoginVerifier} from '../src/verify-login.mjs';
import config from '../aleph.config.json' with {type:'json'};
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'method_not_allowed'});}
 if(req.url&&req.url!=='/api/restore')return res.status(400).json({error:'invalid_restore_path'});
 const authorization=req.headers?.authorization;
 if(typeof authorization!=='string'||authorization.length>8192)return res.status(401).json({error:'login_required'});
 try {
  const key=process.env.SUPABASE_SECRET_KEY,url=process.env.SUPABASE_URL;
  if(!key||url!==new URL(config.identityProvider.issuer).origin)return res.status(503).json({error:'restore_unavailable'});
  const user=await createLoginVerifier({config,supabaseSecretKey:key})(authorization);
  if(!user)return res.status(401).json({error:'login_required'});
  // Recovery testing is scoped to the signed judge B identity, never body role/owner.
  if(user.kind!=='judge'||user.identity!=='b')return res.status(403).json({error:'restore_forbidden'});
  let body=req.body;
  if(typeof body==='string'){if(body.length>1024)return res.status(400).json({error:'invalid_restore_request'});try{body=JSON.parse(body);}catch{return res.status(400).json({error:'invalid_restore_request'});}}
  if(!body||Array.isArray(body)||Object.keys(body).length!==1||typeof body.id!=='string'||!UUID.test(body.id))return res.status(400).json({error:'invalid_restore_request'});
  if(!Object.hasOwn(body,'id'))return res.status(400).json({error:'invalid_restore_request'});
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.rpc('restore_vault_note',{p_id:body.id,p_owner:user.userId});
  if(error)return res.status(409).json({error:'restore_not_verified'});
  if(data?.restored!==true||data.id?.toLowerCase()!==body.id.toLowerCase()||!/^[a-f0-9]{64}$/.test(data.contentHash??''))return res.status(502).json({error:'restore_verification_failed'});
  return res.status(200).json(data);
 }catch{return res.status(503).json({error:'restore_unavailable'});}
}
