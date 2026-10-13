import test from 'node:test';
import assert from 'node:assert/strict';
import {fixtureRequests} from '../scripts/fixture-7.mjs';
import {decide} from '../src/decider.mjs';
import {resourceAllowed} from '../src/decider.mjs';
test('own fixture read/update; other subject/device/list/function denied',async()=>{
 const {normal}=fixtureRequests();
 assert.equal((await decide(normal)).decision,'allow');
 assert.equal((await decide({...normal,method:'PUT',route:'PUT /notes/:id'})).decision,'allow');
 for(const change of [{subjectId:'other'},{deviceId:'bbbbbbbbbbbbbbbb'},{path:'/notes/export'},{path:'/notes',route:'GET /notes'},{queryLength:1}]) assert.equal((await decide({...normal,...change})).decision,'deny');
});
test('notice writes require trusted instructor binding, never body role',()=>{
 const {normal}=fixtureRequests();
 const request={...normal,service:'notices',path:'/notices/demo',method:'PUT',route:'PUT /notices/:id',role:'instructor'};
 const binding={classId:normal.classId,projectId:normal.projectId,subjectId:normal.subjectId,deviceId:normal.deviceId,service:'notices',path:'/notices/demo',resourceId:'notices:demo',permissions:['PUT']};
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
 for(const change of cases){const response=await isolated.decide({...normal,...change});assert.equal(response.decision,'deny');assert.equal(response.reasonCode,'resource_not_allowed');assert.equal(response.requestId,normal.requestId);}
});

test('submitted default allows known own resource and denies other class, project, owner',async()=>{
 const {normal}=fixtureRequests();
 const old=process.env.ALEPH_RESOURCE_BINDINGS;
 try{
  delete process.env.ALEPH_RESOURCE_BINDINGS;
  assert.equal((await decide(normal)).decision,'allow');
  for(const change of [{classId:'other-class'},{projectId:'other-project'},{subjectId:'other-owner'}]){
   assert.equal((await decide({...normal,...change})).decision,'deny');
  }
  process.env.ALEPH_RESOURCE_BINDINGS='[]';
  assert.equal((await decide(normal)).decision,'deny');
 }finally{if(old===undefined)delete process.env.ALEPH_RESOURCE_BINDINGS;else process.env.ALEPH_RESOURCE_BINDINGS=old;}
});

test('exact resource identity and missing verified identity are rejected',async()=>{
 const {normal}=fixtureRequests();
 const row={classId:normal.classId,projectId:normal.projectId,subjectId:normal.subjectId,ownerSubjectId:normal.subjectId,deviceId:normal.deviceId,service:'notes',path:normal.path,resourceId:'notes:demo',permissions:['GET','PUT']};
 assert.equal(resourceAllowed(normal,[row]),true);
 assert.equal(resourceAllowed(normal,[{...row,resourceId:'notes:other'}]),false);
 for(const key of ['classId','projectId','subjectId','deviceId']) assert.equal(resourceAllowed({...normal,[key]:undefined},[row]),false);
});
