export type StoreListingAssetMediaType = 'image/jpeg' | 'image/png';

export interface StoreListingAsset {
  readonly relativePath: string;
  readonly sha256: string;
  readonly md5: string;
  readonly size: number;
  readonly mediaType: StoreListingAssetMediaType;
}
