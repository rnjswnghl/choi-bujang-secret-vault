import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {decide,RULE_IDS} from '../src/decider.mjs';
import {fixtureRequests} from '../scripts/fixture-7.mjs';
test('bonus contract: step 12, only documented request fields, correct responses and registered rule IDs',async()=>{
 const config=JSON.parse(await readFile(new URL('../aleph.config.json',import.meta.url),'utf8'));assert.ok(config.step>=12);
 const allowed=new Set(['schema','requestId','classId','projectId','subjectId','deviceId','service','method','path','route','queryLength','querySha256','at','policyRevision','deviceRegistered','stepUp','recentEvents','signals']);
 const {normal,suspicious}=fixtureRequests();let total=0;
 for(const registered of [true,false,undefined,'true'])for(const service of ['notes','notices','instructor'])for(const method of ['GET','PUT','DELETE','POST','HEAD'])for(const path of [`/${service}/demo`,`/${service}`,`/${service}/all`])for(const base of [normal,suspicious]){
  const request={...base,service,method,path,route:`${method} /${service}/:id`,deviceRegistered:registered};
  const audited=new Proxy(request,{get(target,key){if(typeof key==='string')assert.ok(allowed.has(key),`undeclared field ${key}`);return target[key];}});
  const result=await decide(audited);total++;
  assert.deepEqual(Object.keys(result).sort(),['decision','reasonCode','requestId','ruleIds','schema']);
  assert.equal(result.requestId,request.requestId);assert.equal(result.schema,'aleph.decision.v1');assert.ok(['allow','deny','step_up'].includes(result.decision));
  assert.ok(result.ruleIds.length>0&&result.ruleIds.every(id=>RULE_IDS.includes(id)));
 }
 assert.equal(total,360);
});
