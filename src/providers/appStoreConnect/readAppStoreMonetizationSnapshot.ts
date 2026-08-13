import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import type { MonetizationDiagnostic } from '../../domain/monetization/MonetizationDiagnostic';
import type { MonetizationProduct } from '../../domain/monetization/MonetizationProduct';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreConnectAppsUrl } from './appStoreConnectUrls';
import type {
  AppStoreMonetizationFamilyResource,
  AppStoreMonetizationProductResource,
  AppStoreMonetizationSnapshot,
} from './AppStoreMonetizationSnapshot';
import { appStoreMonetizationUrls } from './appStoreMonetizationUrls';
import { fromAppStoreSubscriptionPeriod } from './mapAppStoreSubscriptionPeriod';
import { parseAppStoreAppId } from './parseAppStoreAppId';
import { readAppStoreCollection } from './readAppStoreCollection';
import { readAppStoreJson } from './readAppStoreJson';
import { readAppStoreMonetizationPrice } from './readAppStoreMonetizationPrice';
import { readAppStoreProductVersion } from './readAppStoreProductVersion';

interface ReadProductResult {
  readonly products: readonly AppStoreMonetizationProductResource[];
  readonly diagnostics: readonly MonetizationDiagnostic[];
}

export async function readAppStoreMonetizationSnapshot(options: {
  readonly bundleIdentifier: string;
  readonly desired: MonetizationDesiredState;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<AppStoreMonetizationSnapshot | null | 'app-required'> {
  const appId = await resolveAppId(options);
  if (appId === undefined) return null;
  if (appId === null) return 'app-required';
  const catalog = await readCatalog({ ...options, appId });
  if (catalog === null) return null;
  const families = parseFamilies(catalog.groups.data);
  if (families === null) return null;
  const products: AppStoreMonetizationProductResource[] = [];
  const diagnostics: MonetizationDiagnostic[] = [];
  for (const desired of options.desired.products) {
    const result = await readDesiredProduct({ ...options, desired, families, catalog });
    products.push(...result.products);
    diagnostics.push(...result.diagnostics);
  }
  return { appId, products, families, diagnostics };
}

async function resolveAppId(
  options: Parameters<typeof readAppStoreMonetizationSnapshot>[0],
): Promise<string | null | undefined> {
  const value = await readAppStoreJson({
    url: appStoreConnectAppsUrl(options.bundleIdentifier),
    token: options.token,
    request: options.request,
  });
  return value === null ? undefined : parseAppStoreAppId(value, options.bundleIdentifier);
}

async function readCatalog(options: {
  readonly appId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<{
  iaps: { readonly data: readonly unknown[]; readonly included: readonly unknown[] };
  groups: { readonly data: readonly unknown[]; readonly included: readonly unknown[] };
} | null> {
  const [iaps, groups] = await Promise.all([
    readAppStoreCollection({
      url: appStoreMonetizationUrls.inAppPurchases(options.appId),
      token: options.token,
      request: options.request,
    }),
    readAppStoreCollection({
      url: appStoreMonetizationUrls.subscriptionGroups(options.appId),
      token: options.token,
      request: options.request,
    }),
  ]);
  return iaps === null || groups === null ? null : { iaps, groups };
}

async function readDesiredProduct(options: {
  readonly desired: MonetizationProduct;
  readonly families: readonly AppStoreMonetizationFamilyResource[];
  readonly catalog: {
    readonly iaps: { readonly data: readonly unknown[]; readonly included: readonly unknown[] };
    readonly groups: { readonly data: readonly unknown[]; readonly included: readonly unknown[] };
  };
  readonly token: string;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<ReadProductResult> {
  const iap = findProduct(options.catalog.iaps.data, options.desired.id);
  const subscription = findProduct(options.catalog.groups.included, options.desired.id);
  if (iap !== undefined && subscription !== undefined) {
    return {
      products: [],
      diagnostics: [diagnostic(options.desired.id, 'APP_STORE_PRODUCT_ID_CONFLICT')],
    };
  }
  if (options.desired.kind === 'subscription') {
    if (iap !== undefined) return readIap(options, iap);
    return subscription === undefined ? empty() : readSubscription(options, subscription);
  }
  if (subscription !== undefined) return readSubscription(options, subscription);
  return iap === undefined ? empty() : readIap(options, iap);
}

async function readIap(
  options: Parameters<typeof readDesiredProduct>[0],
  value: unknown,
): Promise<ReadProductResult> {
  const base = parseIap(value);
  if (base === null) return invalid(options.desired.id);
  const version = await readAppStoreProductVersion({
    kind: 'iap',
    productId: base.resourceId,
    token: options.token,
    request: options.request,
  });
  if (version === null) return invalid(options.desired.id);
  return withPrice(options, base, version, 'iap');
}

async function readSubscription(
  options: Parameters<typeof readDesiredProduct>[0],
  value: unknown,
): Promise<ReadProductResult> {
  const base = parseSubscription(value, options.families);
  if (base === null) return invalid(options.desired.id);
  const version = await readAppStoreProductVersion({
    kind: 'subscription',
    productId: base.resourceId,
    token: options.token,
    request: options.request,
  });
  if (version === null) return invalid(options.desired.id);
  return withPrice(options, base, version, 'subscription');
}

async function withPrice(
  options: Parameters<typeof readDesiredProduct>[0],
  base: Omit<AppStoreMonetizationProductResource, 'localizations' | 'basePriceMatches'>,
  version: Exclude<Awaited<ReturnType<typeof readAppStoreProductVersion>>, null>,
  kind: 'iap' | 'subscription',
): Promise<ReadProductResult> {
  const price = await readAppStoreMonetizationPrice({
    kind,
    resourceId: base.resourceId,
    productId: options.desired.id,
    price: options.desired.basePrice,
    token: options.token,
    request: options.request,
    now: options.now,
  });
  return {
    products: [
      {
        ...base,
        localizations: version?.localizations ?? [],
        basePriceMatches: price.matches,
        ...(version === undefined
          ? {}
          : { versionId: version.resourceId, versionState: version.state }),
      },
    ],
    diagnostics: price.diagnostics,
  };
}

function parseIap(
  value: unknown,
): Omit<AppStoreMonetizationProductResource, 'localizations' | 'basePriceMatches'> | null {
  if (!isRecord(value) || !isString(value.id) || !isRecord(value.attributes)) return null;
  const { productId } = value.attributes;
  const kind = mapIapKind(value.attributes.inAppPurchaseType);
  if (!isString(productId) || kind === null) return null;
  const state = isString(value.attributes.state) ? value.attributes.state : undefined;
  return { resourceId: value.id, productId, kind, ...(state === undefined ? {} : { state }) };
}

function parseSubscription(
  value: unknown,
  families: readonly AppStoreMonetizationFamilyResource[],
): Omit<AppStoreMonetizationProductResource, 'localizations' | 'basePriceMatches'> | null {
  if (!isRecord(value) || !isString(value.id) || !isRecord(value.attributes)) return null;
  const { productId } = value.attributes;
  const period = fromAppStoreSubscriptionPeriod(value.attributes.subscriptionPeriod);
  const familyId = relationshipId(
    isRecord(value.relationships) ? value.relationships.group : undefined,
  );
  const family = families.find((item) => item.resourceId === familyId);
  if (!isString(productId) || period === null || family === undefined) return null;
  const level = isPositiveInteger(value.attributes.groupLevel)
    ? value.attributes.groupLevel
    : undefined;
  const state = isString(value.attributes.state) ? value.attributes.state : undefined;
  return {
    resourceId: value.id,
    productId,
    kind: 'subscription',
    family: family.referenceName,
    familyId: family.resourceId,
    period,
    ...(level === undefined ? {} : { level }),
    ...(state === undefined ? {} : { state }),
  };
}

function parseFamilies(
  values: readonly unknown[],
): readonly AppStoreMonetizationFamilyResource[] | null {
  const result: AppStoreMonetizationFamilyResource[] = [];
  for (const value of values) {
    if (!isRecord(value) || !isString(value.id) || !isRecord(value.attributes)) return null;
    if (!isString(value.attributes.referenceName)) return null;
    result.push({ resourceId: value.id, referenceName: value.attributes.referenceName });
  }
  return result.sort((a, b) => a.referenceName.localeCompare(b.referenceName));
}

function findProduct(values: readonly unknown[], productId: string): unknown {
  return values.find(
    (value) =>
      isRecord(value) && isRecord(value.attributes) && value.attributes.productId === productId,
  );
}

function mapIapKind(value: unknown): 'consumable' | 'non-consumable' | null {
  if (value === 'CONSUMABLE') return 'consumable';
  if (value === 'NON_CONSUMABLE') return 'non-consumable';
  return null;
}

function relationshipId(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value.data) || !isString(value.data.id)) return null;
  return value.data.id;
}

function empty(): ReadProductResult {
  return { products: [], diagnostics: [] };
}

function invalid(productId: string): ReadProductResult {
  return {
    products: [],
    diagnostics: [diagnostic(productId, 'APP_STORE_PRODUCT_STATE_INVALID')],
  };
}

function diagnostic(productId: string, code: string): MonetizationDiagnostic {
  return {
    severity: 'error',
    code,
    message: `App Store monetization product ${productId} cannot be normalized safely.`,
    target: 'ios',
    productId,
  };
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
