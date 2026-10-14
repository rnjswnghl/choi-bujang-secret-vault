import test from 'node:test';
import assert from 'node:assert/strict';
import {retestRestoredNote} from '../src/recovery-retest.mjs';
const id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
test('post-restore replay records actual status, rejects false success and does not log content',async()=>{
 const calls=[];
 const handler=async(req,res)=>{
  calls.push(req.method+':'+req.url);
  const status=!req.headers.authorization?401:req.method==='PUT'?403:req.query.id===id?200:404;
  res.status(status).json(status===200?{id,title:'fixture',body:'fixture'}:{error:'denied'});
 };
 const results=await retestRestoredNote({handler,authorization:'local-fixture-only',id,expected:{title:'fixture',content:'fixture'},otherId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'});
 assert.equal(calls.length,4);
 assert.ok(results.every(r=>r.passed===true));
 assert.doesNotMatch(JSON.stringify(results),/fixture|authorization|content/);
 const bad=await retestRestoredNote({handler:async(req,res)=>res.status(200).json({id,title:'wrong',body:'wrong'}),authorization:'local-fixture-only',id,expected:{title:'fixture',content:'fixture'}});
 assert.ok(bad.some(r=>r.passed===false));
 assert.equal(bad.find(r=>r.name==='cross_owner_read').passed,null);
});
