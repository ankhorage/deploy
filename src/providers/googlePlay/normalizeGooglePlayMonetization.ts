import type { MonetizationBasePrice } from '../../domain/monetization/MonetizationBasePrice';
import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import type { MonetizationDiagnostic } from '../../domain/monetization/MonetizationDiagnostic';
import type { MonetizationLocalization } from '../../domain/monetization/MonetizationLocalization';
import type { MonetizationObservedProduct } from '../../domain/monetization/MonetizationObservedProduct';
import type { MonetizationProduct } from '../../domain/monetization/MonetizationProduct';
import type { MonetizationSubscriptionPeriod } from '../../domain/monetization/MonetizationSubscription';
import type { MonetizationTargetState } from '../../domain/monetization/MonetizationTargetState';

const PERIODS = new Set<MonetizationSubscriptionPeriod>(['P1W', 'P1M', 'P2M', 'P3M', 'P6M', 'P1Y']);

export function normalizeGooglePlayMonetization(options: {
  readonly desired: MonetizationDesiredState;
  readonly oneTimeProducts: readonly unknown[];
  readonly subscriptions: readonly unknown[];
}): MonetizationTargetState {
  const diagnostics: MonetizationDiagnostic[] = [];
  const products = options.desired.products.flatMap((desired) =>
    normalizeProduct(desired, options, diagnostics),
  );
  return { target: 'android', products, subscriptionFamilies: [], diagnostics };
}

function normalizeProduct(
  desired: MonetizationProduct,
  resources: {
    readonly oneTimeProducts: readonly unknown[];
    readonly subscriptions: readonly unknown[];
  },
  diagnostics: MonetizationDiagnostic[],
): MonetizationObservedProduct[] {
  const oneTime = findProduct(resources.oneTimeProducts, desired.id);
  const subscription = findProduct(resources.subscriptions, desired.id);
  if (oneTime !== undefined && subscription !== undefined) {
    diagnostics.push(error(desired.id, 'GOOGLE_PLAY_PRODUCT_ID_CONFLICT'));
    return [];
  }
  if (desired.kind === 'subscription') {
    if (oneTime !== undefined) return [normalizeOneTime(oneTime, desired, diagnostics)];
    return subscription === undefined
      ? []
      : [normalizeSubscription(subscription, desired, diagnostics)];
  }
  if (subscription !== undefined) return [normalizeForeignSubscription(subscription, desired.id)];
  return oneTime === undefined ? [] : [normalizeOneTime(oneTime, desired, diagnostics)];
}

function normalizeOneTime(
  value: unknown,
  desired: MonetizationProduct,
  diagnostics: MonetizationDiagnostic[],
): MonetizationObservedProduct {
  if (!isRecord(value)) return invalidObserved(desired.id, diagnostics);
  const localizations = parseListings(value.listings);
  const buyOptions = array(value.purchaseOptions).filter(isBuyOption);
  if (localizations === null) diagnostics.push(error(desired.id, 'GOOGLE_PLAY_LISTINGS_INVALID'));
  if (buyOptions.length !== 1) {
    diagnostics.push(error(desired.id, 'GOOGLE_PLAY_BUY_OPTION_UNSUPPORTED'));
  }
  const [buyOption] = buyOptions;
  const basePrice =
    buyOptions.length === 1 && buyOption !== undefined
      ? readBasePrice(buyOption, desired.basePrice.country)
      : undefined;
  return {
    id: desired.id,
    kind: 'one-time',
    localizations: localizations ?? [],
    ...(basePrice === undefined ? {} : { basePrice }),
  };
}

function normalizeSubscription(
  value: unknown,
  desired: MonetizationProduct,
  diagnostics: MonetizationDiagnostic[],
): MonetizationObservedProduct {
  if (!isRecord(value)) return invalidObserved(desired.id, diagnostics);
  const localizations = parseListings(value.listings);
  const plans = array(value.basePlans).filter(isAutoRenewingPlan);
  if (localizations === null) diagnostics.push(error(desired.id, 'GOOGLE_PLAY_LISTINGS_INVALID'));
  if (plans.length !== 1) {
    diagnostics.push(error(desired.id, 'GOOGLE_PLAY_BASE_PLAN_UNSUPPORTED'));
    return { id: desired.id, kind: 'subscription', localizations: localizations ?? [] };
  }
  const [plan] = plans;
  if (plan === undefined) return { id: desired.id, kind: 'subscription', localizations: [] };
  return subscriptionObserved(plan, desired, localizations ?? [], diagnostics);
}

function subscriptionObserved(
  plan: Record<string, unknown>,
  desired: MonetizationProduct,
  localizations: readonly MonetizationLocalization[],
  diagnostics: MonetizationDiagnostic[],
): MonetizationObservedProduct {
  const auto = isRecord(plan.autoRenewingBasePlanType) ? plan.autoRenewingBasePlanType : {};
  const period = auto.billingPeriodDuration;
  if (!isPeriod(period)) {
    diagnostics.push(error(desired.id, 'GOOGLE_PLAY_SUBSCRIPTION_PERIOD_UNSUPPORTED'));
    return { id: desired.id, kind: 'subscription', localizations };
  }
  if (desired.subscription?.period !== period) {
    diagnostics.push(error(desired.id, 'GOOGLE_PLAY_SUBSCRIPTION_PERIOD_IMMUTABLE'));
  }
  const basePrice = readBasePrice(plan, desired.basePrice.country);
  return {
    id: desired.id,
    kind: 'subscription',
    localizations,
    ...(basePrice === undefined ? {} : { basePrice }),
    subscription: {
      family: desired.subscription?.family ?? desired.id,
      period,
      ...(desired.subscription?.level === undefined ? {} : { level: desired.subscription.level }),
    },
  };
}

function normalizeForeignSubscription(
  value: unknown,
  productId: string,
): MonetizationObservedProduct {
  const localizations = isRecord(value) ? parseListings(value.listings) : null;
  return { id: productId, kind: 'subscription', localizations: localizations ?? [] };
}

function invalidObserved(
  productId: string,
  diagnostics: MonetizationDiagnostic[],
): MonetizationObservedProduct {
  diagnostics.push(error(productId, 'GOOGLE_PLAY_PRODUCT_INVALID'));
  return { id: productId, kind: 'one-time', localizations: [] };
}

function parseListings(value: unknown): readonly MonetizationLocalization[] | null {
  if (!Array.isArray(value)) return null;
  const result: MonetizationLocalization[] = [];
  for (const item of value as unknown[]) {
    if (!isRecord(item)) return null;
    const locale = normalizeLocale(item.languageCode);
    if (locale === null || !isString(item.title) || !isString(item.description)) return null;
    result.push({ locale, name: item.title, description: item.description });
  }
  return result.sort((a, b) => a.locale.localeCompare(b.locale));
}

function readBasePrice(
  value: Record<string, unknown>,
  country: string,
): MonetizationBasePrice | undefined {
  const configs = array(
    value.regionalPricingAndAvailabilityConfigs ?? value.regionalConfigs,
  ).filter(isRecord);
  const config = configs.find((item) => item.regionCode === country);
  return config === undefined ? undefined : readMoney(config.price, country);
}

function readMoney(value: unknown, country: string): MonetizationBasePrice | undefined {
  if (!isRecord(value) || !isString(value.currencyCode) || !isInteger(value.nanos))
    return undefined;
  if (!isString(value.units) || !/^\d+$/.test(value.units)) return undefined;
  if (value.nanos < 0 || value.nanos > 999_999_999) return undefined;
  const fraction = String(value.nanos).padStart(9, '0').replace(/0+$/, '');
  return {
    country,
    currency: value.currencyCode,
    amount: fraction.length === 0 ? value.units : `${value.units}.${fraction}`,
  };
}

function findProduct(values: readonly unknown[], productId: string): unknown {
  return values.find((value) => isRecord(value) && value.productId === productId);
}

function isBuyOption(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && isRecord(value.buyOption);
}

function isAutoRenewingPlan(value: unknown): value is Record<string, unknown> {
  return isRecord(value) && isRecord(value.autoRenewingBasePlanType);
}

function array(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function normalizeLocale(value: unknown): string | null {
  if (!isString(value)) return null;
  try {
    return Intl.getCanonicalLocales(value)[0] ?? null;
  } catch {
    return null;
  }
}

function isPeriod(value: unknown): value is MonetizationSubscriptionPeriod {
  return typeof value === 'string' && PERIODS.has(value as MonetizationSubscriptionPeriod);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function error(productId: string, code: string): MonetizationDiagnostic {
  return {
    severity: 'error',
    code,
    message: `Google Play monetization product ${productId} cannot be normalized safely.`,
    target: 'android',
    productId,
  };
}
