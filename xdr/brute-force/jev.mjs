// TypeSafe HTTP contract: https://docs.typesafe.ai/api
export async function evaluateAmbiguous({ alert, patterns }) {
  const key = process.env.TYPESAFE_API_KEY;
  if (!key) throw new Error('Jev unavailable');
  const response = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(1200),
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'jev-latest', state: { alert, patterns }, questions: {
      attack: { type: 'noul', instructions: 'Does this sanitized authentication alert provide convincing evidence of automated password guessing or spraying? Judge evidence, not the mere presence of a MITRE tag.', criteria: {
        true: 'Repeated automated guessing or a password shared across many accounts is evidenced.',
        false: 'Successful ordinary sessions, isolated mistakes, or insufficient evidence of automation.'
      } }
    } })
  });
  if (!response.ok) throw new Error('Jev unavailable');
  const data = await response.json();
  const probability = data?.answers?.attack?.noul;
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) throw new Error('Invalid Jev answer');
  return { confidence: probability };
}
