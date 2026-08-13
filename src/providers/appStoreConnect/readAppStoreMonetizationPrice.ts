import type { MonetizationBasePrice } from '../../domain/monetization/MonetizationBasePrice';
import type { MonetizationDiagnostic } from '../../domain/monetization/MonetizationDiagnostic';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreMonetizationUrls } from './appStoreMonetizationUrls';
import { readAppStoreJson } from './readAppStoreJson';
import { toAppStoreTerritoryCode } from './toAppStoreTerritoryCode';

export interface AppStorePriceInspection {
  readonly matches: boolean;
  readonly diagnostics: readonly MonetizationDiagnostic[];
}

export async function readAppStoreMonetizationPrice(options: {
  readonly kind: 'iap' | 'subscription';
  readonly resourceId: string;
  readonly productId: string;
  readonly price: MonetizationBasePrice;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<AppStorePriceInspection> {
  const territory = toAppStoreTerritoryCode(options.price.country);
  if (territory === null) return diagnostic(options.productId, 'APP_STORE_TERRITORY_UNSUPPORTED');
  const pricePoint = await resolvePricePoint({ ...options, territory });
  if (pricePoint === null) return diagnostic(options.productId, 'APP_STORE_PRICE_POINT_NOT_FOUND');
  const current = await readCurrentPricePoint({ ...options, territory });
  if (current === undefined) return diagnostic(options.productId, 'APP_STORE_PRICE_STATE_INVALID');
  return { matches: current === pricePoint, diagnostics: [] };
}

async function resolvePricePoint(options: {
  readonly kind: 'iap' | 'subscription';
  readonly resourceId: string;
  readonly price: MonetizationBasePrice;
  readonly territory: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<string | null> {
  const url =
    options.kind === 'iap'
      ? appStoreMonetizationUrls.iapPricePoints(options.resourceId, options.territory)
      : appStoreMonetizationUrls.subscriptionPricePoints(options.resourceId, options.territory);
  const value = await readAppStoreJson({ ...options, url });
  if (!isRecord(value) || !Array.isArray(value.data)) return null;
  if (!currencyMatches(value.included, options.territory, options.price.currency)) return null;
  const matches = value.data.filter((item) => pricePointMatches(item, options.price.amount));
  return matches.length === 1 && isRecord(matches[0]) && isString(matches[0].id)
    ? matches[0].id
    : null;
}

async function readCurrentPricePoint(options: {
  readonly kind: 'iap' | 'subscription';
  readonly resourceId: string;
  readonly territory: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<string | null | undefined> {
  const url =
    options.kind === 'iap'
      ? appStoreMonetizationUrls.iapPriceSchedule(options.resourceId)
      : appStoreMonetizationUrls.subscriptionPrices(options.resourceId, options.territory);
  const value = await readAppStoreJson({ ...options, url });
  if (!isRecord(value)) return undefined;
  return options.kind === 'iap'
    ? currentIapPricePoint(value, options.territory, options.now)
    : currentSubscriptionPricePoint(value, options.now);
}

function currentIapPricePoint(
  value: Record<string, unknown>,
  territory: string,
  now: Date,
): string | null | undefined {
  if (!isRecord(value.data) || !isRecord(value.data.relationships)) return undefined;
  if (!relationshipHasId(value.data.relationships.baseTerritory, territory)) return null;
  if (!Array.isArray(value.included)) return undefined;
  const prices = value.included.filter((item) => isResourceType(item, 'inAppPurchasePrices'));
  return currentPointFromPrices(prices, now, 'inAppPurchasePricePoint');
}

function currentSubscriptionPricePoint(
  value: Record<string, unknown>,
  now: Date,
): string | null | undefined {
  if (!Array.isArray(value.data)) return undefined;
  return currentPointFromPrices(value.data, now, 'subscriptionPricePoint');
}

function currentPointFromPrices(
  values: readonly unknown[],
  now: Date,
  relationship: 'inAppPurchasePricePoint' | 'subscriptionPricePoint',
): string | null {
  const active = values.filter((item) => isActivePrice(item, now));
  if (active.length !== 1 || !isRecord(active[0]) || !isRecord(active[0].relationships))
    return null;
  return relationship === 'inAppPurchasePricePoint'
    ? relationshipId(active[0].relationships.inAppPurchasePricePoint)
    : relationshipId(active[0].relationships.subscriptionPricePoint);
}

function isActivePrice(value: unknown, now: Date): boolean {
  if (!isRecord(value) || !isRecord(value.attributes)) return false;
  const today = now.toISOString().slice(0, 10);
  const start = value.attributes.startDate;
  const end = value.attributes.endDate;
  const startOk = start === null || start === undefined || (isString(start) && start <= today);
  const endOk = end === null || end === undefined || (isString(end) && end > today);
  return startOk && endOk;
}

function pricePointMatches(value: unknown, amount: string): boolean {
  if (!isRecord(value) || !isString(value.id) || !isRecord(value.attributes)) return false;
  return value.attributes.customerPrice === amount;
}

function currencyMatches(value: unknown, territory: string, currency: string): boolean {
  if (!Array.isArray(value)) return false;
  return value.some(
    (item) =>
      isResourceType(item, 'territories') &&
      item.id === territory &&
      isRecord(item.attributes) &&
      item.attributes.currency === currency,
  );
}

function relationshipHasId(value: unknown, id: string): boolean {
  return relationshipId(value) === id;
}

function relationshipId(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value.data) || !isString(value.data.id)) return null;
  return value.data.id;
}

function isResourceType(
  value: unknown,
  type: string,
): value is Record<string, unknown> & { readonly id: string } {
  return isRecord(value) && value.type === type && isString(value.id);
}

function diagnostic(productId: string, code: string): AppStorePriceInspection {
  const item: MonetizationDiagnostic = {
    severity: 'error',
    code,
    message: `App Store price for ${productId} cannot be resolved safely.`,
    target: 'ios',
    productId,
  };
  return { matches: false, diagnostics: [item] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
