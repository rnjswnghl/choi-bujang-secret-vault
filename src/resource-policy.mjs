// Server-owned bindings only. Engine subject IDs must never be equated with Auth UUIDs.
// The default binding reproduces the existing public local-practice fixture, not a real user.
const fixtureBindings = [{ subjectId: 'learner_fixture', deviceId: 'aaaaaaaaaaaaaaaa',
  service: 'notes', path: '/notes/demo', resourceId: 'notes:demo', permissions: ['GET','PUT'] }];
export function loadResourceBindings() {
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
