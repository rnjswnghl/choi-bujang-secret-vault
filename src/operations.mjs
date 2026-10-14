import {RULE_IDS} from './decider.mjs';
import manifest from '../recovery/policy-manifest.json' with {type:'json'};
export const campaignTests=()=>Array.from({length:41},(_,i)=>({id:`campaign_${String(i+1).padStart(2,'0')}`,scope:'judge_campaign',expected:'공식 심판의 해당 공격 거부',actual:null,requestId:null,checkedAt:null,execution:'not_run'}));
export async function readOperations(db,user,requestId){
 const devices={};
 for(const status of ['pending','approved','revoked']){
  const {count,error}=await db.from('vault_app_devices').select('id',{count:'exact',head:true}).eq('owner_id',user.userId).eq('status',status);
  devices[status]=error||!Number.isSafeInteger(count)||count<0?{execution:'unavailable',count:null}:{execution:'executed',count};
 }
 const {data,error}=await db.rpc('vault_operations_recovery',{p_owner:user.userId});
 const recoveryValid=!error&&data&&Number.isSafeInteger(data.restoreCount)&&data.restoreCount>=0
  &&(data.lastRestoreAt===null||typeof data.lastRestoreAt==='string'&&Number.isFinite(Date.parse(data.lastRestoreAt)));
 return {schema:'vault.operations.v1',requestId,checkedAt:new Date().toISOString(),rules:[...RULE_IDS],
 devices,recovery:recoveryValid?{execution:'executed',restoreCount:data.restoreCount,lastRestoreAt:data.lastRestoreAt}:{execution:'unavailable',restoreCount:null,lastRestoreAt:null},
 policyBackup:{version:manifest.version,scope:'configured_backup_metadata',execution:'not_run',reason:'사본 버전 설정; 실제 복구 성공을 의미하지 않음'},
 detection:{execution:'not_run',reason:'운영 엔진 사건 수집 미연결'},
 identityRevocation:{execution:'not_run',reason:'운영 엔진 신원 회수 기록 미연결'},campaign:campaignTests()};
}
