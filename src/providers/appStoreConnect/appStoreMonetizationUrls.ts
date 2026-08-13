const V1 = 'https://api.appstoreconnect.apple.com/v1';
const V2 = 'https://api.appstoreconnect.apple.com/v2';

export const appStoreMonetizationUrls = {
  inAppPurchases: (appId: string) =>
    `${V1}/apps/${segment(appId)}/inAppPurchasesV2?fields[inAppPurchases]=productId,inAppPurchaseType,state&limit=200`,
  subscriptionGroups: (appId: string) => {
    const query = new URLSearchParams({
      'fields[subscriptionGroups]': 'referenceName,subscriptions',
      'fields[subscriptions]': 'productId,state,subscriptionPeriod,groupLevel,group',
      include: 'subscriptions',
      limit: '200',
      'limit[subscriptions]': '200',
    });
    return `${V1}/apps/${segment(appId)}/subscriptionGroups?${query.toString()}`;
  },
  iapLocalizations: (id: string) =>
    `${V2}/inAppPurchases/${segment(id)}/inAppPurchaseLocalizations?limit=200`,
  subscriptionLocalizations: (id: string) =>
    `${V1}/subscriptions/${segment(id)}/subscriptionLocalizations?limit=200`,
  iapPricePoints: (id: string, territory: string) =>
    pricePointUrl(
      `${V2}/inAppPurchases/${segment(id)}/pricePoints`,
      territory,
      'inAppPurchasePricePoints',
    ),
  subscriptionPricePoints: (id: string, territory: string) =>
    pricePointUrl(
      `${V1}/subscriptions/${segment(id)}/pricePoints`,
      territory,
      'subscriptionPricePoints',
    ),
  iapPriceSchedule: (id: string) => {
    const query = new URLSearchParams({
      'fields[inAppPurchasePriceSchedules]': 'baseTerritory,manualPrices',
      'fields[inAppPurchasePrices]': 'startDate,endDate,inAppPurchasePricePoint,territory',
      include: 'baseTerritory,manualPrices',
      'limit[manualPrices]': '50',
    });
    return `${V2}/inAppPurchases/${segment(id)}/iapPriceSchedule?${query.toString()}`;
  },
  subscriptionPrices: (id: string, territory: string) => {
    const query = new URLSearchParams({
      'fields[subscriptionPrices]': 'startDate,preserved,planType,territory,subscriptionPricePoint',
      'fields[subscriptionPricePoints]': 'customerPrice',
      'fields[territories]': 'currency',
      'filter[territory]': territory,
      include: 'territory,subscriptionPricePoint',
      limit: '200',
    });
    return `${V1}/subscriptions/${segment(id)}/prices?${query.toString()}`;
  },
};

function pricePointUrl(base: string, territory: string, fieldsKey: string): string {
  const query = new URLSearchParams({
    [`fields[${fieldsKey}]`]: 'customerPrice,territory',
    'fields[territories]': 'currency',
    'filter[territory]': territory,
    include: 'territory',
    limit: '8000',
  });
  return `${base}?${query.toString()}`;
}

function segment(value: string): string {
  return encodeURIComponent(value);
}
