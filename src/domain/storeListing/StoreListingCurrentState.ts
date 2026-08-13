import type { StoreListingAsset, StoreListingTarget } from './StoreListingAsset';
import type { StoreListingField } from './StoreListingField';
import type { StoreListingLocale } from './StoreListingLocale';

export interface StoreListingCurrentAsset extends StoreListingAsset {
  readonly remoteChecksum: string;
  readonly checksumAlgorithm: 'sha256' | 'md5';
}

export interface StoreListingTargetCurrentState {
  readonly target: StoreListingTarget;
  readonly supportedFields: readonly StoreListingField[];
  readonly locales: readonly StoreListingLocale[];
  readonly assets: readonly StoreListingCurrentAsset[];
}
