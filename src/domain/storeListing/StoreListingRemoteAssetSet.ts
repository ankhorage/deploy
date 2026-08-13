import type { StoreListingTarget } from './StoreListingTarget';

export interface StoreListingRemoteAssetSet {
  readonly target: StoreListingTarget;
  readonly locale: string;
  readonly variant: string;
  readonly checksum: 'md5' | 'sha256';
  readonly hashes: readonly string[];
}
