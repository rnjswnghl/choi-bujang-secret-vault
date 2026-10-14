const PATTERNS = [
  {
    "name": "suspicious_service",
    "condition": "T1543 서비스 생성·변경 + 임시 실행 파일 또는 서명 없음과 반복 등록; 수준 10 이상",
    "evidence": "MITRE T1543 시스템 프로세스 생성·변경. https://attack.mitre.org/techniques/T1543/; 임계값은 학생 정책이다."
  },
  {
    "name": "suspicious_scheduled_task",
    "condition": "T1053 예약 작업 + 임시 경로 실행 파일; 수준 10 이상",
    "evidence": "MITRE T1053 예약 작업을 통한 지속성. https://attack.mitre.org/techniques/T1053/; 임계값은 학생 정책이다."
  },
  {
    "name": "unlisted_startup_program",
    "condition": "시작 폴더 실행 파일 추가 + 평소 목록에 없음; 수준 10 이상",
    "evidence": "시작 폴더는 MITRE T1547.001에 직접 해당. 시험 경보의 T1543 표기도 수용. https://attack.mitre.org/techniques/T1547/001/"
  },
  {
    "name": "persistence_review",
    "condition": "관련 기법 경보 수준 5 이상이지만 차단 근거 조합은 부족",
    "evidence": "T1543/T1053 신호 하나 또는 서명 미확인은 악성 확정 근거가 부족해 알림만 남긴다."
  },
  {
    "name": "no_persistence_signal",
    "condition": "차단·검토 패턴이 없는 정상 이벤트",
    "evidence": "정상 기존 서비스·예약 작업을 기법 이름만으로 차단하지 않는다."
  }
];
// Pure decision; descriptions are trusted Wazuh evidence, never browser assertions.
export function decide(alert) {
 const data=alert?.data ?? {},rule=alert?.rule ?? {};
 const description=typeof rule.description==='string'?rule.description.slice(0,4096):'';
 const path=typeof data.path==='string'?data.path.slice(0,4096):'';
 const ids=Array.isArray(rule.mitre)?rule.mitre:Array.isArray(rule.mitre?.id)?rule.mitre.id:[];
 const has=(id)=>ids.some(v=>typeof v==='string'&&(v===id||v.startsWith(id+'.')));
 const service=has('T1543'),task=has('T1053'),startup=has('T1547');
 const level=Number.isInteger(rule.level)?rule.level:0;
 const normalizedPath=path.replaceAll(String.fromCharCode(92),'/');
 const temp=/(?:^|\/)(?:temp|tmp)\/.+\.(?:exe|cmd|bat|ps1)$/i.test(normalizedPath);
 const startupPath=/\/Startup\/.+\.(?:exe|lnk|cmd|bat|ps1)$/i.test(normalizedPath);
 const unsigned=/서명\s*(?:없는|없|이\s*없)|unsigned/i.test(description);
 const repeat=Number(data.count)>=3;
 const serviceChange=/(?:새\s*서비스|서비스.*(?:등록|바뀌|변경)|new service|service.*(?:creat|chang|register))/i.test(description);
 const baselineAbsent=/평소\s*목록에\s*없는|unlisted|not in (?:the )?baseline/i.test(description);
 let confidence=0.1,reason=PATTERNS[4].name;
 if(level>=10 && service && serviceChange && (temp || unsigned&&repeat)){
  confidence=0.95;reason=PATTERNS[0].name;
 }else if(level>=10 && task && temp && /예약\s*작업|scheduled task/i.test(description)){
  confidence=0.93;reason=PATTERNS[1].name;
 }else if(level>=10 && (startup||service) && startupPath && baselineAbsent){
  confidence=0.91;reason=PATTERNS[2].name;
 }else if(level>=5 && (service||task||startup)){
  confidence=0.65;reason=PATTERNS[3].name;
 }
 return {action:confidence>=0.85?'block':confidence>=0.5?'alert':'record',confidence,reason};
}
