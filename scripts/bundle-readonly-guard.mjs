// Local independent request recorder; not imported by npm run bundle.
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const upstream=globalThis.fetch,records=[];
let blocked=0;
globalThis.fetch=async(input,init={})=>{
 const url=new URL(typeof input==='string'||input instanceof URL?input:input.url);
 const method=String(init.method??input?.method??'GET').toUpperCase();
 const evidence=init.alephEvidence;
 const record={caseId:evidence?.caseId??null,requestKey:evidence?.requestKey??null,method,urlSha256:createHash('sha256').update(url.href).digest('hex'),path:url.pathname,startedAt:new Date().toISOString(),status:null,bodyBytes:null};
 records.push(record);
 const forbiddenHost=url.hostname==='localhost'||url.hostname.endsWith('.local')||url.hostname.endsWith('.internal')||url.hostname.startsWith('[')||/^\d+(?:\.\d+){3}$/.test(url.hostname);
 if(url.protocol!=='https:'||url.username||url.password||forbiddenHost||!['GET','HEAD'].includes(method)||init.body!==undefined||typeof evidence?.caseId!=='string'||! /^[a-z0-9][a-z0-9_.-]{0,79}$/.test(evidence.caseId)||evidence.requestKey!=='read'){blocked++;throw new Error('bundle_read_only_violation');}
 try{
  const response=await upstream(input,init);record.status=response.status;
  record.bodyBytes=(await response.clone().arrayBuffer()).byteLength;
  record.requestId=response.headers.get('x-request-id');return response;
 }finally{record.completedAt=new Date().toISOString();}
};
process.on('beforeExit',()=>{
 if(!records.length&&!blocked)return;
 let unmatched=[];const consumed=new Set(),matches=[];
 try{
  const b=JSON.parse(readFileSync('artifacts/submission.json','utf8'));
  unmatched=b.attackAttempts.filter(row=>{
   if(row.observed==='not_run')return false;
   if(!/^HTTP [1-5]\d{2}; method=(GET|HEAD); urlSha256=[a-f0-9]{64}; bodyBytes=\d+$/.test(row.observed))return true;
   const method=row.observed.match(/\bmethod=(GET|HEAD)\b/)?.[1];
   const hash=row.observed.match(/\burlSha256=([a-f0-9]{64})\b/)?.[1];
   const status=Number(row.observed.match(/\bHTTP (\d{3})\b/)?.[1]);
   const size=Number(row.observed.match(/\bbodyBytes=(\d+)\b/)?.[1]);
   const index=records.findIndex((r,i)=>!consumed.has(i)&&r.caseId===row.attackId&&r.requestKey==='read'&&r.method===method&&r.urlSha256===hash&&r.status===status&&r.bodyBytes===size);
   if(index<0)return true;
   consumed.add(index);matches.push({attackId:row.attackId,recordIndex:index});return false;
  }).map(row=>row.attackId);
 }catch{unmatched=['submission_unavailable'];}
 mkdirSync('artifacts',{recursive:true});
 writeFileSync('artifacts/bundle-request-audit.json',JSON.stringify({records,matches,blocked,unmatched},null,2)+'\n');
 process.stdout.write(`read_only_guard: requests=${records.length}, blocked=${blocked}, unmatched=${unmatched.length}\n`);
 if(blocked||unmatched.length)process.exitCode=1;
});
