const PATTERNS = [
  {
    "name": "abnormal_admin_group",
    "condition": "관련 기법과 수준 10 이상; 관리자 그룹 추가에 원격 출처·명령 실행·반복 추가·빠른 재가입 중 하나 결합",
    "evidence": "MITRE T1078 정상 계정 도용 및 비정상 권한 사용. https://attack.mitre.org/techniques/T1078/; 수치 임계값은 학생 정책."
  },
  {
    "name": "abnormal_privileged_use",
    "condition": "관련 기법과 수준 10 이상; 관리자 명령·세션 권한 변경에 신규 관리자·낯선 주소·타 계정 권한 사용 결합",
    "evidence": "MITRE T1068 권한 상승 악용 및 T1078. https://attack.mitre.org/techniques/T1068/; 경보 신호는 악용 성공 증거와 구분."
  },
  {
    "name": "privilege_review",
    "condition": "T1068/T1078 수준 5 이상, 차단할 복합 근거 부족",
    "evidence": "관리자 명령 단발·취소·실패 또는 일반 그룹 변경만으로 차단하지 않음. T1068/T1078 관련 경보는 알림."
  },
  {
    "name": "no_privilege_signal",
    "condition": "위 패턴에 해당하지 않는 정상 경보",
    "evidence": "계정 이름이나 정상 로그인만으로 권한 상승을 단정하지 않고 기록만."
  }
];
// Pure, offline decision on trusted Wazuh evidence; not on browser assertions.
export function decide(alert) {
 const rule=alert?.rule ?? {},data=alert?.data ?? {};
 const text=typeof rule.description==='string'?rule.description.slice(0,4096):'';
 const ids=Array.isArray(rule.mitre)?rule.mitre:Array.isArray(rule.mitre?.id)?rule.mitre.id:[];
 const relevant=ids.some(id=>typeof id==='string' && ['T1068','T1078'].some(t=>id===t||id.startsWith(t+'.')));
 const level=Number.isInteger(rule.level)?rule.level:0;
 const adminGroup=typeof data.group==='string' && ['administrators','administrator','관리자'].includes(data.group.toLowerCase());
 const groupChange=['추가','들어가','들어왔','가입','added','joined'].some(s=>text.includes(s));
 const remote=['원격 주소','처음 보는 주소','처음 봅니다','낯선 주소','unfamiliar address','remote address'].some(s=>text.includes(s));
 const command=['명령을 실행','명령 실행','권한 명령','admin command'].some(s=>text.includes(s));
 const elevated=['방금 관리자가','관리자 권한으로 바뀌','다른 계정의 권한','newly elevated','another account'].some(s=>text.includes(s));
 const rejoined=['다시 관리자로','재가입','rejoined'].some(s=>text.includes(s));
 const failure=['취소','실패','cancelled','failed'].some(s=>text.includes(s));
 let confidence=0.1,reason=PATTERNS[3].name;
 if(relevant && level>=10 && !failure && adminGroup && groupChange && (remote||command||Number(data.count)>=3||rejoined)){
  confidence=0.95;reason=PATTERNS[0].name;
 }else if(relevant && level>=10 && !failure && (command||text.includes('세션')) && (remote||elevated)){
  confidence=0.93;reason=PATTERNS[1].name;
 }else if(relevant && level>=5){confidence=0.65;reason=PATTERNS[2].name;}
 return {action:confidence>=0.85?'block':confidence>=0.5?'alert':'record',confidence,reason};
}
