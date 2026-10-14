// The engine verifies identity and device. Stored note ownership is checked by the API.
export function resourceAllowed(request) {
  if (request.schema !== 'aleph.decision.v1'
    || !['classId', 'projectId', 'subjectId'].every(key => typeof request[key] === 'string' && request[key].length > 0)
    || !/^[a-f0-9]{16}$/.test(request.deviceId ?? '')
    || request.queryLength !== 0 || typeof request.path !== 'string'
    || /[%?#\\]/.test(request.path)) return false;
  const service = request.service;
  if (!['notes', 'notices'].includes(service)) return false;
  const match = request.path.match(/^\/(notes|notices)\/([^/]+)$/);
  if (!match || match[1] !== service) return false;
  const id = match[2];
  // Functional endpoints must not be confused with resource IDs.
  if (['.', '..', 'export', 'all', 'bulk', 'batch', 'list', 'search', 'count'].includes(id.toLowerCase())) return false;
  const methods = service === 'notes' ? ['GET', 'PUT', 'DELETE'] : ['GET'];
  return methods.includes(request.method)
    && request.route === `${request.method} /${service}/:id`;
}

// Only trusted ALEPH engine requests under docs/DECIDER_REQUEST.md belong here.
export const RULE_IDS = Object.freeze(['device_registered', 'step_up_required', 'resource_scope']);

export async function decide(request) {
  const response = (decision, reasonCode, ruleId) => ({
    schema: 'aleph.decision.v1', requestId: request.requestId,
    decision, reasonCode, ruleIds: [ruleId],
  });
  // Missing values, strings and truthy objects are not registered devices.
  if (request.deviceRegistered !== true) {
    return response('deny', 'device_not_registered', 'device_registered');
  }
  if (!resourceAllowed(request)) return response('deny', 'resource_not_allowed', 'resource_scope');
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
  return response('allow', 'approved', 'resource_scope');
}
