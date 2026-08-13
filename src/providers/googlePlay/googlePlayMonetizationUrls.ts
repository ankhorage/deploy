const BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';

function app(packageName: string): string {
  return `${BASE}/${encodeURIComponent(packageName)}`;
}

function withPage(url: string, pageToken?: string): string {
  const query = new URLSearchParams({ pageSize: '1000' });
  if (pageToken !== undefined) query.set('pageToken', pageToken);
  return `${url}?${query.toString()}`;
}

function patchQuery(regionVersion: string, updateMask: string, allowMissing = false): string {
  const query = new URLSearchParams({
    'regionsVersion.version': regionVersion,
    updateMask,
  });
  if (allowMissing) query.set('allowMissing', 'true');
  return query.toString();
}

export const googlePlayMonetizationUrls = {
  oneTimeList: (packageName: string, pageToken?: string) =>
    withPage(`${app(packageName)}/oneTimeProducts`, pageToken),
  subscriptionsList: (packageName: string, pageToken?: string) =>
    withPage(`${app(packageName)}/subscriptions`, pageToken),
  convertPrices: (packageName: string) => `${app(packageName)}/pricing:convertRegionPrices`,
  oneTimeProduct: (packageName: string, productId: string) =>
    `${app(packageName)}/onetimeproducts/${encodeURIComponent(productId)}`,
  oneTimePatch: (
    packageName: string,
    productId: string,
    regionVersion: string,
    updateMask: string,
    allowMissing = false,
  ) =>
    `${app(packageName)}/onetimeproducts/${encodeURIComponent(productId)}?${patchQuery(
      regionVersion,
      updateMask,
      allowMissing,
    )}`,
  subscription: (packageName: string, productId: string) =>
    `${app(packageName)}/subscriptions/${encodeURIComponent(productId)}`,
  subscriptionCreate: (packageName: string, productId: string, regionVersion: string) => {
    const query = new URLSearchParams({
      productId,
      'regionsVersion.version': regionVersion,
    });
    return `${app(packageName)}/subscriptions?${query.toString()}`;
  },
  subscriptionPatch: (
    packageName: string,
    productId: string,
    regionVersion: string,
    updateMask: string,
  ) =>
    `${app(packageName)}/subscriptions/${encodeURIComponent(productId)}?${patchQuery(
      regionVersion,
      updateMask,
    )}`,
};
