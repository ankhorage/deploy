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

export function appInfoLocalizationCollectionUrl(): string {
  return `${BASE}/appInfoLocalizations`;
}

export function versionLocalizationCollectionUrl(): string {
  return `${BASE}/appStoreVersionLocalizations`;
}

export function appInfoLocalizationUrl(id: string): string {
  return `${BASE}/appInfoLocalizations/${segment(id)}`;
}

export function versionLocalizationUrl(id: string): string {
  return `${BASE}/appStoreVersionLocalizations/${segment(id)}`;
}

export function screenshotSetsUrl(versionLocalizationId: string): string {
  return `${BASE}/appStoreVersionLocalizations/${segment(versionLocalizationId)}/appScreenshotSets?limit=50`;
}

export function screenshotSetCollectionUrl(): string {
  return `${BASE}/appScreenshotSets`;
}

export function screenshotsUrl(setId: string): string {
  return `${BASE}/appScreenshotSets/${segment(setId)}/appScreenshots?limit=200`;
}

export function screenshotCollectionUrl(): string {
  return `${BASE}/appScreenshots`;
}

export function screenshotUrl(id: string): string {
  return `${BASE}/appScreenshots/${segment(id)}`;
}

export function screenshotRelationshipUrl(setId: string): string {
  return `${BASE}/appScreenshotSets/${segment(setId)}/relationships/appScreenshots`;
}

function segment(value: string): string {
  return encodeURIComponent(value);
}
