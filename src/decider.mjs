// Server-owned bindings only. Engine subject IDs must never be equated with Auth UUIDs.
// The default binding reproduces the existing public local-practice fixture, not a real user.
const fixtureBindings = [{ subjectId: 'learner_fixture', deviceId: 'aaaaaaaaaaaaaaaa',
  service: 'notes', path: '/notes/demo', resourceId: 'notes:demo', permissions: ['GET','PUT'] }];
function loadResourceBindings() {
  const raw = typeof process !== 'undefined' ? process.env.ALEPH_RESOURCE_BINDINGS : undefined;
  if (!raw) return fixtureBindings;
  try { const entries = JSON.parse(raw); return Array.isArray(entries) ? entries : []; }
  catch { return []; }
}
export function resourceAllowed(request, bindings = loadResourceBindings()) {
  if (request.queryLength !== 0 || !['GET','PUT'].includes(request.method)) return false;
  if (typeof request.path !== 'string' || /[%?#\\]/.test(request.path)) return false;
  const family = request.service === 'notes' ? 'notes' : request.service === 'notices' ? 'notices' : null;
  if (!family) return false;
  if (request.path !== '/' + family && !request.path.startsWith('/' + family + '/')) return false;
  const resourcePart = request.path.slice(family.length + 2);
  if (request.path !== '/' + family && resourcePart !== 'demo'
    && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(resourcePart)) return false;
  const expectedRoute = request.path === '/' + family ? request.method + ' /' + family : request.method + ' /' + family + '/:id';
  if (request.route !== expectedRoute) return false;
  // Only server-provisioned exact paths qualify; export/unknown paths have no binding.
  return bindings.some(entry => entry.subjectId === request.subjectId
    && entry.deviceId === request.deviceId && entry.service === request.service
    && entry.path === request.path && typeof entry.resourceId === 'string'
    && entry.resourceId.startsWith(family + ':') && Array.isArray(entry.permissions)
    && entry.permissions.includes(request.method)
    && (family !== 'notices' || request.method !== 'PUT' || entry.instructor === true));
}

// Only trusted ALEPH engine requests under docs/DECIDER_REQUEST.md belong here.
export const RULE_IDS = Object.freeze(['starter.deny', 'device_registered', 'step_up_required', 'resource_scope']);

export async function decide(request) {
  const response = (decision, reasonCode, ruleId) => ({
    schema: 'aleph.decision.v1', requestId: request.requestId,
    decision, reasonCode, ruleIds: [ruleId],
  });
  // Missing values, strings and truthy objects are not registered devices.
  if (request.deviceRegistered !== true) {
    return response('deny', 'device_not_registered', 'device_registered');
  }
  // These fields are accepted only from the engine contract, never HTTP headers.
  const signals = request.signals;
  const fixture = signals?.source === 'judge_fixture';
  const unavailable = signals?.source === 'none' && signals.region === 'unknown'
    && signals.network === 'unknown';
  const fixtureValid = fixture && ['local', 'foreign'].includes(signals.region)
    && ['usual', 'unusual'].includes(signals.network)
    && Number.isInteger(signals.hour) && signals.hour >= 0 && signals.hour <= 23;
  const events = request.recentEvents;
  const eventsValid = Array.isArray(events) && events.length <= 12
    && events.every(event => event && typeof event.kind === 'string'
      && Number.isInteger(event.count) && event.count >= 0
      && Number.isFinite(event.ageSeconds) && event.ageSeconds >= 0);
  if ((!fixtureValid && !unavailable) || !eventsValid) {
    return response('step_up', 'step_up_required', 'step_up_required');
  }
  const volume = events.some(event => event.kind === 'risk_signal'
    && event.ageSeconds <= 300 && event.count >= 10);
  // Region alone never causes denial. Require at least two independent fixture signals.
  const riskCount = fixtureValid ? Number(signals.region === 'foreign')
    + Number(signals.network === 'unusual')
    + Number(signals.hour < 6 || signals.hour >= 23) + Number(volume) : 0;
  const verified = request.stepUp?.verified === true
    && Number.isInteger(request.stepUp.authAgeSeconds)
    && request.stepUp.authAgeSeconds >= 0 && request.stepUp.authAgeSeconds <= 900;
  if (riskCount >= 2 && !verified) {
    return response('step_up', 'step_up_required', 'step_up_required');
  }
  if (resourceAllowed(request)) return response('allow', 'approved', 'resource_scope');
  return response('deny', 'starter_not_ready', 'resource_scope');
}
