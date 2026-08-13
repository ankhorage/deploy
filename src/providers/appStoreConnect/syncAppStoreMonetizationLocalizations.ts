import type { MonetizationProduct } from '../../domain/monetization/MonetizationProduct';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import type { AppStoreMonetizationLocalizationResource } from './AppStoreMonetizationSnapshot';
import { appStoreMonetizationUrls } from './appStoreMonetizationUrls';
import { ensureAppStoreProductVersion } from './ensureAppStoreProductVersion';
import { readAppStoreVersionLocalizations } from './readAppStoreVersionLocalizations';

export async function syncAppStoreMonetizationLocalizations(options: {
  readonly kind: 'iap' | 'subscription';
  readonly resourceId: string;
  readonly product: MonetizationProduct;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<boolean> {
  const versionId = await ensureAppStoreProductVersion({
    ...options,
    productId: options.resourceId,
  });
  if (versionId === null) return false;
  const current = await readAppStoreVersionLocalizations({ ...options, versionId });
  if (current === null) return false;
  for (const desired of options.product.localizations) {
    const existing = current.find((item) => item.locale === desired.locale);
    if (existing === undefined) {
      if (!(await createLocalization(options, versionId, desired))) return false;
    } else if (!sameLocalization(existing, desired)) {
      if (!(await updateLocalization(options, existing.resourceId, desired))) return false;
    }
  }
  return true;
}

async function createLocalization(
  options: Parameters<typeof syncAppStoreMonetizationLocalizations>[0],
  versionId: string,
  localization: MonetizationProduct['localizations'][number],
): Promise<boolean> {
  const iap = options.kind === 'iap';
  const response = await options.request({
    method: 'POST',
    url: iap
      ? appStoreMonetizationUrls.createIapLocalization()
      : appStoreMonetizationUrls.createSubscriptionLocalization(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: iap ? 'inAppPurchaseLocalizations' : 'subscriptionLocalizations',
        attributes: {
          locale: localization.locale,
          name: localization.name,
          description: localization.description,
        },
        relationships: {
          version: {
            data: {
              type: iap ? 'inAppPurchaseVersions' : 'subscriptionVersions',
              id: versionId,
            },
          },
        },
      },
    }),
  });
  return ok(response.status);
}

async function updateLocalization(
  options: Parameters<typeof syncAppStoreMonetizationLocalizations>[0],
  localizationId: string,
  localization: MonetizationProduct['localizations'][number],
): Promise<boolean> {
  const iap = options.kind === 'iap';
  const response = await options.request({
    method: 'PATCH',
    url: iap
      ? appStoreMonetizationUrls.updateIapLocalization(localizationId)
      : appStoreMonetizationUrls.updateSubscriptionLocalization(localizationId),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: iap ? 'inAppPurchaseLocalizations' : 'subscriptionLocalizations',
        id: localizationId,
        attributes: { name: localization.name, description: localization.description },
      },
    }),
  });
  return ok(response.status);
}

function sameLocalization(
  current: AppStoreMonetizationLocalizationResource,
  desired: MonetizationProduct['localizations'][number],
): boolean {
  return current.name === desired.name && current.description === desired.description;
}

function ok(status: number): boolean {
  return status >= 200 && status < 300;
}
