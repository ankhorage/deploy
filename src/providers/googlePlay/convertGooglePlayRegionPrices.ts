import type { MonetizationBasePrice } from '../../domain/monetization/MonetizationBasePrice';
import { googlePlayMonetizationUrls } from './googlePlayMonetizationUrls';
import type { GooglePlayPriceConversion } from './GooglePlayPriceConversion';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { toGooglePlayMoney } from './toGooglePlayMoney';

export async function convertGooglePlayRegionPrices(options: {
  readonly packageName: string;
  readonly basePrice: MonetizationBasePrice;
  readonly token: string;
  readonly request: GooglePlayTransport;
}): Promise<GooglePlayPriceConversion | null> {
  const response = await options.request({
    method: 'POST',
    url: googlePlayMonetizationUrls.convertPrices(options.packageName),
    token: options.token,
    contentType: 'application/json',
    body: JSON.stringify({ price: toGooglePlayMoney(options.basePrice) }),
  });
  if (response.status < 200 || response.status >= 300) return null;
  try {
    return parseConversion(JSON.parse(response.body) as unknown);
  } catch {
    return null;
  }
}

function parseConversion(value: unknown): GooglePlayPriceConversion | null {
  if (!isRecord(value) || !isRecord(value.regionVersion)) return null;
  const { version } = value.regionVersion;
  return isNonEmptyString(version) ? { regionVersion: version } : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
