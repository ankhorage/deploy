import type { StoreListingLocale } from '../../domain/storeListing/StoreListingLocale';
import { normalizeStoreListingLocale } from '../../domain/storeListing/normalizeStoreListingLocale';
import { hasOnlyKeys } from '../io/hasOnlyKeys';
import { isRecord } from '../io/isRecord';

const KEYS = [
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
] as const;

export function parseStoreListingLocale(value: unknown, filenameLocale: string): StoreListingLocale {
  if (!isRecord(value) || !hasOnlyKeys(value, KEYS)) throw invalid(filenameLocale);
  const locale = normalizeStoreListingLocale(filenameLocale);
  if (locale === null || !isNonEmptyString(value.name)) throw invalid(filenameLocale);
  validateDeclaredLocale(value.locale, locale);
  const result: StoreListingLocale = { locale, name: value.name };
  return withOptionalFields(result, value, filenameLocale);
}

function withOptionalFields(
  base: StoreListingLocale,
  value: Record<string, unknown>,
  locale: string,
): StoreListingLocale {
  const strings = ['summary', 'description', 'promotionalText', 'supportUrl', 'marketingUrl', 'privacyPolicyUrl', 'promoVideoUrl'] as const;
  const result: Record<string, unknown> = { ...base };
  for (const key of strings) {
    if (value[key] === undefined) continue;
    if (typeof value[key] !== 'string') throw invalid(locale);
    result[key] = value[key];
  }
  if (value.keywords !== undefined) result.keywords = parseKeywords(value.keywords, locale);
  return result as unknown as StoreListingLocale;
}

function validateDeclaredLocale(value: unknown, expected: string): void {
  if (value === undefined) return;
  if (typeof value !== 'string' || normalizeStoreListingLocale(value) !== expected) throw invalid(expected);
}

function parseKeywords(value: unknown, locale: string): readonly string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) throw invalid(locale);
  return value as string[];
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalid(locale: string): Error {
  return new Error(`Invalid store listing locale: ${locale}`);
}
