import {RULE_IDS} from './decider.mjs';
import manifest from '../recovery/policy-manifest.json' with {type:'json'};
export const campaignTests=()=>Array.from({length:41},(_,i)=>({id:`campaign_${String(i+1).padStart(2,'0')}`,scope:'judge_campaign',expected:'공식 심판의 해당 공격 거부',actual:null,requestId:null,checkedAt:null,execution:'not_run'}));
export async function readOperations(db,user,requestId){
 const devices={};
 for(const status of ['pending','approved','revoked']){
  const {count,error}=await db.from('vault_app_devices').select('id',{count:'exact',head:true}).eq('owner_id',user.userId).eq('status',status);
  devices[status]=error?{execution:'unavailable',count:null}:{execution:'executed',count};
 }
 const {data,error}=await db.rpc('vault_operations_recovery',{p_owner:user.userId});
 return {schema:'vault.operations.v1',requestId,checkedAt:new Date().toISOString(),rules:[...RULE_IDS],
 devices,recovery:error?{execution:'unavailable'}:{execution:'executed',...data},
 policyBackup:{version:manifest.version,scope:'verified_local_backup'},
 detection:{execution:'not_run',reason:'운영 엔진 사건 수집 미연결'},
 identityRevocation:{execution:'not_run',reason:'운영 엔진 신원 회수 기록 미연결'},campaign:campaignTests()};
}
