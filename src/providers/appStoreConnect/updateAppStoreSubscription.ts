import type { MonetizationProduct } from '../../domain/monetization/MonetizationProduct';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreMonetizationUrls } from './appStoreMonetizationUrls';
import { toAppStoreSubscriptionPeriod } from './toAppStoreSubscriptionPeriod';

export async function updateAppStoreSubscription(options: {
  readonly resourceId: string;
  readonly product: MonetizationProduct;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<boolean> {
  const { subscription } = options.product;
  if (options.product.kind !== 'subscription' || subscription === undefined) return false;
  const response = await options.request({
    method: 'PATCH',
    url: appStoreMonetizationUrls.updateSubscription(options.resourceId),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'subscriptions',
        id: options.resourceId,
        attributes: {
          subscriptionPeriod: toAppStoreSubscriptionPeriod(subscription.period),
          ...(subscription.level === undefined ? {} : { groupLevel: subscription.level }),
        },
      },
    }),
  });
  return response.status >= 200 && response.status < 300;
}
