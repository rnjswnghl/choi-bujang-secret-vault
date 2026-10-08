import { isIP } from 'node:net';
import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { extract } from './read-alerts.mjs';
const rulesFile = new URL('./deny-rules.json', import.meta.url);
const logFile = new URL('../alerts.log', import.meta.url);
const TTL = 15 * 60 * 1000;
export function makeRule(alert, decision, observedAt = Date.now()) {
  const safe = extract(alert);
  if (decision.action !== 'block' || decision.confidence < .85 || !safe.sourceIp || !safe.timestamp || !/^wi-[0-9]+$/.test(alert.id)) return null;
  const start = Date.parse(safe.timestamp);
  // Historical fixture rules remain historical; do not re-block live addresses on replay.
  if (!Number.isFinite(observedAt) || start > observedAt + 5000 || observedAt >= start + TTL) return null;
  return { id: 'xdr.web-injection.' + alert.id, sourceIp: safe.sourceIp, alertId: alert.id, pattern: decision.reason, startsAt: new Date(start).toISOString(), expiresAt: new Date(start + TTL).toISOString() };
}
export async function persistRules(rules) { await writeFile(rulesFile, JSON.stringify(rules, null, 2) + '\n'); }
export async function logDecision(alert, decision) {
  if (!['block','alert'].includes(decision.action)) return;
  if (!/^wi-[0-9]+$/.test(alert.id)) return;
  await appendFile(logFile, JSON.stringify({ alertId: alert.id, action: decision.action, confidence: decision.confidence, pattern: decision.reason }) + '\n');
}
export function createGuard(baseDecide, getRules) {
  // sourceIp must come from a trusted gateway, never from a browser request body.
  return async function guardedDecide(request, { sourceIp, now = Date.now() } = {}) {
    const rules = await getRules();
    const match = isIP(sourceIp ?? '') && rules.find(r => r.sourceIp === sourceIp && Date.parse(r.startsAt) <= now && now < Date.parse(r.expiresAt));
    if (match) return { schema: 'aleph.decision.v1', requestId: request.requestId, decision: 'deny', reasonCode: 'starter_not_ready', ruleIds: [match.id] };
    return baseDecide(request);
  };
}
export async function loadRules() {
  try { return JSON.parse(await readFile(rulesFile, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
}
