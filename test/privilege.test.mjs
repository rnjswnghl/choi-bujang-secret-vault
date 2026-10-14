import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {decide} from '../xdr/privilege/decide.mjs';
import {readAlerts,extract} from '../xdr/privilege/read-alerts.mjs';
import {makeRule,createGuard} from '../xdr/privilege/respond.mjs';
const fixture=JSON.parse(await readFile(new URL('../xdr/fixtures/privilege.json',import.meta.url),'utf8'));
test('26 alerts: nine clear blocks, eight ambiguous alerts, nine normal records; immutable',()=>{
 const before=JSON.stringify(fixture);
 assert.deepEqual(fixture.alerts.map(a=>decide(a).action),fixture.alerts.map((a,i)=>i<9?'block':i<17?'alert':'record'));
 assert.equal(JSON.stringify(fixture),before);
 for(const a of fixture.alerts){const d=decide(a);assert.deepEqual(Object.keys(d).sort(),['action','confidence','reason']);assert.ok(d.confidence>=0&&d.confidence<=1);}
});
test('standalone entry and pattern parity; severity alone, failed and normal changes never block',async()=>{
 const code=await readFile(new URL('../xdr/privilege/decide.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(code,/\bimport\b|\bfetch\s*\(|\bprocess\b|\breadFile\b|\bwriteFile\b/);
 const standalone=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const patterns=JSON.parse(await readFile(new URL('../xdr/privilege/patterns.json',import.meta.url),'utf8'));
 assert.deepEqual(JSON.parse(code.slice(code.indexOf('['),code.indexOf(';\n//'))),patterns);
 for(const a of fixture.alerts)assert.deepEqual(standalone.decide(a),decide(a));
 for(const a of [null,{}, {rule:{level:15,mitre:['T1068'],description:'평소 주소에서 관리자 명령이 한 번 실행됐습니다.'}}, {...fixture.alerts[0],rule:{...fixture.alerts[0].rule,description:'관리자 그룹 추가를 취소했습니다.'}}, {...fixture.alerts[0],data:{group:'project-week3'}}])assert.notEqual(decide(a).action,'block');
});
test('reader returns 26 allowlisted rows, preserving only fictional account names',async()=>{
 assert.equal((await readAlerts()).length,26);
 assert.equal(extract(fixture.alerts[20]).account,'admin01');
 for(const secret of ['token=fixture-value','Authorization: Bearer fixture-value','api_key=fixture-value']){
 const row=extract({rule:{description:secret},data:{srcuser:'private@example.com'}});
 assert.equal(row.description,'[redacted]');assert.equal(row.account,'[redacted]');
 assert.deepEqual(Object.keys(row).sort(),['account','description','level','sourceIp','timestamp']);
 }
});
test('account + endpoint guard isolates only target, expires, ignores browser claims and spoof decisions',async()=>{
 for(const a of fixture.alerts){
  const at=Date.parse(a.timestamp),d=decide(a),r=makeRule(a,d,at);
  assert.equal(Boolean(r),d.action==='block');
  assert.equal(makeRule(a,d,at+15*60000),null);assert.equal(makeRule(a,d,at-1),null);
  const base=async()=>({decision:'allow'}),guard=createGuard(base,async()=>r?[r]:[]);
  const context={account:a.data.srcuser,agentName:a.agent.name,now:at};
  assert.equal((await guard({requestId:'fixture'},context)).decision,d.action==='block'?'deny':'allow');
  assert.equal((await guard({requestId:'fixture'},{...context,account:'other-user'})).decision,'allow');
  assert.equal((await guard({requestId:'fixture'},{...context,agentName:'other-pc'})).decision,'allow');
  assert.equal((await guard({...context,requestId:'fixture'},{now:at})).decision,'allow');
  assert.equal((await guard({requestId:'fixture'},{...context,now:at+15*60000})).decision,'allow');
 }
 const a=fixture.alerts[17];assert.equal(makeRule(a,{action:'block',confidence:1,reason:'abnormal_admin_group'},Date.parse(a.timestamp)),null);
});
test('privilege wrapper preserves existing IP checks and base denial',async()=>{
 const {createGuard:ipGuard}=await import('../xdr/brute-force/connect.mjs');
 const a=fixture.alerts[0],at=Date.parse(a.timestamp),rule=makeRule(a,decide(a),at);
 const base=async()=>({decision:'step_up'});
 const ip=ipGuard(base,async()=>[{id:'existing-ip',sourceIp:a.data.srcip,startsAt:new Date(at).toISOString(),expiresAt:new Date(at+60000).toISOString()}]);
 const guard=createGuard(ip,async()=>[rule]);
 assert.equal((await guard({requestId:'fixture'},{sourceIp:a.data.srcip,now:at,account:'other-user',agentName:a.agent.name})).decision,'deny');
 assert.equal((await guard({requestId:'fixture'},{sourceIp:'192.0.2.200',now:at,account:'other-user',agentName:a.agent.name})).decision,'step_up');
});
