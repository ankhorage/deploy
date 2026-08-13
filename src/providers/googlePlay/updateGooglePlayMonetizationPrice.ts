import type { MonetizationProduct } from '../../domain/monetization/MonetizationProduct';
import { googlePlayMonetizationUrls } from './googlePlayMonetizationUrls';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { toGooglePlayMoney } from './toGooglePlayMoney';

export async function updateGooglePlayMonetizationPrice(options: {
  readonly packageName: string;
  readonly product: MonetizationProduct;
  readonly regionVersion: string;
  readonly token: string;
  readonly request: GooglePlayTransport;
}): Promise<boolean> {
  return options.product.kind === 'subscription'
    ? updateSubscriptionPrice(options)
    : updateOneTimePrice(options);
}

async function updateOneTimePrice(
  options: Parameters<typeof updateGooglePlayMonetizationPrice>[0],
): Promise<boolean> {
  const current = await getJson(
    options,
    googlePlayMonetizationUrls.oneTimeProduct(options.packageName, options.product.id),
  );
  if (!isRecord(current) || !Array.isArray(current.purchaseOptions)) return false;
  const purchaseOptions = replaceBuyOptionPrice(current.purchaseOptions, options.product);
  if (purchaseOptions === null) return false;
  return patchJson(
    options,
    googlePlayMonetizationUrls.oneTimePatch(
      options.packageName,
      options.product.id,
      options.regionVersion,
      'purchaseOptions',
    ),
    { packageName: options.packageName, productId: options.product.id, purchaseOptions },
  );
}

async function updateSubscriptionPrice(
  options: Parameters<typeof updateGooglePlayMonetizationPrice>[0],
): Promise<boolean> {
  const current = await getJson(
    options,
    googlePlayMonetizationUrls.subscription(options.packageName, options.product.id),
  );
  if (!isRecord(current) || !Array.isArray(current.basePlans)) return false;
  const basePlans = replaceBasePlanPrice(current.basePlans, options.product);
  if (basePlans === null) return false;
  return patchJson(
    options,
    googlePlayMonetizationUrls.subscriptionPatch(
      options.packageName,
      options.product.id,
      options.regionVersion,
      'basePlans',
    ),
    { packageName: options.packageName, productId: options.product.id, basePlans },
  );
}

function replaceBuyOptionPrice(
  values: readonly unknown[],
  product: MonetizationProduct,
): readonly Record<string, unknown>[] | null {
  const buyIndexes = values.flatMap((value, index) =>
    isRecord(value) && isRecord(value.buyOption) ? [index] : [],
  );
  if (buyIndexes.length !== 1) return null;
  const [buyIndex] = buyIndexes;
  if (buyIndex === undefined) return null;
  return values.map((value, index) => {
    if (!isRecord(value)) return {};
    const clean = cleanState(value);
    return index === buyIndex ? withOneTimeRegionalPrice(clean, product) : clean;
  });
}

function replaceBasePlanPrice(
  values: readonly unknown[],
  product: MonetizationProduct,
): readonly Record<string, unknown>[] | null {
  const indexes = values.flatMap((value, index) =>
    isRecord(value) && isRecord(value.autoRenewingBasePlanType) ? [index] : [],
  );
  if (indexes.length !== 1) return null;
  const [target] = indexes;
  if (target === undefined) return null;
  return values.map((value, index) => {
    if (!isRecord(value)) return {};
    const clean = cleanState(value);
    return index === target ? withSubscriptionRegionalPrice(clean, product) : clean;
  });
}

function withOneTimeRegionalPrice(
  resource: Record<string, unknown>,
  product: MonetizationProduct,
): Record<string, unknown> {
  const values = Array.isArray(resource.regionalPricingAndAvailabilityConfigs)
    ? resource.regionalPricingAndAvailabilityConfigs
    : [];
  return {
    ...resource,
    regionalPricingAndAvailabilityConfigs: replaceRegion(values, product, 'one-time'),
  };
}

function withSubscriptionRegionalPrice(
  resource: Record<string, unknown>,
  product: MonetizationProduct,
): Record<string, unknown> {
  const values = Array.isArray(resource.regionalConfigs) ? resource.regionalConfigs : [];
  return {
    ...resource,
    regionalConfigs: replaceRegion(values, product, 'subscription'),
  };
}

function replaceRegion(
  values: readonly unknown[],
  product: MonetizationProduct,
  kind: 'one-time' | 'subscription',
): readonly Record<string, unknown>[] {
  const valid = values.filter(isRegionConfig);
  const exists = valid.some((value) => value.regionCode === product.basePrice.country);
  const next = valid.map((value) =>
    value.regionCode === product.basePrice.country
      ? { ...value, price: toGooglePlayMoney(product.basePrice) }
      : value,
  );
  return exists ? next : [...next, newRegion(product, kind)];
}

function newRegion(
  product: MonetizationProduct,
  kind: 'one-time' | 'subscription',
): Record<string, unknown> {
  const base = {
    regionCode: product.basePrice.country,
    price: toGooglePlayMoney(product.basePrice),
  };
  return kind === 'one-time'
    ? { ...base, availability: 'AVAILABLE' }
    : { ...base, newSubscriberAvailability: true };
}

function cleanState(value: Record<string, unknown>): Record<string, unknown> {
  const { state: _state, ...rest } = value;
  return rest;
}

async function getJson(
  options: Parameters<typeof updateGooglePlayMonetizationPrice>[0],
  url: string,
): Promise<unknown> {
  const response = await options.request({ method: 'GET', url, token: options.token });
  if (!ok(response.status)) return null;
  try {
    return JSON.parse(response.body) as unknown;
  } catch {
    return null;
  }
}

async function patchJson(
  options: Parameters<typeof updateGooglePlayMonetizationPrice>[0],
  url: string,
  body: unknown,
): Promise<boolean> {
  const response = await options.request({
    method: 'PATCH',
    url,
    token: options.token,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
  return ok(response.status);
}

function isRegionConfig(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && typeof value.regionCode === 'string';
}

function ok(status: number): boolean {
  return status >= 200 && status < 300;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
