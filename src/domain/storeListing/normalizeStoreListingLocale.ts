export function normalizeStoreListingLocale(value: string): string {
  const input = value.trim();
  if (input.length === 0) throw new Error('STORE_LISTING_LOCALE_INVALID');
  let locales: string[];
  try {
    locales = Intl.getCanonicalLocales(input);
  } catch {
    throw new Error('STORE_LISTING_LOCALE_INVALID');
  }
  const locale = locales.at(0);
  if (locales.length !== 1 || locale === undefined) {
    throw new Error('STORE_LISTING_LOCALE_INVALID');
  }
  return locale;
}
