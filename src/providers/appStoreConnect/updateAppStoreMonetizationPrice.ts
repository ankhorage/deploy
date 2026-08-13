import type { MonetizationProduct } from '../../domain/monetization/MonetizationProduct';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreMonetizationUrls } from './appStoreMonetizationUrls';
import { resolveAppStorePricePoint } from './resolveAppStorePricePoint';

export async function updateAppStoreMonetizationPrice(options: {
  readonly kind: 'iap' | 'subscription';
  readonly resourceId: string;
  readonly product: MonetizationProduct;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<boolean> {
  const resolved = await resolveAppStorePricePoint({
    kind: options.kind,
    resourceId: options.resourceId,
    price: options.product.basePrice,
    token: options.token,
    request: options.request,
  });
  if (resolved === null) return false;
  return options.kind === 'iap'
    ? writeIapPrice(options, resolved.territory, resolved.pricePointId)
    : writeSubscriptionPrice(options, resolved.pricePointId);
}

async function writeIapPrice(
  options: Parameters<typeof updateAppStoreMonetizationPrice>[0],
  territory: string,
  pricePointId: string,
): Promise<boolean> {
  const localId = 'ankh-current-price';
  const response = await options.request({
    method: 'POST',
    url: appStoreMonetizationUrls.createIapPriceSchedule(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'inAppPurchasePriceSchedules',
        relationships: {
          inAppPurchase: {
            data: { type: 'inAppPurchases', id: options.resourceId },
          },
          baseTerritory: { data: { type: 'territories', id: territory } },
          manualPrices: {
            data: [{ type: 'inAppPurchasePrices', id: localId }],
          },
        },
      },
      included: [
        {
          type: 'inAppPurchasePrices',
          id: localId,
          attributes: { startDate: null },
          relationships: {
            inAppPurchaseV2: {
              data: { type: 'inAppPurchases', id: options.resourceId },
            },
            inAppPurchasePricePoint: {
              data: { type: 'inAppPurchasePricePoints', id: pricePointId },
            },
          },
        },
      ],
    }),
  });
  return ok(response.status);
}

async function writeSubscriptionPrice(
  options: Parameters<typeof updateAppStoreMonetizationPrice>[0],
  pricePointId: string,
): Promise<boolean> {
  const response = await options.request({
    method: 'POST',
    url: appStoreMonetizationUrls.createSubscriptionPrice(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'subscriptionPrices',
        attributes: {
          startDate: options.now.toISOString().slice(0, 10),
          preserveCurrentPrice: true,
        },
        relationships: {
          subscription: {
            data: { type: 'subscriptions', id: options.resourceId },
          },
          subscriptionPricePoint: {
            data: { type: 'subscriptionPricePoints', id: pricePointId },
          },
        },
      },
    }),
  });
  return ok(response.status);
}

function ok(status: number): boolean {
  return status >= 200 && status < 300;
}
