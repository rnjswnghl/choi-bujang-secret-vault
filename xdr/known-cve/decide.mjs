const PATTERNS = [
  {
    "name": "log4shell_remote_lookup",
    "condition": "요청 머리글 또는 인자에 완전한 ${jndi:ldap(s)/rmi/dns://...} 원격 조회 구문",
    "evidence": "CVE-2021-44228: 공격자가 제어하는 JNDI 원격 끝점 조회. NVD https://nvd.nist.gov/vuln/detail/CVE-2021-44228"
  },
  {
    "name": "known_cve_probe",
    "condition": "T1190 경보에 취약점·조회 조각·점검 도구 관련 신호가 있으나 완전한 원격 조회 구문은 없음",
    "evidence": "MITRE ATT&CK T1190: 공개 서비스 취약점 악용 시도. 단편적 신호는 차단 근거로 부족하므로 알림만. https://attack.mitre.org/techniques/T1190/"
  },
  {
    "name": "no_known_cve_signal",
    "condition": "위 두 패턴에 해당하지 않음",
    "evidence": "CVE 이름·라이브러리 단어만으로 악용 성공을 단정하지 않으며 정상 이벤트는 기록만."
  }
];
// Pure offline decision: never execute or resolve any lookup text.
export function decide(alert) {
 const data=alert?.data ?? {};
 const fields=[data.url,data.useragent,data.headers,data.args,data.query,data.request];
 const strings=[];
 function collect(value,depth=0){
  if(typeof value==='string')strings.push(value.slice(0,8192));
  else if(value && typeof value==='object' && depth<2){
   for(const v of Object.values(value).slice(0,32))collect(v,depth+1);
  }
 }
 for(const field of fields)collect(field);
 const text=strings.map(value=>{for(let i=0;i<2;i++){try{const next=decodeURIComponent(value);if(next===value)break;value=next;}catch{break;}}return value;}).join(' ');
 const remote=/\$\{\s*jndi\s*:\s*(?:ldaps?|rmi|dns):\/\/[^\s{}]+\}/i.test(text);
 const mitre=alert?.rule?.mitre;
 const techniques=Array.isArray(mitre)?mitre:Array.isArray(mitre?.id)?mitre.id:[];
 const description=typeof alert?.rule?.description==='string'?alert.rule.description.slice(0,2048):'';
 let confidence=0.1,reason=PATTERNS[2].name;
 if(remote){confidence=0.96;reason=PATTERNS[0].name;}
 else if(techniques.includes('T1190') && /CVE-2021-44228|log4j|jndi|취약점|조회.*(?:구문|잘린)|점검 도구|라이브러리/i.test(description+' '+text)){
  confidence=0.65;reason=PATTERNS[1].name;
 }
 return {action:confidence>=0.85?'block':confidence>=0.5?'alert':'record',confidence,reason};
}
