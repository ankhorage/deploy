import type { StoreListingLocale } from '../../domain/storeListing/StoreListingLocale';
import type { AppStoreListingContext } from './AppStoreListingContext';

export function toAppStoreCurrentLocales(
  context: AppStoreListingContext,
): readonly StoreListingLocale[] {
  return context.locales.flatMap(toCurrentLocale);
}

function toCurrentLocale(
  item: AppStoreListingContext['locales'][number],
): StoreListingLocale[] {
  if (item.appInfoLocalizationId === undefined || item.versionLocalizationId === undefined) return [];
  if (item.name === undefined) return [];
  const keywords = item.keywords
    ?.split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return [{
    locale: item.canonicalLocale,
    name: item.name,
    ...(item.summary === undefined ? {} : { summary: item.summary }),
    ...(item.description === undefined ? {} : { description: item.description }),
    ...(keywords === undefined ? {} : { keywords }),
    ...(item.promotionalText === undefined ? {} : { promotionalText: item.promotionalText }),
    ...(item.supportUrl === undefined ? {} : { supportUrl: item.supportUrl }),
    ...(item.marketingUrl === undefined ? {} : { marketingUrl: item.marketingUrl }),
    ...(item.privacyPolicyUrl === undefined ? {} : { privacyPolicyUrl: item.privacyPolicyUrl }),
  }];
}
