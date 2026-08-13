import type { StoreListingLocale } from '../../domain/storeListing/StoreListingLocale';
import { normalizeStoreListingLocale } from '../../domain/storeListing/normalizeStoreListingLocale';

export function parseGooglePlayListings(
  value: unknown,
  desiredLocales: ReadonlySet<string>,
): readonly StoreListingLocale[] | null {
  if (!isRecord(value) || !Array.isArray(value.listings)) return null;
  const result: StoreListingLocale[] = [];
  for (const entry of value.listings as unknown[]) {
    const parsed = parseListing(entry);
    if (parsed === null) return null;
    if (desiredLocales.has(parsed.locale)) result.push(parsed);
  }
  return result.sort((a, b) => a.locale.localeCompare(b.locale));
}

function parseListing(value: unknown): StoreListingLocale | null {
  if (!isRecord(value) || !isNonEmptyString(value.language) || !isNonEmptyString(value.title)) {
    return null;
  }
  const locale = parseLocale(value.language);
  if (locale === null) return null;
  const summary = typeof value.shortDescription === 'string' ? value.shortDescription : undefined;
  const description = typeof value.fullDescription === 'string' ? value.fullDescription : undefined;
  const promoVideoUrl = typeof value.video === 'string' ? value.video : undefined;
  return {
    locale,
    name: value.title,
    ...(summary === undefined ? {} : { summary }),
    ...(description === undefined ? {} : { description }),
    ...(promoVideoUrl === undefined ? {} : { promoVideoUrl }),
  };
}

function parseLocale(value: string): string | null {
  try {
    return normalizeStoreListingLocale(value);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
