import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../src/attack-check.mjs',import.meta.url),'utf8');
// A data URL deliberately has no repository-relative module resolution.
const isolated=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const config={step:12,publicAppUrl:'https://fixture.invalid',originalApiUrl:'https://fixture.invalid/original',restoreRoute:'/api/restore'};
function response(url){
 const path=new URL(url).pathname;
 let data={},status=200;
 if(path.startsWith('/api/')||path==='/original'){data={error:'login_required'};status=401;}
 if(path==='/data.json')data={notes:[]};
 if(path==='/aleph.json')data={step:12,allowedRoutes:['GET /api/notes/:id']};
 if(path==='/manifest.webmanifest')data={display:'standalone',icons:[{},{}]};
 return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','x-request-id':'fixture-request-id','x-content-type-options':'nosniff'}});
}
test('isolated runner imports and reports HTTP measurements without local dependencies',async()=>{
 const original=globalThis.fetch;const calls=[];
 try{
  globalThis.fetch=async(url)=>{calls.push(String(url));return response(url);};
  const report=await isolated.runAttackChecks(config);
  assert.ok(report.length<=20);
  assert.ok(report.every(r=>Object.keys(r).sort().join(',')==='attackId,expected,observed'));
  assert.match(report.find(r=>r.attackId==='anonymous_list').observed,/HTTP 401.*인증 거부 true.*fixture-request-id.*시각/);
  assert.match(report.find(r=>r.attackId==='post_restore_retest').observed,/미실행/);
  assert.match(report.find(r=>r.attackId==='campaign_41').observed,/미실행/);
  assert.ok(!report.some(r=>r.attackId==='post_restore_normal'));
  assert.ok(calls.some(url=>url.endsWith('/api/operations')));
 }finally{globalThis.fetch=original;}
});
test('local bundle injection executes recovery checks and keeps simulation scope',async()=>{
 const original=globalThis.fetch;let executed=0;
 try{
  globalThis.fetch=async(url)=>response(url);
  const report=await isolated.runAttackChecks(config,{runRecoveryRetest:async()=>{
   executed++;return {checks:[{name:'normal',expected:'allow',observed:'allow',passed:true},{name:'unregistered',expected:'deny',observed:'deny',passed:true}],results:[{execution:'executed',passed:true,tests:1}]};
  }});
  assert.equal(executed,1);
  assert.match(report.find(r=>r.attackId==='post_restore_normal').observed,/local_simulation/);
 }finally{globalThis.fetch=original;}
});
test('HTTP 200 on a forbidden endpoint is reported as failed rather than replaced with expected denial',async()=>{
 const original=globalThis.fetch;
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify({error:'fixture'}),{status:200,headers:{'content-type':'application/json'}});
  const report=await isolated.runAttackChecks(config);
  assert.match(report.find(r=>r.attackId==='anonymous_list').observed,/HTTP 200.*인증 거부 false/);
  assert.match(report.find(r=>r.attackId==='operations_anonymous').observed,/HTTP 200.*거부 false/);
 }finally{globalThis.fetch=original;}
});
