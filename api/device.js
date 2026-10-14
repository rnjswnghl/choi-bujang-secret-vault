import {createPublicKey} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createLoginVerifier} from '../src/verify-login.mjs';
import {deviceId} from '../src/app-device.mjs';
import config from '../aleph.config.json' with {type:'json'};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method))return res.status(405).json({error:'method_not_allowed'});
 try{
 const key=process.env.SUPABASE_SECRET_KEY,url=process.env.SUPABASE_URL;
 if(!key||url!==new URL(config.identityProvider.issuer).origin)return res.status(503).json({error:'device_service_unavailable'});
 const user=await createLoginVerifier({config,supabaseSecretKey:key})(req.headers?.authorization);
 if(!user)return res.status(401).json({error:'login_required'});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 let id=req.query?.id;
 if(req.method==='POST'){
 const jwk=req.body?.publicKey;
 if(Object.keys(req.body??{}).some(k=>k!=='publicKey')||!jwk||jwk.kty!=='EC'||jwk.crv!=='P-256'||jwk.d||Object.keys(jwk).some(k=>!['kty','crv','x','y','ext','key_ops'].includes(k))||!/^[-_A-Za-z0-9]{43}$/.test(jwk.x??'')||!/^[-_A-Za-z0-9]{43}$/.test(jwk.y??''))return res.status(400).json({error:'invalid_public_key'});
 const publicKey={kty:jwk.kty,crv:jwk.crv,x:jwk.x,y:jwk.y};
 try{createPublicKey({key:publicKey,format:'jwk'});}catch{return res.status(400).json({error:'invalid_public_key'});}
 id=deviceId(publicKey);
 const {error}=await db.from('vault_app_devices').upsert({id,owner_id:user.userId,public_key:publicKey,status:'pending'},{onConflict:'id',ignoreDuplicates:true});
 if(error)return res.status(503).json({error:'device_service_unavailable'});
 }
 if(!/^[a-f0-9]{64}$/.test(id??''))return res.status(400).json({error:'invalid_device'});
 const {data,error}=await db.from('vault_app_devices').select('status').eq('id',id).eq('owner_id',user.userId).maybeSingle();
 return error?res.status(503).json({error:'device_service_unavailable'}):res.status(200).json({id,status:data?.status??'unregistered'});
 }catch{return res.status(503).json({error:'device_service_unavailable'});}
}
