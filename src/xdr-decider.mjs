import { decide as baseDecide } from './decider.mjs';
import { createGuard, loadRules as loadBruteForce } from '../xdr/brute-force/connect.mjs';
import { loadRules as loadWebInjection } from '../xdr/web-injection/connect.mjs';
import { loadRules as loadKnownCve } from '../xdr/known-cve/respond.mjs';
import { loadRules as loadPersistence } from '../xdr/persistence/respond.mjs';
import { createGuard as createPrivilegeGuard, loadRules as loadPrivilege } from '../xdr/privilege/respond.mjs';
import { createGuard as createExfiltrationGuard, loadRules as loadExfiltration } from '../xdr/exfiltration/respond.mjs';
// Trusted gateway sourceIp only; base rules and original request contract remain intact.
const decideWithIpRules = createGuard(baseDecide, async () => [...await loadBruteForce(), ...await loadWebInjection(), ...await loadKnownCve(), ...await loadPersistence()]);
const decideWithAccountRules = createPrivilegeGuard(decideWithIpRules, loadPrivilege);
export const decideWithXdr = createExfiltrationGuard(decideWithAccountRules, loadExfiltration);
