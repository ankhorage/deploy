import type { StoreListingTarget } from '../../domain/storeListing/StoreListingTarget';
import type { ProjectStoreListingAsset } from './ProjectStoreListingAsset';

export interface ProjectStoreListingAssetSet {
  readonly target: StoreListingTarget;
  readonly locale: string;
  readonly variant: string;
  readonly assets: readonly ProjectStoreListingAsset[];
}
