// Student checks only; never include response bodies or secrets in the bundle.
export async function runAttackChecks(config) {
  const checks = [
    { attackId: 'static_note_read', expected: '/data.json은 메모 0건 또는 404', observed: '미실행: 실제 배포 주소가 설정되지 않음' },
    { attackId: 'public_api_read', expected: '2단계 공개 API에서 가상 메모 4건 확인; 접근 제한은 아직 없음', observed: '미실행: 실제 배포 주소가 설정되지 않음' },
  ];
  if (!config.publicAppUrl) return checks;
  const app = new URL(config.publicAppUrl);
  if (app.protocol !== 'https:' || app.username || app.password || app.pathname !== '/' || app.search || app.hash || app.hostname.endsWith('.example')) throw new Error('실제 배포 HTTPS 주소를 확인하세요.');
  for (const [i, path] of ['/data.json', '/api/notes'].entries()) {
    try {
      const response = await fetch(new URL(path, app), { redirect: 'error', signal: AbortSignal.timeout(10000) });
      const data = response.ok ? await response.json() : null;
      const count = Array.isArray(data?.notes) ? data.notes.length : null;
      checks[i].observed = `직접 요청 HTTP ${response.status}; 메모 수 ${count ?? '확인 불가'}; ${i === 0 ? ((response.status === 404 || (response.ok && count === 0)) ? '정적 노출 없음' : '정적 노출 확인 실패') : ((response.ok && count === 4) ? '비로그인 API 열람 가능: 남은 약점' : '네 건 열람 확인 실패')}`;
    } catch { checks[i].observed = '요청 실패: 배포 상태 또는 연결 확인 필요'; }
  }
  return checks;
}
