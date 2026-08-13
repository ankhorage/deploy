import type { StoreListingAsset } from '../../domain/storeListing/StoreListingAsset';

export interface ProjectStoreListingAsset extends StoreListingAsset {
  readonly sourcePath: string;
}
