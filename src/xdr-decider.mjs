import { decide as baseDecide } from './decider.mjs';
import { createGuard, loadRules } from '../xdr/brute-force/connect.mjs';
// Optional gateway entry point. Original request contract and base rules remain intact.
export const decideWithXdr = createGuard(baseDecide, loadRules);
