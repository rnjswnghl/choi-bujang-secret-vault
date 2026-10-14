import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
const source=await readFile(new URL('../src/attack-check.mjs',import.meta.url),'utf8');
const config={step:12,publicAppUrl:'https://fixture.invalid',originalApiUrl:'https://fixture.invalid/original',restoreRoute:'/api/restore'};
function response(url){
 const path=new URL(url).pathname;let data={},status=200;
 if(path.startsWith('/api/')||path==='/original'){data={error:'login_required'};status=401;}
 if(path==='/data.json')data={notes:[]};
 if(path==='/aleph.json')data={step:12,allowedRoutes:['GET /api/notes/:id']};
 if(path==='/manifest.webmanifest')data={display:'standalone',icons:[{},{}]};
 return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','x-request-id':'fixture-request-id','x-content-type-options':'nosniff'}});
}
test('original one-argument entry has no imports, process, filesystem or callbacks',async()=>{
 assert.match(source,/export async function runAttackChecks\(config\)/);
 assert.doesNotMatch(source,/\bimport\s*(?:\(|[{*'"\w])|\bprocess\.|\bexecFile|\brunRecoveryRetest\b/);
 const bundle=await readFile(new URL('../scripts/bundle.mjs',import.meta.url),'utf8');
 assert.match(bundle,/runAttackChecks\(config\)/);
 assert.doesNotMatch(bundle,/recovery-retest|runRecoveryRetest/);
});
test('data URL import and restricted VM both run without repository or Node dependencies',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async url=>response(url);
  const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const sandboxed=runInNewContext(source.replace('export async function','async function')+';runAttackChecks', {fetch:globalThis.fetch,URL,AbortSignal,Date});
  for(const entry of [module.runAttackChecks,sandboxed]){
   const report=await entry(config);assert.ok(report.length<=20);
   assert.ok(report.every(r=>Object.keys(r).sort().join(',')==='attackId,expected,observed'));
   assert.match(report.find(r=>r.attackId==='anonymous_list').observed,/HTTP 401.*인증 거부 true.*fixture-request-id.*시각/);
   for(const id of ['post_restore_retest','cross_owner_crud','campaign_41'])assert.match(report.find(r=>r.attackId===id).observed,/미실행/);
  }
 }finally{globalThis.fetch=original;}
});
test('unexpected allow, invalid JSON, absent IDs and network failure never become success',async()=>{
 const original=globalThis.fetch;
 try{
  const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  for(const [name,fake] of [
   ['unexpected_allow',async()=>new Response(JSON.stringify({error:'fixture'}),{status:200,headers:{'content-type':'application/json'}})],
   ['invalid_json',async()=>new Response('broken',{status:401,headers:{'content-type':'application/json'}})],
   ['network_failure',async()=>{throw new Error('offline');}]
  ]){
   globalThis.fetch=fake;const report=await module.runAttackChecks(config);
   const row=report.find(r=>r.attackId==='anonymous_list');
   if(name==='unexpected_allow'){assert.match(row.observed,/HTTP 200.*인증 거부 false.*미제공/);}
   else assert.match(row.observed,/미실행|실패/);
  }
 }finally{globalThis.fetch=original;}
});
