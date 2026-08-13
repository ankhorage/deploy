import type { StoreListingLocale } from '../../domain/storeListing/StoreListingLocale';
import type { ProjectStoreListingAssetSet } from './ProjectStoreListingAssetSet';

export interface ProjectStoreListing {
  readonly revision: string;
  readonly locales: readonly StoreListingLocale[];
  readonly assetSets: readonly ProjectStoreListingAssetSet[];
}
