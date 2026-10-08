// Standalone judge entry: no import-time filesystem, network or sibling modules.
let jev = null;
export function configureJev(adapter) { jev = typeof adapter === 'function' ? adapter : null; }
const result = (confidence, reason) => ({ action: confidence >= .85 ? 'block' : confidence >= .5 ? 'alert' : 'record', confidence, reason });
function sanitized(alert) {
  const description = typeof alert?.rule?.description === 'string' ? alert.rule.description : '';
  return { timestamp: alert?.timestamp, level: Number(alert?.rule?.level) || 0,
    description: /(?:password|token|secret|비밀번호)\s*[:=]|sb_secret_|eyJ[A-Za-z0-9_-]+\./i.test(description) ? '[redacted]' : description.replace(/[\r\n]/g,' ').slice(0,500) };
}
function decodeBounded(text) {
  let out = typeof text === 'string' ? text.slice(0,2048) : '';
  for (let i=0;i<2;i++) { try { const next=decodeURIComponent(out); if(next===out) break; out=next; } catch { break; } }
  return out;
}
export async function decide(alert) {
  const safe = sanitized(alert), d = safe.description;
  const mitre = Array.isArray(alert?.rule?.mitre) ? alert.rule.mitre : alert?.rule?.mitre?.id ?? [];
  const tagged = Array.isArray(mitre) && mitre.some(x => typeof x==='string' && /^T1190(?:\.|$)/.test(x));
  const count = Number(alert?.data?.count);
  const url = decodeBounded(alert?.data?.url);
  const sql = /SQL\s*(?:구문|표기|표식)|데이터베이스 조회를 이어|sql injection/i.test(d) || /\bunion\s+(?:all\s+)?select\b|\bselect\b.{1,100}\bfrom\b|['"]\s*or\s+\d+\s*=\s*\d+/i.test(url);
  const script = /스크립트\s*(?:삽입|표식)|script injection|cross.site scripting/i.test(d) || /<\s*script\b|\bon(?:error|load)\s*=/i.test(url);
  const traversal = /경로.*(?:거슬러|이탈)|path traversal/i.test(d) || /(?:\.\.\/){2,}/.test(url);
  const command = /명령\s*(?:구분자|삽입)|command injection/i.test(d) || /[;|&]\s*(?:cat|sh|bash|whoami)\b/i.test(url);
  const name = sql ? 'sql-injection' : script ? 'script-injection' : traversal ? 'path-traversal' : command ? 'command-injection' : 'injection-review';
  if (safe.level <= 3 && !tagged && !(sql || script || traversal || command)) return result(.05, 'normal-event');
  // Count is the trusted Wazuh correlation, not a browser-supplied counter.
  if (tagged && safe.level >= 10 && Number.isInteger(count) && count >= 5 && (sql || script || traversal || command)) return result(.96, name);
  let adapter = jev;
  if (!adapter && typeof process !== 'undefined' && process.env?.TYPESAFE_API_KEY) {
    try { const module = await import('./jev.mjs'); adapter = module.evaluateAmbiguous; } catch { return result(.5,name); }
  }
  if (!adapter) return result(.5, name);
  let timer;
  try {
    const answer = await Promise.race([Promise.resolve().then(() => adapter({alert:safe,pattern:name})), new Promise((_,reject) => { timer=setTimeout(()=>reject(new Error('timeout')),1500); })]);
    if (!Number.isFinite(answer?.confidence) || answer.confidence < 0 || answer.confidence > 1) return result(.5,name);
    // Single ambiguous requests cannot turn into IP blocks on a model opinion alone.
    return result(Math.min(answer.confidence,.84),name);
  } catch { return result(.5,name); } finally { clearTimeout(timer); }
}
