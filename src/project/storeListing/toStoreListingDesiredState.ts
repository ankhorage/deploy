import type { StoreListingAsset } from '../../domain/storeListing/StoreListingAsset';
import type { StoreListingAssetSet } from '../../domain/storeListing/StoreListingAssetSet';
import type { StoreListingDesiredState } from '../../domain/storeListing/StoreListingDesiredState';
import type { ProjectStoreListing } from './ProjectStoreListing';
import type { ProjectStoreListingAsset } from './ProjectStoreListingAsset';
import type { ProjectStoreListingAssetSet } from './ProjectStoreListingAssetSet';

export function toStoreListingDesiredState(project: ProjectStoreListing): StoreListingDesiredState {
  return {
    revision: project.revision,
    locales: project.locales,
    assetSets: project.assetSets.map(toCanonicalSet),
  };
}

function toCanonicalSet(set: ProjectStoreListingAssetSet): StoreListingAssetSet {
  return { ...set, assets: set.assets.map(toCanonicalAsset) };
}

function toCanonicalAsset(asset: ProjectStoreListingAsset): StoreListingAsset {
  const { sourcePath: _sourcePath, ...canonical } = asset;
  return canonical;
}
