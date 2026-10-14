import {test} from 'node:test';
import assert from 'node:assert/strict';
import {campaignTests,readOperations} from '../src/operations.mjs';
import handler from '../api/operations.js';
test('41 campaign slots stay unexecuted without judge evidence',()=>{
 const rows=campaignTests();assert.equal(rows.length,41);
 assert.ok(rows.every(r=>r.execution==='not_run'&&r.actual===null&&r.checkedAt===null));
});
test('summary scopes device and recovery queries to verified owner and never queries notes',async()=>{
 const calls=[];
 const db={
  from(table){
   assert.equal(table,'vault_app_devices');
   return {select(fields,options){
    assert.equal(fields,'id');assert.equal(options.head,true);
    return {eq(field,value){
     assert.equal(field,'owner_id');calls.push(value);
     return {eq:async()=>({count:2,error:null})};
    }};
   }};
  },
  rpc:async(name,args)=>{
   assert.equal(name,'vault_operations_recovery');assert.equal(args.p_owner,'verified-owner');
   return {data:{restoreCount:1,lastRestoreAt:null},error:null};
  }
 };
 const report=await readOperations(db,{userId:'verified-owner'},'request-1');assert.deepEqual(calls,['verified-owner','verified-owner','verified-owner']);assert.equal(report.recovery.restoreCount,1);assert.equal(report.detection.execution,'not_run');
});
test('unavailable server records are not reported as zero or success',async()=>{
 const db={from:()=>({select:()=>({eq:()=>({eq:async()=>({error:true})})})}),rpc:async()=>({error:true})};
 const report=await readOperations(db,{userId:'owner'},'request');assert.equal(report.devices.revoked.count,null);assert.equal(report.recovery.execution,'unavailable');
});
test('anonymous operations request is denied before database access',async()=>{
 const res={setHeader(){},status(n){this.code=n;return this;},json(data){this.data=data;}};
 await handler({method:'GET',headers:{}},res);assert.equal(res.code,401);assert.equal(res.data.error,'login_required');
});
