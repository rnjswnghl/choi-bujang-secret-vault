import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {decide} from '../xdr/exfiltration/decide.mjs';
import {readAlerts,extract} from '../xdr/exfiltration/read-alerts.mjs';
import {makeRule,createGuard} from '../xdr/exfiltration/respond.mjs';
const fixture=JSON.parse(await readFile(new URL('../xdr/fixtures/exfiltration.json',import.meta.url),'utf8'));
test('30 immutable events: clear block, ambiguous alert, normal record',()=>{
 const before=JSON.stringify(fixture);
 assert.deepEqual(fixture.alerts.map(a=>decide(a).action),fixture.alerts.map((a,i)=>i<10?'block':i<20?'alert':'record'));
 assert.equal(JSON.stringify(fixture),before);
 for(const a of fixture.alerts){const d=decide(a);assert.deepEqual(Object.keys(d).sort(),['action','confidence','reason']);assert.ok(d.confidence>=0&&d.confidence<=1);}
});
test('offline single-file entry and pattern parity; malformed counts and missing destination do not block',async()=>{
 const code=await readFile(new URL('../xdr/exfiltration/decide.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(code,/\bimport\b|\bfetch\s*\(|\bprocess\b|\breadFile\b|\bwriteFile\b/);
 const standalone=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const patterns=JSON.parse(await readFile(new URL('../xdr/exfiltration/patterns.json',import.meta.url),'utf8'));
 assert.deepEqual(JSON.parse(code.slice(code.indexOf('['),code.indexOf(';\n//'))),patterns);
 for(const a of fixture.alerts)assert.deepEqual(standalone.decide(a),decide(a));
 for(const size of [null,undefined,NaN,Infinity,-1,'','1e9','not-a-number',{},'49999999']){
 const a={...fixture.alerts[0],data:{...fixture.alerts[0].data,bytes:size}};assert.notEqual(decide(a).action,'block');
 }
 assert.notEqual(decide({...fixture.alerts[0],data:{bytes:'500000000',files:'200'}}).action,'block');
 assert.equal(decide(null).action,'record');
 const a={...fixture.alerts[0],data:{...fixture.alerts[0].data,bytes:'50000000'}};assert.equal(decide(a).action,'block');
});
test('reader returns 30 allowlisted rows with credentials suppressed',async()=>{
 assert.equal((await readAlerts()).length,30);
 const row=extract({rule:{description:'Authorization: Bearer fixture-value'},data:{srcuser:'private@example.com',bytes:'900000000'}});
 assert.equal(row.description,'[redacted]');assert.equal(row.account,'[redacted]');
 assert.deepEqual(Object.keys(row).sort(),['account','description','level','sourceIp','timestamp']);
});
test('destination + PC guard excludes unrelated traffic, expired/future evidence and forged decisions',async()=>{
 for(const a of fixture.alerts){
  const at=Date.parse(a.timestamp),d=decide(a),r=makeRule(a,d,at);
  assert.equal(Boolean(r),d.action==='block');
  assert.equal(makeRule(a,d,at+15*60000),null);assert.equal(makeRule(a,d,at-1),null);
  const guard=createGuard(async()=>({decision:'allow'}),async()=>r?[r]:[]);
  const context={destinationIp:a.data.dstip,agentName:a.agent.name,now:at};
  assert.equal((await guard({requestId:'fixture'},context)).decision,d.action==='block'?'deny':'allow');
  assert.equal((await guard({requestId:'fixture'},{...context,destinationIp:'192.0.2.200'})).decision,'allow');
  assert.equal((await guard({requestId:'fixture'},{...context,agentName:'other-pc'})).decision,'allow');
  assert.equal((await guard({...context,requestId:'fixture'},{now:at})).decision,'allow');
  assert.equal((await guard({requestId:'fixture'},{...context,now:at+15*60000})).decision,'allow');
 }
 const normal=fixture.alerts[20];assert.equal(makeRule(normal,{action:'block',confidence:1,reason:'large_unfamiliar_destination'},Date.parse(normal.timestamp)),null);
});
test('destination wrapper preserves account/IP denials and baseline step_up',async()=>{
 const {createGuard:accountGuard}=await import('../xdr/privilege/respond.mjs');
 const {createGuard:ipGuard}=await import('../xdr/brute-force/connect.mjs');
 const at=Date.parse(fixture.alerts[0].timestamp),startsAt=new Date(at).toISOString(),expiresAt=new Date(at+60000).toISOString();
 const ip=ipGuard(async()=>({decision:'step_up'}),async()=>[{id:'existing-ip',sourceIp:'192.0.2.100',startsAt,expiresAt}]);
 const account=accountGuard(ip,async()=>[{id:'existing-account',account:'user99',agentName:'choi-bujang-pc',startsAt,expiresAt}]);
 const guard=createGuard(account,async()=>[]);
 assert.equal((await guard({requestId:'fixture'},{sourceIp:'192.0.2.100',now:at})).decision,'deny');
 assert.equal((await guard({requestId:'fixture'},{account:'user99',agentName:'choi-bujang-pc',now:at})).decision,'deny');
 assert.equal((await guard({requestId:'fixture'},{now:at})).decision,'step_up');
});
