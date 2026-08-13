import type { StoreListingDesiredState } from '../../domain/storeListing/StoreListingDesiredState';
import type { AppStoreListingLocaleResource } from './AppStoreListingContext';
import { mapAppStoreLocale } from './mapAppStoreLocale';

interface LayerLocalization {
  readonly id: string;
  readonly locale: string;
  readonly attributes: Record<string, unknown>;
}

export function parseAppStoreListingLocalizations(options: {
  readonly appInfo: unknown;
  readonly version: unknown;
  readonly desired: StoreListingDesiredState;
}): readonly AppStoreListingLocaleResource[] | null {
  const appInfo = parseLayer(options.appInfo, 'appInfoLocalizations');
  const version = parseLayer(options.version, 'appStoreVersionLocalizations');
  if (appInfo === null || version === null) return null;
  return options.desired.locales.map((locale) => mergeLocale(locale.locale, appInfo, version));
}

function mergeLocale(
  canonicalLocale: string,
  appInfo: readonly LayerLocalization[],
  version: readonly LayerLocalization[],
): AppStoreListingLocaleResource {
  const providerLocale = mapAppStoreLocale(canonicalLocale) ?? canonicalLocale;
  const info = appInfo.find((item) => item.locale === providerLocale);
  const ver = version.find((item) => item.locale === providerLocale);
  return {
    canonicalLocale,
    providerLocale,
    ...(info === undefined ? {} : appInfoProperties(info)),
    ...(ver === undefined ? {} : versionProperties(ver)),
  };
}

function parseLayer(value: unknown, type: string): readonly LayerLocalization[] | null {
  if (!isRecord(value) || !Array.isArray(value.data)) return null;
  const result: LayerLocalization[] = [];
  for (const item of value.data as unknown[]) {
    if (!isRecord(item) || item.type !== type || !isNonEmptyString(item.id)) return null;
    if (!isRecord(item.attributes) || !isNonEmptyString(item.attributes.locale)) return null;
    result.push({ id: item.id, locale: item.attributes.locale, attributes: item.attributes });
  }
  return result;
}

function appInfoProperties(item: LayerLocalization): Partial<AppStoreListingLocaleResource> {
  const name = readString(item.attributes.name);
  const summary = readString(item.attributes.subtitle);
  const privacyPolicyUrl = readString(item.attributes.privacyPolicyUrl);
  return {
    appInfoLocalizationId: item.id,
    ...(name === undefined ? {} : { name }),
    ...(summary === undefined ? {} : { summary }),
    ...(privacyPolicyUrl === undefined ? {} : { privacyPolicyUrl }),
  };
}

function versionProperties(item: LayerLocalization): Partial<AppStoreListingLocaleResource> {
  const description = readString(item.attributes.description);
  const keywords = readString(item.attributes.keywords);
  const promotionalText = readString(item.attributes.promotionalText);
  const supportUrl = readString(item.attributes.supportUrl);
  const marketingUrl = readString(item.attributes.marketingUrl);
  return {
    versionLocalizationId: item.id,
    ...(description === undefined ? {} : { description }),
    ...(keywords === undefined ? {} : { keywords }),
    ...(promotionalText === undefined ? {} : { promotionalText }),
    ...(supportUrl === undefined ? {} : { supportUrl }),
    ...(marketingUrl === undefined ? {} : { marketingUrl }),
  };
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
