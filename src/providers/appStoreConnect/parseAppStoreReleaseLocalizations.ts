import type { AppStoreReleaseLocalizationResource } from './AppStoreReleaseLocalizationResource';

export function parseAppStoreReleaseLocalizations(
  value: unknown,
): readonly AppStoreReleaseLocalizationResource[] | null {
  if (!isRecord(value) || !Array.isArray(value.data)) return null;
  const result: AppStoreReleaseLocalizationResource[] = [];
  for (const item of value.data as unknown[]) {
    const localization = parseLocalization(item);
    if (localization === null) return null;
    result.push(localization);
  }
  return result.sort((left, right) => left.locale.localeCompare(right.locale));
}

function parseLocalization(value: unknown): AppStoreReleaseLocalizationResource | null {
  if (!isRecord(value) || value.type !== 'appStoreVersionLocalizations') return null;
  if (!isNonEmptyString(value.id) || !isRecord(value.attributes)) return null;
  const locale = normalizeLocale(value.attributes.locale);
  if (locale === null) return null;
  const { whatsNew } = value.attributes;
  if (whatsNew !== null && whatsNew !== undefined && typeof whatsNew !== 'string') return null;
  return { resourceId: value.id, locale, whatsNew: whatsNew ?? null };
}

function normalizeLocale(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  try {
    return Intl.getCanonicalLocales(value)[0] ?? null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
