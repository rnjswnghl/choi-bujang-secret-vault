import { readFile } from 'node:fs/promises';
import { extract } from './read-alerts.mjs';
const patterns = JSON.parse(await readFile(new URL('./patterns.json', import.meta.url), 'utf8'));
let jev = null;
// Inject an authorized Jev adapter; no guessed endpoint or credentials.
export function configureJev(adapter) { jev = typeof adapter === 'function' ? adapter : null; }
const result = (confidence, name) => ({ action: confidence >= .85 ? 'block' : confidence >= .5 ? 'alert' : 'record', confidence, reason: name });
export async function decide(alert) {
  const safe = extract(alert);
  const d = safe.description;
  const count = Number(alert?.data?.count);
  const tagged = Array.isArray(alert?.rule?.mitre) && alert.rule.mitre.some(x => /^T1110(?:\.|$)/.test(x));
  if (!tagged && safe.level <= 3) return result(.05, 'normal-event');
  const guessing = patterns.find(p => p.name === 'password-guessing').name;
  const spraying = patterns.find(p => p.name === 'password-spraying').name;
  const multi = /여러 계정|서로 다른 계정|계정\s*\d+개|계정 이름을 바꿔/.test(d);
  const spray = multi && /같은 비밀번호|같은 간격/.test(d);
  const accounts = String(alert?.data?.accounts ?? '').split(',').filter(x => /^user\d+$/.test(x));
  const shortWindow = /[123]분/.test(d);
  const repeated = /한 글자씩|이어졌|성공은 없/.test(d);
  if (tagged && safe.sourceIp && safe.timestamp && safe.level >= 10) {
    if (spray && (new Set(accounts).size >= 5 || count >= 10)) return result(.96, spraying);
    if (count >= 30 && /실패/.test(d) && (shortWindow || repeated)) return result(.95, guessing);
  }
  if (safe.level <= 3 && /성공|유지|로그아웃|화면/.test(d)) return result(.05, 'normal-event');
  const name = multi ? spraying : guessing;
  // Only ambiguous alerts reach Jev, with sanitized fields and a strict timeout.
  if (!jev) return result(.5, name);
  let timer;
  try {
    const response = await Promise.race([Promise.resolve().then(() => jev({ alert: safe, patterns })), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), 1500); })]);
    const confidence = response?.confidence;
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) return result(.5, name);
    // An ambiguous model response alone never authorizes an IP block.
    return result(Math.min(confidence, .84), name);
  } catch { return result(.5, name); } finally { clearTimeout(timer); }
}
