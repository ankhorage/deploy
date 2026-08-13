import type { StoreListingField } from './StoreListingField';
import type { StoreListingLocale } from './StoreListingLocale';

export function storeListingLocaleFieldValue(
  listing: StoreListingLocale,
  field: StoreListingField,
): string | readonly string[] | undefined {
  return listing[field];
}
