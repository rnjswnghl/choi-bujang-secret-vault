import { resourceAllowed } from './resource-policy.mjs';
// Only trusted ALEPH engine requests under docs/DECIDER_REQUEST.md belong here.
export const RULE_IDS = Object.freeze(['starter.deny', 'device_registered', 'step_up_required', 'resource_scoped']);

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
  if (resourceAllowed(request)) return response('allow', 'approved', 'resource_scoped');
  return response('deny', 'starter_not_ready', 'resource_scoped');
}
