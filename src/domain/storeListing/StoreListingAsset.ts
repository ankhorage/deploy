export type StoreListingTarget = 'android' | 'ios';
export type StoreListingAssetKind = 'icon' | 'feature' | 'screenshot';

export interface StoreListingAsset {
  readonly target: StoreListingTarget;
  readonly kind: StoreListingAssetKind;
  readonly locale: string | null;
  readonly variant: string | null;
  readonly relativePath: string;
  readonly sha256: string;
  readonly md5: string;
  readonly size: number;
}
