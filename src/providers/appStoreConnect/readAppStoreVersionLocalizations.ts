import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import type { AppStoreMonetizationLocalizationResource } from './AppStoreMonetizationSnapshot';
import { appStoreMonetizationUrls } from './appStoreMonetizationUrls';
import { readAppStoreCollection } from './readAppStoreCollection';

export async function readAppStoreVersionLocalizations(options: {
  readonly kind: 'iap' | 'subscription';
  readonly versionId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<readonly AppStoreMonetizationLocalizationResource[] | null> {
  const url =
    options.kind === 'iap'
      ? appStoreMonetizationUrls.iapVersionLocalizations(options.versionId)
      : appStoreMonetizationUrls.subscriptionVersionLocalizations(options.versionId);
  const page = await readAppStoreCollection({ ...options, url });
  if (page === null) return null;
  const result: AppStoreMonetizationLocalizationResource[] = [];
  for (const item of page.data) {
    const localization = parseLocalization(item);
    if (localization === null) return null;
    result.push(localization);
  }
  return result.sort((a, b) => a.locale.localeCompare(b.locale));
}

function parseLocalization(value: unknown): AppStoreMonetizationLocalizationResource | null {
  if (!isRecord(value) || !isString(value.id) || !isRecord(value.attributes)) return null;
  const locale = normalizeLocale(value.attributes.locale);
  const { name, description } = value.attributes;
  if (locale === null || !isString(name) || !isString(description)) return null;
  return { resourceId: value.id, locale, name, description };
}

function normalizeLocale(value: unknown): string | null {
  if (!isString(value)) return null;
  try {
    return Intl.getCanonicalLocales(value)[0] ?? null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
