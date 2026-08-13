import type { MonetizationProduct } from '../../domain/monetization/MonetizationProduct';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreMonetizationUrls } from './appStoreMonetizationUrls';
import { toAppStoreSubscriptionPeriod } from './toAppStoreSubscriptionPeriod';

export async function createAppStoreMonetizationProduct(options: {
  readonly appId: string;
  readonly product: MonetizationProduct;
  readonly familyId?: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<string | null> {
  return options.product.kind === 'subscription' ? createSubscription(options) : createIap(options);
}

async function createIap(
  options: Parameters<typeof createAppStoreMonetizationProduct>[0],
): Promise<string | null> {
  const response = await options.request({
    method: 'POST',
    url: appStoreMonetizationUrls.createIap(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'inAppPurchases',
        attributes: {
          name: options.product.id,
          productId: options.product.id,
          inAppPurchaseType:
            options.product.kind === 'consumable' ? 'CONSUMABLE' : 'NON_CONSUMABLE',
        },
        relationships: { app: { data: { type: 'apps', id: options.appId } } },
      },
    }),
  });
  return response.status === 201 ? parseId(response.body, 'inAppPurchases') : null;
}

async function createSubscription(
  options: Parameters<typeof createAppStoreMonetizationProduct>[0],
): Promise<string | null> {
  const { subscription } = options.product;
  if (subscription === undefined || options.familyId === undefined) return null;
  const response = await options.request({
    method: 'POST',
    url: appStoreMonetizationUrls.createSubscription(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'subscriptions',
        attributes: {
          name: options.product.id,
          productId: options.product.id,
          subscriptionPeriod: toAppStoreSubscriptionPeriod(subscription.period),
          ...(subscription.level === undefined ? {} : { groupLevel: subscription.level }),
        },
        relationships: {
          group: { data: { type: 'subscriptionGroups', id: options.familyId } },
        },
      },
    }),
  });
  return response.status === 201 ? parseId(response.body, 'subscriptions') : null;
}

function parseId(body: string, type: string): string | null {
  try {
    const value: unknown = JSON.parse(body);
    if (!isRecord(value) || !isRecord(value.data)) return null;
    return value.data.type === type && isString(value.data.id) ? value.data.id : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}
