import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign,createHash} from 'node:crypto';
import {verifyAppProof,deviceId,enforceAppDevice} from '../src/app-device.mjs';
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk=publicKey.export({format:'jwk'});
function request(){
 const req={method:'PUT',url:'/api/notes/fixture',body:{title:'synthetic',body:'synthetic'},headers:{'x-app-time':String(Date.now()),'x-app-nonce':'a'.repeat(32),'x-app-device':deviceId(jwk)}};
 const hash=createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
 req.headers['x-app-signature']=sign('sha256',Buffer.from([req.method,req.url,hash,req.headers['x-app-time'],req.headers['x-app-nonce']].join('\n')),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');return req;
}
test('signature binds method, path, body, timestamp and nonce',()=>{
 const req=request();assert.equal(verifyAppProof(req,jwk),true);
 assert.equal(verifyAppProof({...req,url:'/api/notes/other'},jwk),false);
 assert.equal(verifyAppProof({...req,method:'DELETE'},jwk),false);
 assert.equal(verifyAppProof({...req,body:{title:'changed',body:'synthetic'}},jwk),false);
 assert.equal(verifyAppProof({...req,headers:{}},jwk),false);
 assert.equal(verifyAppProof(req,jwk,Date.now()+61000),false);
});
test('pending/revoked device and replay fail; approved signed device succeeds',async()=>{
 for(const status of ['pending','revoked','approved']){
  let used=false;
  const db={from(){const q={select(){return q;},eq(){return q;},maybeSingle:async()=>({data:{status,public_key:jwk},error:null}),insert:async()=>{const error=used?{}:null;used=true;return {error};}};return q;}};
  assert.equal(await enforceAppDevice(request(),db,{userId:'fixture'}),status==='approved');
  assert.equal(await enforceAppDevice(request(),db,{userId:'fixture'}),false);
 }
});
test('real notes entry refuses unsigned authenticated traffic before reading notes',async()=>{
 const {readFile}=await import('node:fs/promises');
 const source=(await readFile(new URL('../api/notes.js',import.meta.url),'utf8')).replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler');
 const build=new Function('enforceAppDevice','randomUUID','createClient','createLoginVerifier','config',source+'\nreturn handler;');
 let reads=0,status;
 const db={from(){reads++;throw new Error('unexpected_note_read');}};
 process.env.SUPABASE_SECRET_KEY='local-test-placeholder';process.env.SUPABASE_URL='https://hzovkgmggfqoumxwbejm.supabase.co';
 const handler=build(enforceAppDevice,()=>'',()=>db,()=>async()=>({kind:'student',userId:'fixture'}),{});
 await handler({method:'GET',url:'/api/notes',query:{},headers:{authorization:'Bearer test.placeholder.signature'}},{setHeader(){},status(s){status=s;return this;},json(){}});
 assert.equal(status,403);assert.equal(reads,0);
});
