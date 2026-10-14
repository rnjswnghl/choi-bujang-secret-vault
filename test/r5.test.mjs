import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deploymentIdentity } from '../scripts/deployment-identity.mjs';
import { runAttackChecks } from '../src/attack-check.mjs';

const config = {
  step: 1,
  judgeIssuer: 'https://aleph-judge-production.up.railway.app/defense/judge',
  sampleMarker: 'SAMPLE_NOTE_1',
  publicAppUrl: 'https://student-defense.vercel.app',
};
const env = {
  VERCEL_GIT_PROVIDER: 'github',
  VERCEL_GIT_REPO_OWNER: 'Student-A',
  VERCEL_GIT_REPO_SLUG: 'aleph-defense',
  VERCEL_GIT_COMMIT_SHA: 'a'.repeat(40),
  VERCEL_URL: 'student-defense-123.vercel.app',
};

test('build identity uses Vercel Git and deployment metadata', () => {
  assert.deepEqual(deploymentIdentity(env, config), {
    schema: 'aleph.defense.deployment.v1',
    step: 1,
    repoUrl: 'https://github.com/student-a/aleph-defense',
    commit: 'a'.repeat(40),
    publicAppUrl: 'https://student-defense-123.vercel.app',
    judgeIssuer: config.judgeIssuer,
    sampleMarker: config.sampleMarker,
  });
  assert.throws(() => deploymentIdentity({ ...env, VERCEL_GIT_PROVIDER: undefined }, config));
  assert.throws(() => deploymentIdentity({ ...env, VERCEL_GIT_COMMIT_SHA: 'short' }, config));
});

test('current attack checks verify anonymous denial and no static memo disclosure', async () => {
  const originalFetch = globalThis.fetch;
  const calls=[];
  try {
    globalThis.fetch = async (url, init) => {
      const target=String(url);calls.push({target,init});
      const anonymous=target.endsWith('/api/notes');
      const data=anonymous?{error:'login_required'}:{notes:[]};
      return new Response(JSON.stringify(data),{status:anonymous?401:200,headers:{'content-type':'application/json'}});
    };
    const results=await runAttackChecks({...config,step:1});
    const denied=results.find(r=>r.attackId==='anonymous_list');
    const staticData=results.find(r=>r.attackId==='static_notes');
    assert.match(denied.observed,/^HTTP 401; method=GET; urlSha256=[a-f0-9]{64}; bodyBytes=\d+/u);
    assert.match(staticData.observed,/^HTTP 200; method=GET; urlSha256=[a-f0-9]{64}; bodyBytes=\d+/u);
    const publicRequest=calls.find(c=>c.target.endsWith('/data.json'));
    assert.equal(publicRequest.init.redirect,'error');
    assert.equal(publicRequest.init.attackId,undefined);
    assert.deepEqual(publicRequest.init.alephEvidence,{caseId:'static_notes',requestKey:'read'});
    assert.deepEqual(publicRequest.init.headers,{});
    globalThis.fetch=async()=>new Response('<html>not JSON</html>',{status:200});
    const failed=await runAttackChecks(config);
    assert.match(failed.find(r=>r.attackId==='anonymous_list').observed,/^HTTP 200;/u);
    assert.match(failed.find(r=>r.attackId==='static_notes').observed,/^HTTP 200;/u);
  } finally { globalThis.fetch=originalFetch; }
});
