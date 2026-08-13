import type { StoreListingAssetSet } from './StoreListingAssetSet';
import type { StoreListingLocale } from './StoreListingLocale';

export interface StoreListingDesiredState {
  readonly revision: string;
  readonly locales: readonly StoreListingLocale[];
  readonly assetSets: readonly StoreListingAssetSet[];
}
