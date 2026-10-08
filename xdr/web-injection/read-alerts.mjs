import { readFile } from 'node:fs/promises';
import { isIP } from 'node:net';
// Extract only allowlisted fields. Descriptions containing credential-like values are suppressed.
export function extract(alert) {
  const description = typeof alert?.rule?.description === 'string' ? alert.rule.description : '';
  return {
    timestamp: Number.isFinite(Date.parse(alert?.timestamp)) ? alert.timestamp : null,
    sourceIp: isIP(alert?.data?.srcip ?? '') ? alert.data.srcip : null,
    account: /^user[0-9]{1,6}$/.test(alert?.data?.srcuser ?? '') ? alert.data.srcuser : '[redacted]',
    level: Number.isInteger(alert?.rule?.level) ? alert.rule.level : 0,
    description: /(?:password|passwd|token|secret|비밀번호|암호)\s*[:=]|sb_(?:secret|publishable)_|eyJ[A-Za-z0-9_-]+\.|-----BEGIN/i.test(description) ? '[redacted]' : description.replace(/[\r\n]/g, ' ').slice(0, 500),
  };
}
export async function readAlerts(file = new URL('../fixtures/web-injection.json', import.meta.url)) {
  const fixture = JSON.parse(await readFile(file, 'utf8'));
  if (!Array.isArray(fixture.alerts)) throw new Error('Invalid alert array');
  return fixture.alerts.map(extract);
}
