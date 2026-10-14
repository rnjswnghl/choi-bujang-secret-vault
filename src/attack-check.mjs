// Only report actual requests. Never include tokens or memo bodies.
export async function runAttackChecks(config) {
  const attempts = [];
  // Non-secret correlation metadata, never an authorization or identity claim.
  async function request(attackId, url, init = {}) {
    if (!/^[a-z0-9][a-z0-9_.-]{0,79}$/.test(attackId)) throw new Error('invalid_attack_id');
    return fetch(url, {
      ...init, method: 'GET', attackId,
      headers: {...init.headers, 'x-aleph-attack-id': attackId, 'x-attack-id': attackId},
    });
  }
  for (const [path, id, expected] of [
    ['/api/notes', 'anonymous_list', '401 또는 403과 JSON 오류'],
    ['/data.json', 'static_notes', '메모 0건 또는 404'],
    ['/aleph.json', 'deployment_identity', '200과 현재 단계 정보'],
    ['/', 'security_header', 'nosniff 헤더'],
  ]) {
    let observed;
    try {
      const response = await request(id, new URL(path, config.publicAppUrl), { redirect: 'error', signal: AbortSignal.timeout(10000) });
      const jsonType = response.headers.get('content-type')?.includes('application/json');
      const data = jsonType ? await response.json() : null;
      observed = `HTTP ${response.status}; JSON ${!!jsonType}`;
      if (id === 'anonymous_list') observed += `; 인증 거부 ${[401,403].includes(response.status) && typeof data?.error === 'string'}; 요청 ${response.headers.get('x-request-id') ?? '미제공'}; 시각 ${new Date().toISOString()}`;
      if (id === 'static_notes') observed += `; 메모 0건/404 ${response.status === 404 || (response.ok && Array.isArray(data?.notes) && data.notes.length === 0)}`;
      if (id === 'deployment_identity') observed += `; 허용 경로 ${Array.isArray(data?.allowedRoutes) ? data.allowedRoutes.length : 0}`;
      if (id === 'deployment_identity') observed += `; 단계 ${data?.step ?? '확인 불가'}; 현재 단계 일치 ${response.ok && data?.step === config.step}`;
      if (id === 'security_header') observed += `; nosniff ${response.headers.get('x-content-type-options') === 'nosniff'}`;
    } catch { observed = 'not_run'; }
    attempts.push({ attackId: id, expected, observed });
  }
  attempts.push({ attackId: 'account_a_crud', expected: '정상 A 로그인 후 추가·수정·삭제 가능', observed: 'not_run' });
  let direct;
  try {
    // Public publishable key, no session token: Supabase assigns the anon role.
    const response = await request('anon_data_api', config.originalApiUrl || 'https://hzovkgmggfqoumxwbejm.supabase.co/rest/v1/vault_notes', {
      headers: { apikey: 'sb_publishable_nNaEZ0ROeB-Zu_9ko7-c4Q_FCKYuwlS' },
      redirect: 'error', signal: AbortSignal.timeout(10000),
    });
    direct = `anon 직접 요청 HTTP ${response.status}; 접근 거부 ${[401,403].includes(response.status)}`;
  } catch { direct = 'not_run'; }
  attempts.push({ attackId: 'anon_data_api', expected: '세션 없는 anon 직접 Data API 읽기 거부', observed: direct });
  attempts.push({ attackId: 'cross_owner_crud', expected: 'A/B 본인 CRUD 허용, 타인 GET·PUT·DELETE 404, 소유자 변경 거부', observed: 'not_run' });
  let keyCheck;
  try {
    const responses = await Promise.all(['/','/app.js'].map(path => request('browser_key_scan', new URL(path, config.publicAppUrl), {redirect:'error',signal:AbortSignal.timeout(10000)})));
    const sources = await Promise.all(responses.map(response => response.text()));
    keyCheck = responses.every(response => response.ok) ? `화면 파일 2개 확인; 공개/비밀 키 패턴 없음 ${sources.every(source => !/sb_publishable_|sb_secret_|eyJ[A-Za-z0-9_-]{12,}\.eyJ/.test(source))}` : '화면 파일 검사 실패: HTTP 오류';
  } catch { keyCheck = 'not_run'; }
  attempts.push({attackId:'browser_key_scan',expected:'화면 HTML·JS에 Supabase 공개/비밀 키 없음',observed:keyCheck});
  if (config.step >= 10) {
    attempts.push({attackId:'post_restore_retest',expected:'복구 직후 실제 API 정상·금지 재시험',observed:'not_run'});

    attempts.push({attackId:'anonymous_restore',expected:'익명 복구 POST 거부; 쓰기 요청은 별도 운영 시험',observed:'not_run'});
  }
  if(config.step>=11){
    for(const [path,attackId] of [['/manifest.webmanifest','app_manifest'],['/api/device?id='+ '0'.repeat(64),'device_approval_anonymous']]){
      let observed;
      try{
        const response=await request(attackId,new URL(path,config.publicAppUrl),{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
        const data=await response.json();
        observed=attackId==='app_manifest'?`HTTP ${response.status}; standalone ${data.display==='standalone'}; 아이콘 ${data.icons?.length??0}`:`HTTP ${response.status}; 익명 승인 조회 거부 ${response.status===401}`;
      }catch{observed='not_run';}
      attempts.push({attackId,expected:attackId==='app_manifest'?'설치형 manifest 제공':'익명 승인 조회 401',observed});
    }
  }
  if(config.step>=12){
    let observed;
    try{
      const response=await request('operations_anonymous',new URL('/api/operations',config.publicAppUrl),{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(10000)});
      observed=`HTTP ${response.status}; 익명 작전실 거부 ${response.status===401}; 요청 ${response.headers.get('x-request-id') ?? '미제공'}; 확인 ${new Date().toISOString()}`;
    }catch{observed='not_run';}
    attempts.push({attackId:'operations_anonymous',expected:'익명 작전실 401, 기록 노출 없음',observed});
    attempts.push({attackId:'campaign_41',expected:'공식 심판 41종 실제 공격 판정',observed:'not_run'});
  }
  return attempts;
}
