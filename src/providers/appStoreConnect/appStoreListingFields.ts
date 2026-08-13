import type { StoreListingField } from '../../domain/storeListing/StoreListingField';

export const APP_STORE_LISTING_FIELDS = [
  'name',
  'summary',
  'description',
  'keywords',
  'promotionalText',
  'supportUrl',
  'marketingUrl',
  'privacyPolicyUrl',
] as const satisfies readonly StoreListingField[];
