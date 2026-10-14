import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import {createLoginVerifier} from '../src/verify-login.mjs';
import {enforceAppDevice} from '../src/app-device.mjs';
import {readOperations} from '../src/operations.mjs';
import config from '../aleph.config.json' with {type:'json'};
export default async function handler(req,res){
 const requestId=randomUUID();
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Request-Id',requestId);
 if(req.method!=='GET')return res.status(405).json({error:'method_not_allowed',requestId});
 if(!req.headers?.authorization)return res.status(401).json({error:'login_required',requestId});
 try{
 const key=process.env.SUPABASE_SECRET_KEY,url=process.env.SUPABASE_URL;
 if(!key||url!==new URL(config.identityProvider.issuer).origin)return res.status(503).json({error:'service_unavailable',requestId});
 const user=await createLoginVerifier({config,supabaseSecretKey:key})(req.headers.authorization);
 if(!user)return res.status(401).json({error:'login_required',requestId});
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 if(!await enforceAppDevice(req,db,user))return res.status(403).json({error:'app_device_not_verified',requestId});
 return res.status(200).json(await readOperations(db,user,requestId));
 }catch{return res.status(503).json({error:'service_unavailable',requestId});}
}
