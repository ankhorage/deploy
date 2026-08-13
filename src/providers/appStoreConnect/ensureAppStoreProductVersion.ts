import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreMonetizationUrls } from './appStoreMonetizationUrls';
import { readAppStoreProductVersion } from './readAppStoreProductVersion';

export async function ensureAppStoreProductVersion(options: {
  readonly kind: 'iap' | 'subscription';
  readonly productId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<string | null> {
  const current = await readAppStoreProductVersion(options);
  if (current === null) return null;
  if (current?.state === 'PREPARE_FOR_SUBMISSION') return current.resourceId;
  const response =
    options.kind === 'iap'
      ? await createIapVersion(options)
      : await createSubscriptionVersion(options);
  return response.status === 201
    ? parseResourceId(
        response.body,
        options.kind === 'iap' ? 'inAppPurchaseVersions' : 'subscriptionVersions',
      )
    : null;
}

function createIapVersion(options: Parameters<typeof ensureAppStoreProductVersion>[0]) {
  return options.request({
    method: 'POST',
    url: appStoreMonetizationUrls.createIapVersion(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'inAppPurchaseVersions',
        relationships: {
          inAppPurchase: {
            data: { type: 'inAppPurchases', id: options.productId },
          },
        },
      },
    }),
  });
}

function createSubscriptionVersion(options: Parameters<typeof ensureAppStoreProductVersion>[0]) {
  return options.request({
    method: 'POST',
    url: appStoreMonetizationUrls.createSubscriptionVersion(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'subscriptionVersions',
        relationships: {
          subscription: {
            data: { type: 'subscriptions', id: options.productId },
          },
        },
      },
    }),
  });
}

function parseResourceId(body: string, type: string): string | null {
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
