import {createHash} from 'node:crypto';
// Read-only HTTP evidence. Only metadata is returned; bodies stay in memory.
export async function runAttackChecks(config) {
 const attempts=[];
 const bytes=text=>{let n=0;for(const char of text){const c=char.codePointAt(0);n+=c<=127?1:c<=2047?2:c<=65535?3:4;}return n;};
 async function check(attackId,path,expected,headers={}){
  let observed='not_run';
  try{
   const url=new URL(path,config.publicAppUrl);
   if(url.protocol!=='https:'||url.username||url.password)throw new Error('invalid_check_url');
   const method='GET';
   const response=await fetch(url,{method,headers,alephEvidence:{caseId:attackId,requestKey:'read'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
   const body=await response.text();
   const urlSha256=createHash('sha256').update(url.href).digest('hex');
   // These are measured facts, not a computed pass/deny claim.
   observed=`HTTP ${response.status}; method=${method}; urlSha256=${urlSha256}; bodyBytes=${bytes(body)}`;
  }catch{observed='not_run';}
  attempts.push({attackId,expected,observed});
 }
 await check('anonymous_list','/api/notes','익명 메모 목록: HTTP 401 또는 403, 보호 메모 본문 없음');
 await check('static_notes','/data.json','정적 파일의 메모 0건 또는 HTTP 404');
 await check('deployment_identity','/aleph.json',`HTTP 200; 단계 ${config.step}, 현재 배포 커밋`);
 await check('security_header','/','HTTP 200; nosniff 보안 헤더');
 attempts.push({attackId:'account_a_crud',expected:'정상 A 로그인 후 추가·수정·삭제 허용',observed:'not_run'});
 await check('anon_data_api',config.originalApiUrl||'https://hzovkgmggfqoumxwbejm.supabase.co/rest/v1/vault_notes','익명 원본 Data API 읽기: HTTP 401 또는 403',{
  apikey:'sb_publishable_nNaEZ0ROeB-Zu_9ko7-c4Q_FCKYuwlS'
 });
 attempts.push({attackId:'cross_owner_crud',expected:'A/B 본인 CRUD 허용, 타인 GET·PUT·DELETE 404',observed:'not_run'});
 await check('browser_key_scan','/','화면 HTML의 공개·비밀 키 없음; 별도 소스 검사 필요');
 await check('browser_app_key_scan','/app.js','화면 JS의 공개·비밀 키 없음; 별도 소스 검사 필요');
 if(config.step>=10){
  attempts.push({attackId:'post_restore_retest',expected:'복구 뒤 정상·금지 실제 API 재시험',observed:'not_run'});
  attempts.push({attackId:'anonymous_restore',expected:'익명 복구 POST 거부; 별도 운영 시험',observed:'not_run'});
 }
 if(config.step>=11){
  await check('app_manifest','/manifest.webmanifest','HTTP 200; 설치형 manifest');
  await check('device_approval_anonymous','/api/device?id='+'0'.repeat(64),'익명 승인 조회: HTTP 401');
 }
 if(config.step>=12){
  await check('operations_anonymous','/api/operations','익명 작전실: HTTP 401, 기록 노출 없음');
  attempts.push({attackId:'campaign_41',expected:'공식 심판 41종 실제 공격 판정',observed:'not_run'});
 }
 return attempts;
}
