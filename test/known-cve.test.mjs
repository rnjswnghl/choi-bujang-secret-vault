import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {decide} from '../xdr/known-cve/decide.mjs';
import {readAlerts,extract} from '../xdr/known-cve/read-alerts.mjs';
import {makeRule,createGuard} from '../xdr/known-cve/respond.mjs';
const fixture=JSON.parse(await readFile(new URL('../xdr/fixtures/known-cve.json',import.meta.url),'utf8'));
test('24 alerts: clear block, ambiguous alert, normal record; no mutation',()=>{
 const before=JSON.stringify(fixture);
 const expected=fixture.alerts.map((a,i)=>i<8?'block':i<16?'alert':'record');
 assert.deepEqual(fixture.alerts.map(a=>decide(a).action),expected);
 assert.equal(JSON.stringify(fixture),before);
 for(const a of fixture.alerts){const d=decide(a);assert.deepEqual(Object.keys(d).sort(),['action','confidence','reason']);assert.ok(d.confidence>=0&&d.confidence<=1);}
});
test('single-file data URL import and matching pattern constants',async()=>{
 const code=await readFile(new URL('../xdr/known-cve/decide.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(code,/\bimport\b|\bfetch\s*\(|\bprocess\b|\breadFile\b|\bwriteFile\b/);
 const standalone=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const patterns=JSON.parse(await readFile(new URL('../xdr/known-cve/patterns.json',import.meta.url),'utf8'));
 assert.deepEqual(JSON.parse(code.slice(code.indexOf('['),code.indexOf(';'))),patterns);
 for(const a of fixture.alerts)assert.deepEqual(standalone.decide(a),decide(a));
 for(const a of [null,{}, {data:{url:'CVE-2021-44228'}},{rule:{level:15,mitre:['T1190']},data:{url:'/health'}}])assert.equal(decide(a).action,'record');
});
test('allowlisted reader returns one row per alert and suppresses credentials',async()=>{
 assert.equal((await readAlerts()).length,24);
 for(const secret of ['token=fixture-value','Authorization: Bearer fixture-value','api_key=fixture-value']){
 const row=extract({rule:{description:secret},data:{srcuser:'private@example.com'}});
 assert.equal(row.description,'[redacted]');assert.equal(row.account,'[redacted]');
 assert.deepEqual(Object.keys(row).sort(),['account','description','level','sourceIp','timestamp']);
 }
});
test('only clear attacks create TTL rules; normal allowed; expired/future excluded',async()=>{
 for(const a of fixture.alerts){
  const at=Date.parse(a.timestamp),d=decide(a),r=makeRule(a,d,at);
  assert.equal(Boolean(r),d.action==='block');
  assert.equal(makeRule(a,d,at+15*60000),null);
  assert.equal(makeRule(a,d,at-60000),null);
  const guard=createGuard(async()=>({decision:'allow'}),async()=>r?[r]:[]);
  assert.equal((await guard({requestId:'fixture'},{sourceIp:a.data.srcip,now:at})).decision,d.action==='block'?'deny':'allow');
  assert.equal((await guard({requestId:'fixture'},{sourceIp:a.data.srcip,now:at+15*60000})).decision,'allow');
 }
});
