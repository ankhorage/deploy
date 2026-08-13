import { createHash } from 'node:crypto';

import type { StoreListingAsset } from '../../domain/storeListing/StoreListingAsset';
import type { StoreListingLocale } from '../../domain/storeListing/StoreListingLocale';
import type { ProjectStoreListingAsset } from './ProjectStoreListingAsset';
import type { ProjectStoreListingAssetSet } from './ProjectStoreListingAssetSet';

export function createProjectStoreListingRevision(
  locales: readonly StoreListingLocale[],
  assetSets: readonly ProjectStoreListingAssetSet[],
): string {
  const value = {
    locales: locales.slice().sort((a, b) => a.locale.localeCompare(b.locale)),
    assetSets: assetSets.slice().sort(compareSets).map(toCanonicalSet),
  };
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function toCanonicalSet(set: ProjectStoreListingAssetSet) {
  return {
    target: set.target,
    locale: set.locale,
    variant: set.variant,
    assets: set.assets.map(toCanonicalAsset),
  };
}

function toCanonicalAsset(asset: ProjectStoreListingAsset): StoreListingAsset {
  const { sourcePath: _sourcePath, ...canonical } = asset;
  return canonical;
}

function compareSets(a: ProjectStoreListingAssetSet, b: ProjectStoreListingAssetSet): number {
  return `${a.target}:${a.locale}:${a.variant}`.localeCompare(`${b.target}:${b.locale}:${b.variant}`);
}
