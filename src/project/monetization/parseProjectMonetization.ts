import type { MonetizationBasePrice } from '../../domain/monetization/MonetizationBasePrice';
import type { MonetizationLocalization } from '../../domain/monetization/MonetizationLocalization';
import type {
  MonetizationProduct,
  MonetizationProductKind,
} from '../../domain/monetization/MonetizationProduct';
import type {
  MonetizationSubscription,
  MonetizationSubscriptionPeriod,
} from '../../domain/monetization/MonetizationSubscription';
import { hasOnlyKeys } from '../io/hasOnlyKeys';
import { isRecord } from '../io/isRecord';

const ROOT_KEYS = new Set(['products']);
const PRODUCT_KEYS = new Set(['id', 'kind', 'localizations', 'basePrice', 'subscription']);
const LOCALIZATION_KEYS = new Set(['locale', 'name', 'description']);
const PRICE_KEYS = new Set(['country', 'currency', 'amount']);
const SUBSCRIPTION_KEYS = new Set(['family', 'period', 'level']);
const KINDS = new Set<MonetizationProductKind>(['consumable', 'non-consumable', 'subscription']);
const PERIODS = new Set<MonetizationSubscriptionPeriod>(['P1W', 'P1M', 'P2M', 'P3M', 'P6M', 'P1Y']);

export function parseProjectMonetization(value: unknown): readonly MonetizationProduct[] {
  if (!isRecord(value) || !hasOnlyKeys(value, ROOT_KEYS) || !Array.isArray(value.products)) {
    throw invalid();
  }
  const products = value.products.map(parseProduct).sort((a, b) => a.id.localeCompare(b.id));
  if (new Set(products.map((product) => product.id)).size !== products.length) throw invalid();
  return products;
}

function parseProduct(value: unknown): MonetizationProduct {
  if (!isRecord(value) || !hasOnlyKeys(value, PRODUCT_KEYS)) throw invalid();
  if (!isProductId(value.id) || !isKind(value.kind)) throw invalid();
  if (!Array.isArray(value.localizations) || value.localizations.length === 0) throw invalid();
  const localizations = value.localizations
    .map(parseLocalization)
    .sort((a, b) => a.locale.localeCompare(b.locale));
  if (new Set(localizations.map((item) => item.locale)).size !== localizations.length) {
    throw invalid();
  }
  const base = {
    id: value.id,
    kind: value.kind,
    localizations,
    basePrice: parsePrice(value.basePrice),
  };
  if (value.kind === 'subscription') {
    return { ...base, subscription: parseSubscription(value.subscription) };
  }
  if (value.subscription !== undefined) throw invalid();
  return base;
}

function parseLocalization(value: unknown): MonetizationLocalization {
  if (!isRecord(value) || !hasOnlyKeys(value, LOCALIZATION_KEYS)) throw invalid();
  if (!isNonEmptyString(value.name) || !isNonEmptyString(value.description)) throw invalid();
  return {
    locale: normalizeLocale(value.locale),
    name: value.name,
    description: value.description,
  };
}

function parsePrice(value: unknown): MonetizationBasePrice {
  if (!isRecord(value) || !hasOnlyKeys(value, PRICE_KEYS)) throw invalid();
  if (!isNonEmptyString(value.country) || !isNonEmptyString(value.currency)) throw invalid();
  const country = value.country.toUpperCase();
  const currency = value.currency.toUpperCase();
  if (!/^[A-Z]{2}$/.test(country) || !/^[A-Z]{3}$/.test(currency)) throw invalid();
  return { country, currency, amount: normalizeAmount(value.amount) };
}

function parseSubscription(value: unknown): MonetizationSubscription {
  if (!isRecord(value) || !hasOnlyKeys(value, SUBSCRIPTION_KEYS)) throw invalid();
  if (!isFamily(value.family) || !isPeriod(value.period)) throw invalid();
  if (value.level !== undefined && !isPositiveInteger(value.level)) throw invalid();
  return {
    family: value.family,
    period: value.period,
    ...(value.level === undefined ? {} : { level: value.level }),
  };
}

function normalizeLocale(value: unknown): string {
  if (!isNonEmptyString(value)) throw invalid();
  try {
    const locales = Intl.getCanonicalLocales(value);
    if (locales.length !== 1 || locales[0] === undefined) throw invalid();
    return locales[0];
  } catch {
    throw invalid();
  }
}

function normalizeAmount(value: unknown): string {
  if (!isNonEmptyString(value) || !/^(0|[1-9]\d*)(\.\d{1,6})?$/.test(value)) {
    throw invalid();
  }
  const separator = value.indexOf('.');
  const units = separator === -1 ? value : value.slice(0, separator);
  const fraction = separator === -1 ? '' : value.slice(separator + 1);
  const trimmed = fraction.replace(/0+$/, '');
  const normalized = trimmed.length === 0 ? units : `${units}.${trimmed}`;
  if (normalized === '0') throw invalid();
  return normalized;
}

function isProductId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._]{0,39}$/.test(value);
}

function isFamily(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9._-]{0,62}$/.test(value);
}

function isKind(value: unknown): value is MonetizationProductKind {
  return typeof value === 'string' && KINDS.has(value as MonetizationProductKind);
}

function isPeriod(value: unknown): value is MonetizationSubscriptionPeriod {
  return typeof value === 'string' && PERIODS.has(value as MonetizationSubscriptionPeriod);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function invalid(): Error {
  return new Error('MONETIZATION_PRODUCTS_INVALID');
}
