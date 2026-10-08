import { decide as baseDecide } from './decider.mjs';
import { createGuard, loadRules as loadBruteForce } from '../xdr/brute-force/connect.mjs';
import { loadRules as loadWebInjection } from '../xdr/web-injection/connect.mjs';
// Trusted gateway sourceIp only; base rules and original request contract remain intact.
export const decideWithXdr = createGuard(baseDecide, async () => [...await loadBruteForce(), ...await loadWebInjection()]);
