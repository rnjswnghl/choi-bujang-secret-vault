import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {retestRestoredNote} from '../src/recovery-retest.mjs';
import {previewPolicy,restorePolicy} from '../scripts/restore-policy.mjs';
const root=new URL('../',import.meta.url);
const id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
let source=await readFile(new URL('../api/restore.js',import.meta.url),'utf8');
source=source.replace(/^import .*;\n/gm,'').replace('export default async function handler','async function handler');
const build=new Function('notesHandler','retestRestoredNote','createClient','createLoginVerifier','config',source+'\nreturn handler;');
process.env.SUPABASE_URL='https://hzovkgmggfqoumxwbejm.supabase.co';
process.env.SUPABASE_SECRET_KEY='local-test-placeholder';
async function request({user={kind:'judge',identity:'b',userId:'fixture-B'},body={id},method='POST',error=null,url='/api/restore',broken=false}={}) {
 let status,result,called=false;
 const notes=async(req,res)=>res.status(broken?200:!req.headers.authorization?401:req.method==='PUT'?403:200).json({id,title:broken?'wrong':'fixture',body:'fixture'});
 const db={from(){const q={select(){return q;},eq(){return q;},neq(){return q;},limit:async()=>({data:[],error:null}),maybeSingle:async()=>({data:{id,title:'fixture',content:'fixture'},error:null})};return q;},rpc:async(name,args)=>{called=true;assert.equal(name,'restore_vault_note');assert.deepEqual(args,{p_id:id,p_owner:'fixture-B'});return {error,data:{restored:true,id,contentHash:'a'.repeat(64)}};}};
 const handler=build(notes,retestRestoredNote,()=>db,()=>async()=>user,{identityProvider:{issuer:process.env.SUPABASE_URL+'/auth/v1'}});
 await handler({method,url,headers:{authorization:'Bearer test.placeholder.signature'},body},{setHeader(){},status(s){status=s;return this;},json(v){result=v;}});
 return {status,result,called};
}
test('recovery only accepts verified judge B and exact ID-only POST',async()=>{
 const success=await request();
 assert.equal(success.status,200);
 assert.ok(success.result.retest.slice(0,3).every(r=>r.passed===true));
 assert.equal((await request({broken:true})).status,502);
 for(const user of [null,{kind:'student',userId:'fixture-B'},{kind:'judge',identity:'a',userId:'fixture-A'}])assert.equal((await request({user})).called,false);
 for(const body of [{id,owner_id:'fixture-B'},{id,role:'judge'},{id:'invalid'},{}])assert.equal((await request({body})).status,400);
 assert.equal((await request({method:'GET'})).status,405);
 assert.equal((await request({url:'/api/restore?mode=all'})).called,false);
 assert.equal((await request({error:{code:'backup_not_available'}})).status,409);
});
test('policy preview and explicit confirmed restore preserve runtime and audit',async()=>{
 await mkdir(new URL('artifacts/',root),{recursive:true});
 const target=new URL('artifacts/test-policy.mjs',root);
 const runtime=await readFile(new URL('src/decider.mjs',root),'utf8');
 await writeFile(target,'export async function decide(){return {decision:"allow"};}\n');
 const plan=await previewPolicy();assert.ok(plan.changes.length>0);
 await assert.rejects(restorePolicy('0'.repeat(64),plan.afterSha256),/policy_preview_changed/);
 const before=await readFile(new URL('artifacts/policy-recovery-audit.jsonl',root),'utf8').catch(()=> '');
 await restorePolicy(plan.beforeSha256,plan.afterSha256);
 assert.equal(await readFile(target,'utf8'),runtime);
 assert.ok((await readFile(new URL('artifacts/policy-recovery-audit.jsonl',root),'utf8')).startsWith(before));
 assert.equal(await readFile(new URL('src/decider.mjs',root),'utf8'),runtime);
 const safe=await import('data:text/javascript;base64,'+Buffer.from(runtime).toString('base64'));
 const {fixtureRequests}=await import('../scripts/fixture-7.mjs');const {normal}=fixtureRequests();
 assert.equal((await safe.decide(normal)).decision,'allow');
 assert.equal((await safe.decide({...normal,path:'/notes',route:'GET /notes'})).decision,'deny');
 await assert.rejects(previewPolicy(new URL('src/decider.mjs',root).pathname),/invalid_test_policy_target/);
});
