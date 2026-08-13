import { normalizeStoreListingLocale } from '../../domain/storeListing/normalizeStoreListingLocale';
import type { StoreListingLocale } from '../../domain/storeListing/StoreListingLocale';
import { hasOnlyKeys } from '../io/hasOnlyKeys';
import { isRecord } from '../io/isRecord';

const KEYS = new Set([
  'locale',
  'name',
  'summary',
  'description',
  'keywords',
  'promotionalText',
  'supportUrl',
  'marketingUrl',
  'privacyPolicyUrl',
  'promoVideoUrl',
]);

export function parseStoreListingLocale(
  value: unknown,
  filenameLocale: string,
): StoreListingLocale {
  if (!isRecord(value) || !hasOnlyKeys(value, KEYS)) throw invalid();
  const locale = normalizeStoreListingLocale(filenameLocale);
  if (value.locale !== undefined && normalizeLocale(value.locale) !== locale) throw invalid();
  if (!isNonEmptyString(value.name)) throw invalid();
  return {
    locale,
    name: value.name,
    ...optionalString('summary', value.summary),
    ...optionalString('description', value.description),
    ...optionalKeywords(value.keywords),
    ...optionalString('promotionalText', value.promotionalText),
    ...optionalUrl('supportUrl', value.supportUrl),
    ...optionalUrl('marketingUrl', value.marketingUrl),
    ...optionalUrl('privacyPolicyUrl', value.privacyPolicyUrl),
    ...optionalUrl('promoVideoUrl', value.promoVideoUrl),
  };
}

function optionalKeywords(value: unknown): Pick<StoreListingLocale, 'keywords'> {
  if (value === undefined) return {};
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) throw invalid();
  return { keywords: value };
}

function optionalString<K extends keyof StoreListingLocale>(
  key: K,
  value: unknown,
): Partial<Pick<StoreListingLocale, K>> {
  if (value === undefined) return {};
  if (typeof value !== 'string') throw invalid();
  return { [key]: value } as Partial<Pick<StoreListingLocale, K>>;
}

function optionalUrl<K extends keyof StoreListingLocale>(
  key: K,
  value: unknown,
): Partial<Pick<StoreListingLocale, K>> {
  const result = optionalString(key, value);
  if (value === undefined || value === '') return result;
  try {
    const parsed = new URL(value as string);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw invalid();
  } catch {
    throw invalid();
  }
  return result;
}

function normalizeLocale(value: unknown): string {
  if (typeof value !== 'string') throw invalid();
  return normalizeStoreListingLocale(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalid(): Error {
  return new Error('STORE_LISTING_LOCALE_INVALID');
}
