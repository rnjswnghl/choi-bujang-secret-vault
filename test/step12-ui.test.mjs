import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
const source=(await readFile(new URL('../public/app.js',import.meta.url),'utf8')).replace(/^import .*;\n/, '');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
async function setup(){
 const nodes=new Map();const events=new Map();
 const node=()=>({hidden:false,textContent:'',children:[],value:'',style:{},reset(){},replaceChildren(...c){this.children=c;},append(...c){this.children.push(...c);}});
 const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
 const document={getElementById:get,createElement:node};
 let session=null,mode='ok';
 const auth={getSession:async()=>({data:{session}}),onAuthStateChange(){},signOut:async()=>({})};
 const report={requestId:'server-summary-id',checkedAt:'2026-10-14T00:00:00Z',rules:['resource_scope'],devices:{approved:{execution:'executed',count:1}},recovery:{execution:'executed',restoreCount:0,lastRestoreAt:null},campaign:[{id:'campaign_01',expected:'deny',actual:null,execution:'not_run'}]};
 const fetch=async(path,init)=>{
  if(mode==='offline')throw new Error('offline');
  let status=200,data={};
  if(path.startsWith('/api/device'))data={id:'a'.repeat(64),status:mode==='revoked'?'revoked':'approved'};
  else if(path==='/api/operations'){status=mode==='denied'?403:mode==='unavailable'?503:200;data=status===200?report:{error:'unavailable'};}
  else if(path==='/api/notes'){data=[];status=init?.headers?.Authorization?(init?.headers?.['X-App-Signature']?200:403):401;}
  return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','x-request-id':'server-request-id'}});
 };
 const runtime=new AsyncFunction('createClient','document','localStorage','window','navigator','crypto','fetch','setTimeout',source+';return {state,deviceStatus,operationsRequest};');
 const app=await runtime(()=>({auth}),document,{removeItem(){}},{location:{origin:'https://fixture.invalid'},addEventListener:(name,fn)=>events.set(name,fn)},{},webcrypto,fetch,fn=>fn());
 async function approve(){session={access_token:'test-memory-session',user:{id:'owner'}};await app.state(session);await app.deviceStatus(true);}
 return {app,get,approve,events,report,setMode:value=>mode=value};
}
test('login and approval gates, exact server summary rendering, no inferred campaign passes',async()=>{
 const f=await setup();assert.equal(f.get('operations').hidden,true);
 await f.approve();assert.equal(f.get('operations').hidden,false);await f.app.operationsRequest();
 const displayed=JSON.parse(f.get('operations-summary').textContent);assert.deepEqual(displayed.devices,f.report.devices);assert.deepEqual(displayed.recovery,f.report.recovery);
 assert.equal(f.get('operations-rows').children[0].children[2].textContent,'미실행');
});
test('failed refresh, revoked approval, logout and offline erase stale summaries',async()=>{
 for(const transition of ['unavailable','denied','revoked','logout','offline']){
  const f=await setup();await f.approve();await f.app.operationsRequest();
  if(transition==='logout')await f.app.state(null);
  else if(transition==='offline')f.events.get('offline')();
  else {f.setMode(transition);if(transition==='revoked')await f.app.deviceStatus(false);else await assert.rejects(f.app.operationsRequest());}
  assert.ok(!f.get('operations-summary').textContent.includes('server-summary-id'));assert.equal(f.get('operations-rows').children.length,0);
  if(transition!=='unavailable')assert.equal(f.get('workspace').hidden,true);
 }
});
test('measurement rows use server request IDs and never retain note contents',async()=>{
 const f=await setup();await f.approve();await f.get('operations-test').onclick();
 const rows=f.get('operations-rows').children;
 assert.equal(rows.length,3);assert.deepEqual(rows.map(r=>r.children[2].textContent),['HTTP 200','HTTP 401','HTTP 403']);
 assert.ok(rows.every(r=>r.children[3].textContent==='server-request-id'));
});
