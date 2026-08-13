import type { StoreListingLocale } from '../../domain/storeListing/StoreListingLocale';
import type { StoreListingPlanOperation } from '../../domain/storeListing/StoreListingPlanStep';
import { googlePlayListingUrl } from './googlePlayListingUrls';
import type { GooglePlayTransport } from './GooglePlayTransport';

export async function writeGooglePlayListing(options: {
  readonly packageName: string;
  readonly editId: string;
  readonly token: string;
  readonly operation: StoreListingPlanOperation;
  readonly listing: StoreListingLocale;
  readonly request: GooglePlayTransport;
}): Promise<boolean> {
  const response = await options.request({
    method: options.operation === 'create-locale' ? 'PUT' : 'PATCH',
    url: googlePlayListingUrl(options.packageName, options.editId, options.listing.locale),
    token: options.token,
    contentType: 'application/json',
    body: JSON.stringify(toGooglePlayListing(options.listing)),
  });
  return response.status >= 200 && response.status < 300;
}

function toGooglePlayListing(listing: StoreListingLocale): Record<string, string> {
  return {
    language: listing.locale,
    title: listing.name,
    ...(listing.summary === undefined ? {} : { shortDescription: listing.summary }),
    ...(listing.description === undefined ? {} : { fullDescription: listing.description }),
    ...(listing.promoVideoUrl === undefined ? {} : { video: listing.promoVideoUrl }),
  };
}
