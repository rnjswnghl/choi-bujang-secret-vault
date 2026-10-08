import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readAlerts, extract } from '../xdr/brute-force/read-alerts.mjs';
import { decide, configureJev } from '../xdr/brute-force/decide.mjs';
import { createGuard, makeRule } from '../xdr/brute-force/connect.mjs';
const fixture = JSON.parse(await readFile(new URL('../xdr/fixtures/brute-force.json', import.meta.url), 'utf8'));
test('all alerts extracted; secrets suppressed', async () => {
  assert.equal((await readAlerts()).length, fixture.alerts.length);
  assert.equal(extract({ rule: { description: 'password=hidden' }, data: { srcuser: 'real@email.example' } }).description, '[redacted]');
});
test('clear attack, ambiguous failure, normal events and Jev fallback', async () => {
  assert.equal((await decide(fixture.alerts[0])).action, 'block');
  assert.equal((await decide(fixture.alerts[10])).action, 'alert');
  for (const alert of fixture.alerts.filter(a => a.rule.mitre.length === 0)) assert.equal((await decide(alert)).action, 'record');
  configureJev(async () => { throw new Error('unavailable'); });
  assert.equal((await decide(fixture.alerts[10])).action, 'alert');
  configureJev(async () => ({ confidence: 1 }));
  assert.equal((await decide(fixture.alerts[10])).action, 'alert');
  configureJev(async () => ({ confidence: .2 }));
  assert.equal((await decide(fixture.alerts[10])).action, 'record');
  configureJev(null);
});
test('trusted IP guard blocks only active attack and preserves base decisions', async () => {
  const alert = fixture.alerts[0], at = Date.parse(alert.timestamp);
  const rule = makeRule(alert, await decide(alert), at);
  assert.ok(rule);
  assert.equal(makeRule(alert, await decide(alert), at + 900000), null);
  const baseline = { schema: 'aleph.decision.v1', requestId: 'test', decision: 'allow', reasonCode: 'approved', ruleIds: [] };
  const guard = createGuard(async () => baseline, async () => [rule]);
  assert.equal((await guard({ requestId: 'test' }, { sourceIp: alert.data.srcip, now: at })).decision, 'deny');
  assert.deepEqual(await guard({ requestId: 'test' }, { sourceIp: '192.0.2.60', now: at }), baseline);
  assert.deepEqual(await guard({ requestId: 'test', sourceIp: alert.data.srcip }), baseline);
  assert.deepEqual(await guard({ requestId: 'test' }, { sourceIp: alert.data.srcip, now: at + 900000 }), baseline);
});

test('correlated high-severity failures do not require specific Korean wording', async () => {
  for (const description of ['같은 주소에서 로그인 실패 25건을 탐지했습니다.', 'Repeated authentication failures detected']) {
    const alert = structuredClone(fixture.alerts[0]);
    alert.rule.description = description;
    alert.data.count = '25';
    alert.rule.mitre = { id: ['T1110.001'] };
    assert.equal((await decide(alert)).action, 'block');
    alert.data.count = '4';
    assert.equal((await decide(alert)).action, 'alert');
  }
});

test('standalone judge entry works without sibling files', async () => {
  const code = await readFile(new URL('../xdr/brute-force/decide.mjs', import.meta.url), 'utf8');
  const entry = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
  const counts = { block: 0, alert: 0, record: 0 };
  for (const alert of fixture.alerts) counts[(await entry.decide(alert)).action]++;
  assert.deepEqual(counts, { block: 10, alert: 9, record: 9 });
});
