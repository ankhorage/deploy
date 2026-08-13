import type { MonetizationBasePrice } from '../../domain/monetization/MonetizationBasePrice';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreMonetizationUrls } from './appStoreMonetizationUrls';
import type { AppStoreResolvedPricePoint } from './AppStoreResolvedPricePoint';
import { readAppStoreJson } from './readAppStoreJson';
import { toAppStoreTerritoryCode } from './toAppStoreTerritoryCode';

export async function resolveAppStorePricePoint(options: {
  readonly kind: 'iap' | 'subscription';
  readonly resourceId: string;
  readonly price: MonetizationBasePrice;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<AppStoreResolvedPricePoint | null> {
  const territory = toAppStoreTerritoryCode(options.price.country);
  if (territory === null) return null;
  const url =
    options.kind === 'iap'
      ? appStoreMonetizationUrls.iapPricePoints(options.resourceId, territory)
      : appStoreMonetizationUrls.subscriptionPricePoints(options.resourceId, territory);
  const value = await readAppStoreJson({ ...options, url });
  if (!isRecord(value) || !isUnknownArray(value.data)) return null;
  if (!currencyMatches(value.included, territory, options.price.currency)) return null;
  const matches = value.data.filter((item) => pricePointMatches(item, options.price.amount));
  const [match] = matches;
  return matches.length === 1 && isRecord(match) && isString(match.id)
    ? { territory, pricePointId: match.id }
    : null;
}

function pricePointMatches(value: unknown, amount: string): boolean {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isRecord(value.attributes) &&
    value.attributes.customerPrice === amount
  );
}

function currencyMatches(value: unknown, territory: string, currency: string): boolean {
  if (!isUnknownArray(value)) return false;
  return value.some(
    (item) =>
      isRecord(item) &&
      item.type === 'territories' &&
      item.id === territory &&
      isRecord(item.attributes) &&
      item.attributes.currency === currency,
  );
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
