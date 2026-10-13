import test from 'node:test';
import assert from 'node:assert/strict';
import { decide, RULE_IDS } from '../src/decider.mjs';
import { fixtureRequests } from '../scripts/fixture-7.mjs';
test('registered reads allowed; missing or non-boolean registration denied', async () => {
  const { normal } = fixtureRequests();
  assert.ok(RULE_IDS.includes('device_registered'));
  assert.equal((await decide(normal)).decision, 'allow');
  for (const value of [false, undefined, null, 'true', 1, {}]) {
    const out = await decide({ ...normal, deviceRegistered: value });
    assert.equal(out.decision, 'deny');
    assert.equal(out.reasonCode, 'device_not_registered');
    assert.equal(out.requestId, normal.requestId);
    assert.equal(Object.keys(out).length, 5);
  }
});
test('device registration does not grant other actions or services', async () => {
  const { normal } = fixtureRequests();
  for (const change of [{method:'POST'},{service:'other'},{path:'/other'},{route:'GET /other'}]) {
    assert.equal((await decide({...normal,...change})).decision,'deny');
  }
  assert.equal((await decide({...normal,path:'/notes',route:'GET /notes'})).decision,'deny');
});
