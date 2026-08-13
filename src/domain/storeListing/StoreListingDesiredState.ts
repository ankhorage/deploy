import type { StoreListingAsset } from './StoreListingAsset';
import type { StoreListingLocale } from './StoreListingLocale';

export interface StoreListingDesiredState {
  readonly revision: string;
  readonly locales: readonly StoreListingLocale[];
  readonly assets: readonly StoreListingAsset[];
}
