import type { StoreListingAsset } from './StoreListingAsset';
import type { StoreListingTarget } from './StoreListingTarget';

export interface StoreListingAssetSet {
  readonly target: StoreListingTarget;
  readonly locale: string;
  readonly variant: string;
  readonly assets: readonly StoreListingAsset[];
}
