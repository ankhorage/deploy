const BASE = 'https://api.appstoreconnect.apple.com/v1';

export function appStoreAppInfosUrl(appId: string): string {
  return `${BASE}/apps/${segment(appId)}/appInfos?fields[appInfos]=state,appStoreState&limit=200`;
}

export function appStoreVersionsForListingUrl(appId: string): string {
  const query = new URLSearchParams({
    'filter[platform]': 'IOS',
    'fields[appStoreVersions]': 'platform,versionString,appVersionState,appStoreState',
    limit: '200',
  });
  return `${BASE}/apps/${segment(appId)}/appStoreVersions?${query.toString()}`;
}

export function appInfoLocalizationsUrl(appInfoId: string): string {
  return `${BASE}/appInfos/${segment(appInfoId)}/appInfoLocalizations?limit=200`;
}

export function versionLocalizationsUrl(versionId: string): string {
  return `${BASE}/appStoreVersions/${segment(versionId)}/appStoreVersionLocalizations?limit=200`;
}

function segment(value: string): string {
  return encodeURIComponent(value);
}
