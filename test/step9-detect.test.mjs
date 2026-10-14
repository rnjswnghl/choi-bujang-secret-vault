import test from 'node:test';
import assert from 'node:assert/strict';
import {detect} from '../src/detect.mjs';
const start=Date.UTC(2026,9,1);
const reads=(count,step=1000,subject='learner_fixture')=>Array.from({length:count},(_,i)=>({at:new Date(start+i*step).toISOString(),method:'GET',identity:{sub:subject}}));
test('strict threshold, inclusive window, unordered events, no input mutation',()=>{
 assert.deepEqual(detect(reads(120)),{action:'observe'});
 const events=reads(121,5000).reverse();
 const original=JSON.stringify(events);
 assert.deepEqual(detect(events),{action:'propose_revocation',reasonCode:'burst_read',subject:'learner_fixture'});
 assert.equal(JSON.stringify(events),original);
 assert.deepEqual(detect(reads(121,5001)),{action:'observe'});
});
test('users, methods, invalid events, region and untrusted extra fields do not create bursts',()=>{
 assert.deepEqual(detect([...reads(100),...reads(100,1000,'other_fixture')]),{action:'observe'});
 assert.deepEqual(detect(reads(200).map(e=>({...e,method:'POST'}))),{action:'observe'});
 assert.deepEqual(detect([null,{}, {at:'invalid',method:'GET',identity:{sub:'learner_fixture'}}]),{action:'observe'});
 assert.deepEqual(detect(reads(30).map(e=>({...e,region:'foreign',network:'unusual',token:'ignored-fixture-value'}))),{action:'observe'});
 assert.throws(()=>detect(null),/invalid_detection_events/);
});
test('selects only the first qualifying subject, without extra response fields',()=>{
 const events=[...reads(121,1000,'first_fixture'),...reads(121,2000,'second_fixture')];
 assert.deepEqual(detect(events),{action:'propose_revocation',reasonCode:'burst_read',subject:'first_fixture'});
});
