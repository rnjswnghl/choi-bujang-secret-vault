// Only trusted ALEPH engine requests under docs/DECIDER_REQUEST.md belong here.
export const RULE_IDS = Object.freeze(['starter.deny', 'device_registered']);

export async function decide(request) {
  const response = (decision, reasonCode, ruleId) => ({
    schema: 'aleph.decision.v1', requestId: request.requestId,
    decision, reasonCode, ruleIds: [ruleId],
  });
  // Missing values, strings and truthy objects are not registered devices.
  if (request.deviceRegistered !== true) {
    return response('deny', 'device_not_registered', 'device_registered');
  }
  const notesRead = request.service === 'notes' && request.method === 'GET'
    && ((request.route === 'GET /notes' && request.path === '/notes')
      || (request.route === 'GET /notes/:id' && /^\/notes\/[^/]+$/.test(request.path ?? '')));
  if (notesRead) return response('allow', 'approved', 'device_registered');
  // Preserve the starter's deny for actions outside this step's notes-read scope.
  return response('deny', 'starter_not_ready', 'starter.deny');
}
