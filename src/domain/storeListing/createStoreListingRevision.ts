import { createHash } from 'node:crypto';

import type { StoreListingAsset } from './StoreListingAsset';
import type { StoreListingLocale } from './StoreListingLocale';

export function createStoreListingRevision(input: {
  readonly locales: readonly StoreListingLocale[];
  readonly assets: readonly StoreListingAsset[];
}): string {
  const value = JSON.stringify({ locales: input.locales, assets: input.assets });
  return createHash('sha256').update(value).digest('hex');
}
