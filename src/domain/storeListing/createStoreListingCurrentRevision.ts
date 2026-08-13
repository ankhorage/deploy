import { createHash } from 'node:crypto';

import type { StoreListingRemoteAssetSet } from './StoreListingRemoteAssetSet';
import type { StoreListingTargetState } from './StoreListingTargetState';

export function createStoreListingCurrentRevision(
  states: readonly StoreListingTargetState[],
): string {
  const canonical = states
    .slice()
    .sort((a, b) => a.target.localeCompare(b.target))
    .map((state) => ({
      target: state.target,
      locales: state.locales.slice().sort((a, b) => a.locale.localeCompare(b.locale)),
      assetSets: state.assetSets.slice().sort(compareAssetSets),
    }));
  return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

function compareAssetSets(a: StoreListingRemoteAssetSet, b: StoreListingRemoteAssetSet): number {
  return `${a.locale}:${a.variant}`.localeCompare(`${b.locale}:${b.variant}`);
}
