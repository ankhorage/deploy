import type { MonetizationPlanStep } from '../../domain/monetization/MonetizationPlanStep';
import type { MonetizationProduct } from '../../domain/monetization/MonetizationProduct';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import type {
  AppStoreMonetizationProductResource,
  AppStoreMonetizationSnapshot,
} from './AppStoreMonetizationSnapshot';
import { createAppStoreMonetizationProduct } from './createAppStoreMonetizationProduct';
import { ensureAppStoreSubscriptionFamily } from './ensureAppStoreSubscriptionFamily';
import { syncAppStoreMonetizationLocalizations } from './syncAppStoreMonetizationLocalizations';
import { updateAppStoreMonetizationPrice } from './updateAppStoreMonetizationPrice';
import { updateAppStoreSubscription } from './updateAppStoreSubscription';

export async function writeAppStoreMonetizationProduct(options: {
  readonly snapshot: AppStoreMonetizationSnapshot;
  readonly product: MonetizationProduct;
  readonly operations: readonly MonetizationPlanStep['operation'][];
  readonly token: string;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<boolean> {
  const current = options.snapshot.products.find((item) => item.productId === options.product.id);
  if (options.operations.includes('create-product')) return createProduct(options);
  if (current === undefined) return false;
  if (
    options.operations.includes('update-subscription') &&
    !(await updateSubscription(options, current))
  ) {
    return false;
  }
  if (options.operations.includes('update-metadata') && !(await syncMetadata(options, current))) {
    return false;
  }
  if (options.operations.includes('update-price')) return syncPrice(options, current);
  return true;
}

async function createProduct(
  options: Parameters<typeof writeAppStoreMonetizationProduct>[0],
): Promise<boolean> {
  const familyId = await familyForCreate(options);
  if (options.product.kind === 'subscription' && familyId === null) return false;
  const resourceId = await createAppStoreMonetizationProduct({
    appId: options.snapshot.appId,
    product: options.product,
    ...(familyId === null ? {} : { familyId }),
    token: options.token,
    request: options.request,
  });
  if (resourceId === null) return false;
  const kind = options.product.kind === 'subscription' ? 'subscription' : 'iap';
  if (
    !(await syncAppStoreMonetizationLocalizations({
      kind,
      resourceId,
      product: options.product,
      token: options.token,
      request: options.request,
    }))
  ) {
    return false;
  }
  return updateAppStoreMonetizationPrice({
    kind,
    resourceId,
    product: options.product,
    token: options.token,
    request: options.request,
    now: options.now,
  });
}

async function familyForCreate(
  options: Parameters<typeof writeAppStoreMonetizationProduct>[0],
): Promise<string | null> {
  const family = options.product.subscription?.family;
  if (options.product.kind !== 'subscription' || family === undefined) return null;
  return ensureAppStoreSubscriptionFamily({
    appId: options.snapshot.appId,
    family,
    snapshot: options.snapshot,
    token: options.token,
    request: options.request,
  });
}

function updateSubscription(
  options: Parameters<typeof writeAppStoreMonetizationProduct>[0],
  current: AppStoreMonetizationProductResource,
): Promise<boolean> {
  return updateAppStoreSubscription({
    resourceId: current.resourceId,
    product: options.product,
    token: options.token,
    request: options.request,
  });
}

function syncMetadata(
  options: Parameters<typeof writeAppStoreMonetizationProduct>[0],
  current: AppStoreMonetizationProductResource,
): Promise<boolean> {
  return syncAppStoreMonetizationLocalizations({
    kind: current.kind === 'subscription' ? 'subscription' : 'iap',
    resourceId: current.resourceId,
    product: options.product,
    token: options.token,
    request: options.request,
  });
}

function syncPrice(
  options: Parameters<typeof writeAppStoreMonetizationProduct>[0],
  current: AppStoreMonetizationProductResource,
): Promise<boolean> {
  return updateAppStoreMonetizationPrice({
    kind: current.kind === 'subscription' ? 'subscription' : 'iap',
    resourceId: current.resourceId,
    product: options.product,
    token: options.token,
    request: options.request,
    now: options.now,
  });
}
