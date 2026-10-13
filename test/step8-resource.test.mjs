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

test('isolated judge execution denies every cross-zone request without imports',async()=>{
 const {readFile}=await import('node:fs/promises');
 const code=await readFile(new URL('../src/decider.mjs',import.meta.url),'utf8');
 const isolated=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const {normal}=fixtureRequests();
 assert.equal((await isolated.decide(normal)).decision,'allow');
 const cases=[{subjectId:'other-user'}, {path:'/notes/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'},
 {path:'/notes',route:'GET /notes'}, {service:'notices',path:'/notices/demo',method:'PUT',route:'PUT /notices/:id',role:'instructor'},
 {path:'/notes/export'}, {path:'/notes/demo/extra'}];
 for(const change of cases){const response=await isolated.decide({...normal,...change});assert.equal(response.decision,'deny');assert.equal(response.requestId,normal.requestId);}
});
