import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtureRequests} from '../scripts/fixture-7.mjs';
import {decide, RULE_IDS} from '../src/decider.mjs';

test('contract-only resource matrix; API, not decider, checks note ownership', async () => {
 const {normal}=fixtureRequests();
 const cases=[];
 for(const id of ['demo','note-A','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'])
  for(const method of ['GET','PUT','DELETE']) cases.push([{path:`/notes/${id}`,method,route:`${method} /notes/:id`},'allow']);
 cases.push([{subjectId:'another-verified-user',deviceId:'bbbbbbbbbbbbbbbb'},'allow']);
 for(const method of ['POST','PUT','PATCH','DELETE'])
  cases.push([{service:'notices',path:'/notices/notice-A',method,route:`${method} /notices/:id`},'deny']);
 cases.push([{service:'notices',path:'/notices/notice-A',route:'GET /notices/:id'},'allow']);
 for(const change of [
  {path:'/notes',route:'GET /notes'}, {path:'/notes/',route:'GET /notes'},
  {path:'/notes/export'}, {path:'/notes/demo/extra'}, {path:'/notes/..'},
  {path:'/notes/%2f'}, {path:'/notes/demo?mode=export'}, {queryLength:1},
  {service:'instructor',path:'/instructor/demo',route:'GET /instructor/:id'},
  {service:'instructor-materials',path:'/instructor-materials/demo'},
  {service:'notes',path:'/notices/demo'}, {route:'GET /notes'},
  {method:'POST',route:'POST /notes/:id'}, {method:'PATCH',route:'PATCH /notes/:id'}
 ]) cases.push([change,'deny']);
 for(const [change,expected] of cases){
  const response=await decide({...normal,...change});
  assert.equal(response.decision,expected,JSON.stringify(change));
  assert.deepEqual(Object.keys(response).sort(),['schema','requestId','decision','reasonCode','ruleIds'].sort());
  assert.equal(response.requestId,normal.requestId);
  assert.ok(response.ruleIds.every(id=>RULE_IDS.includes(id)));
 }
});
test('forbidden resources stay denied even after additional authentication',async()=>{
 const {suspicious}=fixtureRequests();
 for(const method of ['POST','PUT','PATCH','DELETE'])
  assert.equal((await decide({...suspicious,service:'notices',path:'/notices/demo',method,route:`${method} /notices/:id`,stepUp:{verified:true,authAgeSeconds:0}})).decision,'deny');
});
test('standalone decider needs no ownership registry or undeclared identity fields',async()=>{
 const {readFile}=await import('node:fs/promises');
 const code=await readFile(new URL('../src/decider.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(code,/request\.(role|identity|device|geo)\b|ALEPH_RESOURCE_BINDINGS/);
 const isolated=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const {normal}=fixtureRequests();
 assert.equal((await isolated.decide({...normal,path:'/notes/virtual-ID'})).decision,'allow');
});
