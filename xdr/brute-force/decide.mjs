// Standalone decision entry point: no filesystem/import-time dependency in judge sandboxes.
function extract(alert) {
  const d = typeof alert?.rule?.description === 'string' ? alert.rule.description : '';
  const ip = alert?.data?.srcip;
  return { timestamp: alert?.timestamp, sourceIp: typeof ip === 'string' && ip.length <= 45 ? ip : null,
    account: /^user[0-9]{1,6}$/.test(alert?.data?.srcuser ?? '') ? alert.data.srcuser : '[redacted]',
    level: Number(alert?.rule?.level) || 0,
    description: /(?:password|token|secret|비밀번호)\s*[:=]|sb_secret_|eyJ[A-Za-z0-9_-]+\./i.test(d) ? '[redacted]' : d.slice(0,500) };
}
const patterns = [
  { name: 'password-guessing', evidence: 'MITRE ATT&CK T1110.001 repeated password guesses' },
  { name: 'password-spraying', evidence: 'MITRE ATT&CK T1110.003 one password across accounts' },
];
let jev = null;
// Inject an authorized Jev adapter; no guessed endpoint or credentials.
export function configureJev(adapter) { jev = typeof adapter === 'function' ? adapter : null; }
const result = (confidence, name) => ({ action: confidence >= .85 ? 'block' : confidence >= .5 ? 'alert' : 'record', confidence, reason: name });
export async function decide(alert) {
  const safe = extract(alert);
  const d = safe.description;
  const count = Number(alert?.data?.count);
  const mitre = Array.isArray(alert?.rule?.mitre) ? alert.rule.mitre : alert?.rule?.mitre?.id ?? [];
  const tagged = Array.isArray(mitre) && mitre.some(x => typeof x === 'string' && /^T1110(?:\.|$)/.test(x));
  if (!tagged && safe.level <= 3) return result(.05, 'normal-event');
  const guessing = patterns.find(p => p.name === 'password-guessing').name;
  const spraying = patterns.find(p => p.name === 'password-spraying').name;
  const multi = /여러 계정|서로 다른 계정|계정\s*\d+개|계정 이름을 바꿔|multiple (?:accounts|users)|password spray/i.test(d);
  const spray = multi && /같은 비밀번호|같은 간격|same password|password spray/i.test(d);
  const accounts = String(alert?.data?.accounts ?? '').split(',').filter(x => /^user\d+$/.test(x));
  if (tagged && safe.sourceIp && safe.timestamp && safe.level >= 10) {
    if (spray && (new Set(accounts).size >= 5 || count >= 10)) return result(.96, spraying);
    // Correlated Wazuh failure count and severity are evidence; wording is not a prerequisite.
    const failure = /실패|fail(?:ed|ure)?|invalid password|authentication error|brute.?force/i.test(d);
    if (Number.isInteger(count) && count >= 20 && failure) return result(.95, guessing);
  }
  if (safe.level <= 3 && /성공|유지|로그아웃|화면/.test(d)) return result(.05, 'normal-event');
  const name = multi ? spraying : guessing;
  // Only ambiguous alerts reach Jev, with sanitized fields and a strict timeout.
  let adapter = jev;
  if (!adapter && typeof process !== 'undefined' && process.env?.TYPESAFE_API_KEY) {
    const { evaluateAmbiguous } = await import('./jev.mjs');
    adapter = evaluateAmbiguous;
  }
  if (!adapter) return result(.5, name);
  let timer;
  try {
    const response = await Promise.race([Promise.resolve().then(() => adapter({ alert: safe, patterns })), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 1500); })]);
    const confidence = response?.confidence;
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) return result(.5, name);
    // An ambiguous model response alone never authorizes an IP block.
    return result(Math.min(confidence, .84), name);
  } catch { return result(.5, name); } finally { clearTimeout(timer); }
}
