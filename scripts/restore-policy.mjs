import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(import.meta.dirname,'..');
const SAFE_VERSION='e0f6ded8380a8c9e30351c6584d6125612c61758';
const SAFE_SHA256='dacb7d2d0f077615a4c566fed8fe0a52e2bc6cd1e1400a857cf336988c6af4b6';
const digest=value=>createHash('sha256').update(value).digest('hex');
export async function previewPolicy(target=resolve(root,'artifacts/test-policy.mjs')) {
 const manifest=JSON.parse(await readFile(resolve(root,'recovery/policy-manifest.json'),'utf8'));
 const safe=await readFile(resolve(root,'recovery/safe-decider.mjs'),'utf8');
 if(manifest.schema!=='vault.policy-backup.v1'||manifest.version!==SAFE_VERSION||manifest.sha256!==SAFE_SHA256||!/^[a-f0-9]{40}$/.test(manifest.version)||digest(safe)!==manifest.sha256)throw new Error('invalid_policy_backup');
 // Restore only the dedicated simulation file, never runtime policy or other services.
 if(resolve(target)!==resolve(root,'artifacts/test-policy.mjs'))throw new Error('invalid_test_policy_target');
 let current;
 try{current=await readFile(target,'utf8');}catch(error){if(error.code==='ENOENT')throw new Error('test_policy_missing');throw error;}
 const oldLines=current.split('\n'),newLines=safe.split('\n');
 const changes=[];
 for(let i=0;i<Math.max(oldLines.length,newLines.length);i++)if(oldLines[i]!==newLines[i])changes.push({line:i+1,before:oldLines[i]??null,after:newLines[i]??null});
 return {version:manifest.version,beforeSha256:digest(current),afterSha256:manifest.sha256,changes};
}
export async function restorePolicy(expectedBeforeSha256,expectedAfterSha256) {
 const target=resolve(root,'artifacts/test-policy.mjs');
 const plan=await previewPolicy(target);
 if(plan.beforeSha256!==expectedBeforeSha256||plan.afterSha256!==expectedAfterSha256)throw new Error('policy_preview_changed');
 const safe=await readFile(resolve(root,'recovery/safe-decider.mjs'),'utf8');
 if(digest(safe)!==plan.afterSha256)throw new Error('invalid_policy_backup');
 // Append audit before changing the simulation; never truncate existing history.
 await writeFile(resolve(root,'artifacts/policy-recovery-audit.jsonl'),JSON.stringify({at:new Date().toISOString(),version:plan.version,beforeSha256:plan.beforeSha256,afterSha256:plan.afterSha256})+'\n',{flag:'a',mode:0o600});
 await writeFile(target+'.tmp',safe,{mode:0o600});
 await rename(target+'.tmp',target);
 return {restored:true,version:plan.version,sha256:plan.afterSha256};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
 try{
  if(process.argv[2]==='init'){
   await mkdir(resolve(root,'artifacts'),{recursive:true});
   const safe=await readFile(resolve(root,'recovery/safe-decider.mjs'),'utf8');
   const manifest=JSON.parse(await readFile(resolve(root,'recovery/policy-manifest.json'),'utf8'));
   if(digest(safe)!==SAFE_SHA256||manifest.version!==SAFE_VERSION||manifest.sha256!==SAFE_SHA256)throw new Error('invalid_policy_backup');
   await writeFile(resolve(root,'artifacts/test-policy.mjs'),safe,{flag:'wx',mode:0o600});
   console.log('시험 정책 생성 완료');
  }else if(process.argv[2]==='apply')console.log(JSON.stringify(await restorePolicy(process.argv[3],process.argv[4])));
  else console.log(JSON.stringify(await previewPolicy(),null,2));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
