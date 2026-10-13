import test from 'node:test';
import assert from 'node:assert/strict';
import {decide} from '../src/decider.mjs';
import {fixtureRequests} from '../scripts/fixture-7.mjs';
test('normal, composite, reverified and device priority', async()=>{
  const {normal,suspicious}=fixtureRequests();
  assert.equal((await decide(normal)).decision,'allow');
  assert.equal((await decide(suspicious)).decision,'step_up');
  assert.equal((await decide({...suspicious,stepUp:{verified:true,authAgeSeconds:60}})).decision,'allow');
  assert.equal((await decide({...suspicious,deviceRegistered:false})).reasonCode,'device_not_registered');
  for(const authAgeSeconds of [undefined,-1,901,'60']) assert.equal((await decide({...suspicious,stepUp:{verified:true,authAgeSeconds}})).decision,'step_up');
});
test('region alone, unavailable real location, forged header and missing source',async()=>{
  const {normal}=fixtureRequests();
  assert.equal((await decide({...normal,signals:{...normal.signals,region:'foreign'}})).decision,'allow');
  assert.equal((await decide({...normal,signals:{source:'none',region:'unknown',network:'unknown',hour:null}})).decision,'allow');
  for(const signals of [undefined,{...normal.signals,source:'client'},{source:'judge_fixture',region:'local'}]) {
    assert.equal((await decide({...normal,signals,headers:{'x-region':'local'}})).decision,'step_up');
  }
  assert.equal((await decide({...normal,recentEvents:undefined})).decision,'step_up');
});
