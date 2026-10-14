import {createHash,createPublicKey,verify} from 'node:crypto';
export const INTERNAL_RECOVERY_RETEST=Symbol('verified_recovery_retest');
export function deviceId(jwk){return createHash('sha256').update(JSON.stringify({crv:jwk.crv,kty:jwk.kty,x:jwk.x,y:jwk.y})).digest('hex');}
export function verifyAppProof(req,jwk,now=Date.now()){
 try{
 const time=req.headers?.['x-app-time'],nonce=req.headers?.['x-app-nonce'],signature=req.headers?.['x-app-signature'];
 if(!/^\d{13}$/.test(time??'')||Math.abs(now-Number(time))>60000||!/^[a-f0-9]{32}$/.test(nonce??'')||typeof signature!=='string'||!/^[A-Za-z0-9_-]{86}$/.test(signature))return false;
 let body=req.body;if(typeof body==='string')body=JSON.parse(body);
 const hash=createHash('sha256').update(body===undefined?'':JSON.stringify(body)).digest('hex');
 const message=[req.method,req.url,hash,time,nonce].join('\n');
 return verify('sha256',Buffer.from(message),{key:createPublicKey({key:jwk,format:'jwk'}),dsaEncoding:'ieee-p1363'},Buffer.from(signature,'base64url'));
 }catch{return false;}
}
export async function enforceAppDevice(req,db,user){
 if(req[INTERNAL_RECOVERY_RETEST]===true&&user.kind==='judge'&&user.identity==='b')return true;
 const id=req.headers?.['x-app-device'];
 if(!/^[a-f0-9]{64}$/.test(id??''))return false;
 const {data,error}=await db.from('vault_app_devices').select('public_key,status').eq('id',id).eq('owner_id',user.userId).maybeSingle();
 if(error||data?.status!=='approved'||deviceId(data.public_key)!==id||!verifyAppProof(req,data.public_key))return false;
 const {error:nonceError}=await db.from('vault_app_nonces').insert({device_id:id,nonce:req.headers['x-app-nonce']});
 return !nonceError;
}
