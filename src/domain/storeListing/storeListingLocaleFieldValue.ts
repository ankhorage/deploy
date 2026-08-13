import type { StoreListingField } from './StoreListingField';
import type { StoreListingLocale } from './StoreListingLocale';

export function storeListingLocaleFieldValue(
  listing: StoreListingLocale,
  field: StoreListingField,
): string | readonly string[] | undefined {
  switch (field) {
    case 'name':
      return listing.name;
    case 'summary':
      return listing.summary;
    case 'description':
      return listing.description;
    case 'keywords':
      return listing.keywords;
    case 'promotionalText':
      return listing.promotionalText;
    case 'supportUrl':
      return listing.supportUrl;
    case 'marketingUrl':
      return listing.marketingUrl;
    case 'privacyPolicyUrl':
      return listing.privacyPolicyUrl;
    case 'promoVideoUrl':
      return listing.promoVideoUrl;
  }
}
