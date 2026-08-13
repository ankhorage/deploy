import type { StoreListingField } from '../../domain/storeListing/StoreListingField';

export const GOOGLE_PLAY_STORE_LISTING_FIELDS = [
  'name',
  'summary',
  'description',
  'promoVideoUrl',
] as const satisfies readonly StoreListingField[];
