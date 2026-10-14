import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
const source=await readFile(new URL('../src/attack-check.mjs',import.meta.url),'utf8');
const config={step:12,publicAppUrl:'https://fixture.invalid',originalApiUrl:'https://fixture.invalid/original',restoreRoute:'/api/restore'};
function response(url){
 const path=new URL(url).pathname;let data={text:'한글🙂'},status=200;
 if(path.startsWith('/api/')||path==='/original'){data={error:'login_required'};status=401;}
 if(path==='/data.json')data={notes:[]};
 if(path==='/aleph.json')data={step:12,allowedRoutes:['GET /api/notes/:id']};
 if(path==='/manifest.webmanifest')data={display:'standalone',icons:[{},{}]};
 return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','x-request-id':'fixture-request-id','x-content-type-options':'nosniff'}});
}
test('one-argument entry imports only the officially allowed node:crypto module',async()=>{
 assert.match(source,/export async function runAttackChecks\(config\)/);
 assert.deepEqual([...source.matchAll(/from ['"]([^'"]+)['"]/g)].map(m=>m[1]),['node:crypto']);
 assert.doesNotMatch(source,/\bprocess\.|\bexecFile|\brunRecoveryRetest\b|x-aleph-attack-id|x-attack-id/);
 const bundle=await readFile(new URL('../scripts/bundle.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(bundle,/recovery-retest|runRecoveryRetest/);
});
test('data URL and restricted VM report metadata matching independently captured HTTP responses',async()=>{
 const original=globalThis.fetch;
 try{
  const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  const sandboxed=runInNewContext(source.replace(/^import .*;\n/,'').replace('export async function','async function')+';runAttackChecks',{createHash,fetch:(...a)=>globalThis.fetch(...a),URL,AbortSignal,Date});
  for(const entry of [module.runAttackChecks,sandboxed]){
   const records=[];
   globalThis.fetch=async(url,init)=>{
    const r=response(url);records.push({caseId:init.alephEvidence?.caseId,requestKey:init.alephEvidence?.requestKey,method:init.method,hash:createHash('sha256').update(new URL(url).href).digest('hex'),status:r.status,bytes:(await r.clone().arrayBuffer()).byteLength});return r;
   };
   const report=await entry(config);assert.ok(report.length<=20);
   for(const row of report){
    assert.equal(Object.keys(row).sort().join(','),'attackId,expected,observed');
    if(row.observed==='not_run')continue;
    const match=row.observed.match(/^HTTP (\d{3}); method=(GET|HEAD); urlSha256=([a-f0-9]{64}); bodyBytes=(\d+)$/);
    assert.ok(match,row.attackId);
    assert.ok(records.some(r=>r.caseId===row.attackId&&r.requestKey==='read'&&r.status===Number(match[1])&&r.method===match[2]&&r.hash===match[3]&&r.bytes===Number(match[4])),row.attackId);
   }
  }
 }finally{globalThis.fetch=original;}
});
test('unexpected status is preserved; failure has no fabricated measurement',async()=>{
 const original=globalThis.fetch;
 try{
  const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  globalThis.fetch=async()=>new Response('unexpected',{status:200});
  let report=await module.runAttackChecks(config);assert.match(report.find(r=>r.attackId==='anonymous_list').observed,/^HTTP 200;/);
  globalThis.fetch=async()=>{throw new Error('offline');};
  report=await module.runAttackChecks(config);assert.ok(report.every(r=>r.observed==='not_run'));
 }finally{globalThis.fetch=original;}
});
test('all stages use read-only requests; official alephEvidence identifiers and no invented correlation headers',async()=>{
 const original=globalThis.fetch;
 try{
  const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  for(let step=1;step<=12;step++){
   const blocked=[];
   globalThis.fetch=async(url,init)=>{
    if(!['GET','HEAD'].includes(init.method)||init.body!==undefined)blocked.push(String(url));
    assert.equal(init.attackId,undefined);assert.deepEqual(Object.keys(init.alephEvidence).sort(),['caseId','requestKey']);assert.equal(init.alephEvidence.requestKey,'read');assert.ok(!Object.keys(init.headers).some(k=>k.includes('attack-id')));
    return response(url);
   };
   const report=await module.runAttackChecks({...config,step});assert.deepEqual(blocked,[]);
   for(const id of ['account_a_crud','cross_owner_crud',...(step>=10?['anonymous_restore','post_restore_retest']:[]),...(step>=12?['campaign_41']:[])])assert.equal(report.find(r=>r.attackId===id).observed,'not_run');
  }
 }finally{globalThis.fetch=original;}
});

test('official caseId record linkage detects absent, mistyped and wrong requestKey evidence',async()=>{
 const original=globalThis.fetch;const records=[];
 const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 try{
  globalThis.fetch=async(url,init)=>{records.push(structuredClone(init.alephEvidence));return response(url);};
  const report=await module.runAttackChecks(config);
  const measured=report.filter(r=>r.observed!=='not_run');
  assert.equal(records.length,measured.length);
  const matches=evidence=>measured.filter(row=>evidence.some(r=>r?.caseId===row.attackId&&r.requestKey==='read')).length;
  assert.equal(matches(records),measured.length);
  assert.equal(matches(records.map(()=>undefined)),0);
  assert.equal(matches(records.map(r=>({...r,caseId:'wrong'}))),0);
  assert.equal(matches(records.map(r=>({...r,requestKey:'wrong'}))),0);
  const skipped=report.filter(r=>r.observed==='not_run');
  assert.ok(skipped.every(row=>!records.some(r=>r.caseId===row.attackId)));
 }finally{globalThis.fetch=original;}
});

test('observed entire string contains only judge-supported facts, with no extra text or fields',async()=>{
 const original=globalThis.fetch;
 try{
  const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
  globalThis.fetch=async(url)=>response(url);
  const allowed=/^HTTP [1-5]\d{2}; method=(GET|HEAD); urlSha256=[a-f0-9]{64}; bodyBytes=\d+$/;
  for(let step=1;step<=12;step++){
   const rows=await module.runAttackChecks({...config,step});
   for(const row of rows){
    if(row.observed==='not_run')continue;
    assert.match(row.observed,allowed,row.attackId);
    for(const extra of ['requestId=fixture','checkedAt=2026','notesCount=0','step=12','nosniff=true','standalone=true','keyPatternsFound=0','통과']){
     assert.equal(allowed.test(row.observed+'; '+extra),false,extra);
    }
   }
  }
 }finally{globalThis.fetch=original;}
});
