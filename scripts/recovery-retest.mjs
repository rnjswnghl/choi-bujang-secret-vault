import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fixtureRequests} from './fixture-7.mjs';
import {detect} from '../src/detect.mjs';
import {previewPolicy,restorePolicy} from './restore-policy.mjs';
const root=resolve(import.meta.dirname,'..');
export async function runRecoveryRetest() {
 await mkdir(resolve(root,'artifacts'),{recursive:true});
 const target=resolve(root,'artifacts/test-policy.mjs');
 try {await readFile(target);}catch(error){
  if(error.code!=='ENOENT')throw error;
  await writeFile(target,await readFile(resolve(root,'recovery/safe-decider.mjs')),{flag:'wx',mode:0o600});
 }
 const plan=await previewPolicy();
 // This command is an explicitly requested simulation restore, never runtime policy.
 await restorePolicy(plan.beforeSha256,plan.afterSha256);
 const startedAt=new Date().toISOString();
 const restored=await import('data:text/javascript;base64,'+Buffer.from(await readFile(target)).toString('base64'));
 const {normal,suspicious}=fixtureRequests();
 const checks=[];
 for(const [name,request,expected] of [
  ['normal',normal,'allow'],
  ['unregistered',{...normal,deviceRegistered:false},'deny'],
  ['notice_write',{...normal,service:'notices',method:'PUT',path:'/notices/demo',route:'PUT /notices/:id'},'deny'],
  ['whole_list',{...normal,path:'/notes',route:'GET /notes'},'deny'],
  ['composite',suspicious,'step_up'],
  ['reverified',{...suspicious,stepUp:{verified:true,authAgeSeconds:0}},'allow'],
 ]){
  const response=await restored.decide(request);
  checks.push({name,execution:'executed',scope:'local_simulation',expected,observed:response.decision,passed:response.decision===expected});
 }
 const events=count=>Array.from({length:count},(_,i)=>({at:new Date(Date.UTC(2026,9,1)+i*2000).toISOString(),method:'GET',identity:{sub:'learner_fixture'}}));
 for(const [name,count,expected] of [['normal_detection',30,'observe'],['burst_detection',121,'propose_revocation']]){
  const response=detect(events(count));checks.push({name,execution:'executed',scope:'local_simulation',expected,observed:response.action,passed:response.action===expected});
 }

 const cases=[
  ['normal_and_forbidden_after_restore',['test/step4-owner.test.mjs','test/step6-device.test.mjs','test/step7-context.test.mjs','test/step8-resource.test.mjs','test/step8-read-boundary.test.mjs','test/step8-notices.test.mjs','test/step9-detect.test.mjs','test/step10-recovery.test.mjs','test/step11-app-device.test.mjs','test/recovery-retest.test.mjs','test/r5.test.mjs']],
 ];
 const results=[];
 for(const [name,files] of cases){
  try{
   const output=execFileSync(process.execPath,['--test',...files],{cwd:root,encoding:'utf8',timeout:30000});
   const count=Number(output.match(/(?:ℹ |# )?tests (\d+)/)?.[1]??0);
   results.push({name,execution:'executed',scope:'local_simulation',passed:true,tests:count});
  }catch{results.push({name,execution:'executed',scope:'local_simulation',passed:false});}
 }
 const report={schema:'vault.recovery-retest.v1',startedAt,completedAt:new Date().toISOString(),policyRestored:true,checks,results,
  liveAccountRetest:{execution:'not_run',reason:'requires_judge_signed_B_restore_request'}};
 await writeFile(resolve(root,'artifacts/recovery-retest.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600});
 return report;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 try{const report=await runRecoveryRetest();console.log(JSON.stringify(report,null,2));if([...report.results,...report.checks].some(r=>!r.passed))process.exitCode=1;}
 catch(error){console.error(error.message);process.exitCode=1;}
}
