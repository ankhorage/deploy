import type { StoreListingDiagnostic } from './StoreListingDiagnostic';
import type { StoreListingField } from './StoreListingField';
import type { StoreListingLocale } from './StoreListingLocale';
import type { StoreListingRemoteAssetSet } from './StoreListingRemoteAssetSet';
import type { StoreListingTarget } from './StoreListingTarget';

export interface StoreListingTargetState {
  readonly target: StoreListingTarget;
  readonly locales: readonly StoreListingLocale[];
  readonly assetSets: readonly StoreListingRemoteAssetSet[];
  readonly supportedFields: readonly StoreListingField[];
  readonly diagnostics: readonly StoreListingDiagnostic[];
}
