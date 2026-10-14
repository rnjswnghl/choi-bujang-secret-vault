// Test preloader only; not imported by the submission command.
// NODE_OPTIONS='--import=./scripts/bundle-readonly-guard.mjs' npm run bundle
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const upstreamFetch=globalThis.fetch;
const records=[];
let blocked=0;
globalThis.fetch=async(input,init={})=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 const method=String(init.method??input?.method??'GET').toUpperCase();
 const headers=new Headers(init.headers??input?.headers);
 const attackId=init.attackId;
 const record={attackId:attackId??null,method,path:url.pathname,startedAt:new Date().toISOString(),status:null,requestId:null};
 records.push(record);
 const forbiddenHost=url.hostname==='localhost'||url.hostname.endsWith('.local')||url.hostname.endsWith('.internal')||url.hostname.startsWith('[')||/^\d+(?:\.\d+){3}$/.test(url.hostname);
 if(url.protocol!=='https:'||url.username||url.password||forbiddenHost||!['GET','HEAD'].includes(method)||init.body!==undefined
  ||typeof attackId!=='string'||! /^[a-z0-9][a-z0-9_.-]{0,79}$/.test(attackId)
  ||headers.get('x-aleph-attack-id')!==attackId||headers.get('x-attack-id')!==attackId){
  blocked++;
  throw new Error('bundle_request_contract_violation');
 }
 try{
  const response=await upstreamFetch(input,init);
  record.status=response.status;record.requestId=response.headers.get('x-request-id');
  return response;
 }finally{record.completedAt=new Date().toISOString();}
};
process.on('beforeExit',()=>{
 if(!records.length&&!blocked)return;
 let unmatched=[];
 try{
  const bundle=JSON.parse(readFileSync('artifacts/submission.json','utf8'));
  unmatched=bundle.attackAttempts.filter(row=>row.observed!=='not_run'
   &&!records.some(record=>record.attackId===row.attackId&&record.status!==null)).map(row=>row.attackId);
 }catch{unmatched=['submission_unavailable'];}
 mkdirSync('artifacts',{recursive:true});
 writeFileSync('artifacts/bundle-request-audit.json',JSON.stringify({records,blocked,unmatched},null,2)+'\n');
 process.stdout.write(`read_only_guard: requests=${records.length}, blocked=${blocked}, unmatched=${unmatched.length}\n`);
 // Caught contract failures and fabricated measured results still fail the command.
 if(blocked||unmatched.length)process.exitCode=1;
});
