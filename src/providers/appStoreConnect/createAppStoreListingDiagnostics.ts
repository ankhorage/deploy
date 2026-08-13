import type { StoreListingDesiredState } from '../../domain/storeListing/StoreListingDesiredState';
import type { StoreListingDiagnostic } from '../../domain/storeListing/StoreListingDiagnostic';
import type { StoreListingField } from '../../domain/storeListing/StoreListingField';
import { storeListingLocaleFieldValue } from '../../domain/storeListing/storeListingLocaleFieldValue';
import { APP_STORE_LISTING_FIELDS } from './appStoreListingFields';
import { isAppStoreScreenshotVariant } from './isAppStoreScreenshotVariant';
import { mapAppStoreLocale } from './mapAppStoreLocale';

const ALL_FIELDS: readonly StoreListingField[] = [
  'name', 'summary', 'description', 'keywords', 'promotionalText',
  'supportUrl', 'marketingUrl', 'privacyPolicyUrl', 'promoVideoUrl',
];

export function createAppStoreListingDiagnostics(
  desired: StoreListingDesiredState,
): readonly StoreListingDiagnostic[] {
  return [
    ...localeDiagnostics(desired),
    ...desired.assetSets.flatMap(assetSetDiagnostics),
  ];
}

function localeDiagnostics(desired: StoreListingDesiredState): StoreListingDiagnostic[] {
  const diagnostics = desired.locales.flatMap(fieldAndLocaleDiagnostics);
  const seen = new Map<string, string>();
  for (const locale of desired.locales) {
    const mapped = mapAppStoreLocale(locale.locale);
    if (mapped === null) continue;
    const previous = seen.get(mapped);
    if (previous !== undefined && previous !== locale.locale) {
      diagnostics.push(duplicateLocaleDiagnostic(locale.locale, mapped));
    }
    seen.set(mapped, locale.locale);
  }
  return diagnostics;
}

function fieldAndLocaleDiagnostics(
  locale: StoreListingDesiredState['locales'][number],
): StoreListingDiagnostic[] {
  if (mapAppStoreLocale(locale.locale) === null) {
    return [{
      severity: 'error', code: 'APP_STORE_LOCALE_UNSUPPORTED',
      message: `App Store Connect does not support locale ${locale.locale}.`,
      target: 'ios', locale: locale.locale,
    }];
  }
  const supported = new Set<StoreListingField>(APP_STORE_LISTING_FIELDS);
  return ALL_FIELDS.flatMap((field) => {
    if (supported.has(field) || storeListingLocaleFieldValue(locale, field) === undefined) return [];
    return [{
      severity: 'warning', code: 'APP_STORE_LISTING_FIELD_UNSUPPORTED',
      message: `App Store Connect does not synchronize ${field}.`,
      target: 'ios', locale: locale.locale, field,
    }];
  });
}

function duplicateLocaleDiagnostic(locale: string, mapped: string): StoreListingDiagnostic {
  return {
    severity: 'error', code: 'APP_STORE_LOCALE_COLLISION',
    message: `Locale ${locale} maps to duplicate App Store locale ${mapped}.`,
    target: 'ios', locale,
  };
}

function assetSetDiagnostics(
  set: StoreListingDesiredState['assetSets'][number],
): StoreListingDiagnostic[] {
  if (set.target !== 'ios' || isAppStoreScreenshotVariant(set.variant)) return [];
  return [{
    severity: 'error', code: 'APP_STORE_SCREENSHOT_VARIANT_UNSUPPORTED',
    message: `App Store screenshot variant ${set.variant} is unsupported.`,
    target: 'ios', locale: set.locale, variant: set.variant,
  }];
}
