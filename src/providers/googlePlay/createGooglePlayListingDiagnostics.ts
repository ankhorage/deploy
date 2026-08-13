import type { StoreListingDesiredState } from '../../domain/storeListing/StoreListingDesiredState';
import type { StoreListingDiagnostic } from '../../domain/storeListing/StoreListingDiagnostic';
import type { StoreListingField } from '../../domain/storeListing/StoreListingField';
import { storeListingLocaleFieldValue } from '../../domain/storeListing/storeListingLocaleFieldValue';
import { GOOGLE_PLAY_STORE_LISTING_FIELDS } from './googlePlayStoreListingFields';
import { mapGooglePlayImageType } from './mapGooglePlayImageType';

const ALL_FIELDS: readonly StoreListingField[] = [
  'name',
  'summary',
  'description',
  'keywords',
  'promotionalText',
  'supportUrl',
  'marketingUrl',
  'privacyPolicyUrl',
  'promoVideoUrl',
];

export function createGooglePlayListingDiagnostics(
  desired: StoreListingDesiredState,
): readonly StoreListingDiagnostic[] {
  return [
    ...desired.locales.flatMap(localeDiagnostics),
    ...desired.assetSets.flatMap(assetSetDiagnostics),
  ];
}

function localeDiagnostics(
  locale: StoreListingDesiredState['locales'][number],
): StoreListingDiagnostic[] {
  const supported = new Set<StoreListingField>(GOOGLE_PLAY_STORE_LISTING_FIELDS);
  return ALL_FIELDS.flatMap((field) => {
    if (supported.has(field) || storeListingLocaleFieldValue(locale, field) === undefined)
      return [];
    return [
      {
        severity: 'warning',
        code: 'GOOGLE_PLAY_LISTING_FIELD_UNSUPPORTED',
        message: `Google Play does not synchronize ${field}.`,
        target: 'android',
        locale: locale.locale,
        field,
      },
    ];
  });
}

function assetSetDiagnostics(
  set: StoreListingDesiredState['assetSets'][number],
): StoreListingDiagnostic[] {
  if (set.target !== 'android' || mapGooglePlayImageType(set.variant) !== null) return [];
  return [
    {
      severity: 'error',
      code: 'GOOGLE_PLAY_IMAGE_VARIANT_UNSUPPORTED',
      message: `Google Play image variant ${set.variant} is unsupported.`,
      target: 'android',
      locale: set.locale,
      variant: set.variant,
    },
  ];
}
