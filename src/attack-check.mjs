// Only report actual requests. Never include tokens or memo bodies.
export async function runAttackChecks(config) {
  const attempts = [];
  for (const [path, id, expected] of [
    ['/api/notes', 'anonymous_list', '401 또는 403과 JSON 오류'],
    ['/data.json', 'static_notes', '메모 0건 또는 404'],
    ['/aleph.json', 'deployment_identity', '200과 현재 단계 정보'],
    ['/', 'security_header', 'nosniff 헤더'],
  ]) {
    let observed;
    try {
      const response = await fetch(new URL(path, config.publicAppUrl), { redirect: 'error', signal: AbortSignal.timeout(10000) });
      const jsonType = response.headers.get('content-type')?.includes('application/json');
      const data = jsonType ? await response.json() : null;
      observed = `HTTP ${response.status}; JSON ${!!jsonType}`;
      if (id === 'anonymous_list') observed += `; 인증 거부 ${[401,403].includes(response.status) && typeof data?.error === 'string'}`;
      if (id === 'static_notes') observed += `; 메모 0건/404 ${response.status === 404 || (response.ok && Array.isArray(data?.notes) && data.notes.length === 0)}`;
      if (id === 'deployment_identity') observed += `; 단계 ${data?.step ?? '확인 불가'}; 현재 단계 일치 ${response.ok && data?.step === config.step}`;
      if (id === 'security_header') observed += `; nosniff ${response.headers.get('x-content-type-options') === 'nosniff'}`;
    } catch { observed = '미실행/연결 실패: 운영 배포를 확인하세요.'; }
    attempts.push({ attackId: id, expected, observed });
  }
  attempts.push({ attackId: 'account_a_crud', expected: '정상 A 로그인 후 추가·수정·삭제 가능', observed: '미실행: 테스트 계정과 SQL 적용 필요; 비밀번호·토큰을 묶음에 저장하지 않음' });
  let direct;
  try {
    // Public publishable key, no session token: Supabase assigns the anon role.
    const response = await fetch('https://hzovkgmggfqoumxwbejm.supabase.co/rest/v1/vault_notes?select=id&limit=1', {
      headers: { apikey: 'sb_publishable_nNaEZ0ROeB-Zu_9ko7-c4Q_FCKYuwlS' },
      redirect: 'error', signal: AbortSignal.timeout(10000),
    });
    direct = `anon 직접 요청 HTTP ${response.status}; 접근 거부 ${[401,403].includes(response.status)}`;
  } catch { direct = '미실행/연결 실패: anon 직접 요청 확인 불가'; }
  attempts.push({ attackId: 'anon_data_api', expected: '세션 없는 anon 직접 Data API 읽기 거부', observed: direct });
  attempts.push({ attackId: 'cross_owner_crud', expected: 'A/B 본인 CRUD 허용, 타인 GET·PUT·DELETE 404, 소유자 변경 거부', observed: '운영 A/B 시험 미실행; 로컬 모의 테스트 3건 통과는 실제 계정 검증 또는 심판 판정이 아님' });
  return attempts;
}
