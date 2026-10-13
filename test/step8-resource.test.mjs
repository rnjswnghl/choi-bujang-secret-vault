import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtureRequests} from '../scripts/fixture-7.mjs';
import {decide} from '../src/decider.mjs';
import {resourceAllowed} from '../src/resource-policy.mjs';
test('own fixture read/update; other subject/device/list/function denied',async()=>{
 const {normal}=fixtureRequests();
 assert.equal((await decide(normal)).decision,'allow');
 assert.equal((await decide({...normal,method:'PUT',route:'PUT /notes/:id'})).decision,'allow');
 for(const change of [{subjectId:'other'},{deviceId:'bbbbbbbbbbbbbbbb'},{path:'/notes/export'},{path:'/notes',route:'GET /notes'},{queryLength:1}]) assert.equal((await decide({...normal,...change})).decision,'deny');
});
test('notice writes require trusted instructor binding, never body role',()=>{
 const {normal}=fixtureRequests();
 const request={...normal,service:'notices',path:'/notices/demo',method:'PUT',route:'PUT /notices/:id',role:'instructor'};
 const binding={subjectId:normal.subjectId,deviceId:normal.deviceId,service:'notices',path:'/notices/demo',resourceId:'notices:demo',permissions:['PUT']};
 assert.equal(resourceAllowed(request,[binding]),false);
 assert.equal(resourceAllowed(request,[{...binding,instructor:true}]),true);
 assert.equal(resourceAllowed({...request,path:'/notices/export'},[{...binding,instructor:true}]),false);
});
