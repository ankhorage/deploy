import type { StoreListingDesiredState } from '../../domain/storeListing/StoreListingDesiredState';
import type { StoreListingRemoteAssetSet } from '../../domain/storeListing/StoreListingRemoteAssetSet';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { listGooglePlayImageHashes } from './listGooglePlayImageHashes';
import { mapGooglePlayImageType } from './mapGooglePlayImageType';

export async function readGooglePlayAssetSets(options: {
  readonly packageName: string;
  readonly editId: string;
  readonly desired: StoreListingDesiredState;
  readonly token: string;
  readonly request: GooglePlayTransport;
}): Promise<readonly StoreListingRemoteAssetSet[] | null> {
  const sets: StoreListingRemoteAssetSet[] = [];
  for (const group of desiredAssetGroups(options.desired)) {
    const imageType = mapGooglePlayImageType(group.variant);
    if (imageType === null) continue;
    const hashes = await listGooglePlayImageHashes({
      ...options,
      locale: group.locale,
      imageType,
    });
    if (hashes === null) return null;
    sets.push({
      target: 'android',
      locale: group.locale,
      variant: group.variant,
      checksum: 'sha256',
      hashes,
    });
  }
  return sets;
}

function desiredAssetGroups(
  desired: StoreListingDesiredState,
): { locale: string; variant: string }[] {
  return desired.assetSets
    .filter((set) => set.target === 'android')
    .map((set) => ({ locale: set.locale, variant: set.variant }))
    .sort((a, b) => `${a.locale}:${a.variant}`.localeCompare(`${b.locale}:${b.variant}`));
}
