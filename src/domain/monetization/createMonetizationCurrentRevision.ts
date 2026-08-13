import { createHash } from 'node:crypto';

import type { MonetizationTargetState } from './MonetizationTargetState';

export function createMonetizationCurrentRevision(
  states: readonly MonetizationTargetState[],
): string {
  const canonical = states
    .slice()
    .sort((a, b) => a.target.localeCompare(b.target))
    .map((state) => ({
      target: state.target,
      subscriptionFamilies: state.subscriptionFamilies.slice().sort(),
      products: state.products.slice().sort((a, b) => a.id.localeCompare(b.id)),
    }));
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}
