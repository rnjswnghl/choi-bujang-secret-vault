import {INTERNAL_RECOVERY_RETEST} from './app-device.mjs';
// Re-execute the real notes API after restoration. Keep response bodies/tokens in memory only.
export async function retestRestoredNote({handler,authorization,id,expected,otherId}) {
 const results=[];
 async function check(name,req,validate) {
  let status=0,body;
  try {
   await handler(req,{setHeader(){},status(value){status=value;return this;},json(value){body=value;return this;}});
   results.push({name,status,passed:validate(status,body)});
  } catch {results.push({name,status,passed:false});}
 }
 const read={[INTERNAL_RECOVERY_RETEST]:true,method:'GET',url:'/api/notes/'+id,query:{id},headers:{authorization}};
 await check('restored_own_read',read,(status,body)=>status===200&&body?.id?.toLowerCase()===id.toLowerCase()&&body.title===expected.title&&body.body===expected.content);
 await check('anonymous_read',{...read,headers:{}},status=>status===401);
 // The API rejects forged ownership before any write. The restored row remains untouched.
 await check('forged_owner_write',{...read,method:'PUT',body:{title:'retest',body:'retest',owner_id:'forged'}},status=>status===403);
 if(otherId)await check('cross_owner_read',{...read,url:'/api/notes/'+otherId,query:{id:otherId}},status=>status===404);
 else results.push({name:'cross_owner_read',status:null,passed:null,execution:'not_run_no_other_owner_note'});
 return results;
}
