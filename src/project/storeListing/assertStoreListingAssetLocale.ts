import { normalizeStoreListingLocale } from '../../domain/storeListing/normalizeStoreListingLocale';
import { readStoreListingLocales } from './readStoreListingLocales';

export async function assertStoreListingAssetLocale(
  listingRoot: string,
  localeValue: string,
): Promise<void> {
  const locale = normalizeStoreListingLocale(localeValue);
  const locales = await readStoreListingLocales(listingRoot);
  if (!locales.some((candidate) => candidate.locale === locale)) {
    throw new Error('STORE_LISTING_ASSET_LOCALE_UNKNOWN');
  }
}
