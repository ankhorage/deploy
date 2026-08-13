import { createHash } from 'node:crypto';

import type { MonetizationProduct } from '../../domain/monetization/MonetizationProduct';

export function createProjectMonetizationRevision(
  products: readonly MonetizationProduct[],
): string {
  return createHash('sha256').update(JSON.stringify(products)).digest('hex');
}
