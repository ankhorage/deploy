export function normalizeStoreListingLocale(value: string): string | null {
  if (value.trim().length === 0 || value.includes('_')) return null;
  try {
    const [normalized] = Intl.getCanonicalLocales(value);
    return normalized ?? null;
  } catch {
    return null;
  }
}
