import type { StoreListingLocale } from '../../domain/storeListing/StoreListingLocale';
import { normalizeStoreListingLocale } from '../../domain/storeListing/normalizeStoreListingLocale';
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

export function parseStoreListingLocale(value: unknown, filenameLocale: string): StoreListingLocale {
  if (!isRecord(value) || !hasOnlyKeys(value, KEYS)) throw invalid(filenameLocale);
  const locale = normalizeStoreListingLocale(filenameLocale);
  if (locale === null || !isNonEmptyString(value.name)) throw invalid(filenameLocale);
  validateDeclaredLocale(value.locale, locale);
  return withOptionalFields({ locale, name: value.name }, value, filenameLocale);
}

function withOptionalFields(
  base: StoreListingLocale,
  value: Record<string, unknown>,
  locale: string,
): StoreListingLocale {
  return {
    ...base,
    ...optionalString(value, 'summary', locale),
    ...optionalString(value, 'description', locale),
    ...optionalKeywords(value.keywords, locale),
    ...optionalString(value, 'promotionalText', locale),
    ...optionalString(value, 'supportUrl', locale),
    ...optionalString(value, 'marketingUrl', locale),
    ...optionalString(value, 'privacyPolicyUrl', locale),
    ...optionalString(value, 'promoVideoUrl', locale),
  };
}

function optionalString(
  value: Record<string, unknown>,
  key: keyof StoreListingLocale,
  locale: string,
): Partial<StoreListingLocale> {
  const candidate = value[key];
  if (candidate === undefined) return {};
  if (typeof candidate !== 'string') throw invalid(locale);
  return { [key]: candidate };
}

function optionalKeywords(value: unknown, locale: string): Partial<StoreListingLocale> {
  if (value === undefined) return {};
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) throw invalid(locale);
  return { keywords: value };
}

function validateDeclaredLocale(value: unknown, expected: string): void {
  if (value === undefined) return;
  if (typeof value !== 'string' || normalizeStoreListingLocale(value) !== expected) throw invalid(expected);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalid(locale: string): Error {
  return new Error(`Invalid store listing locale: ${locale}`);
}
