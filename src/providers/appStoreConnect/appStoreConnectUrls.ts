const BASE = 'https://api.appstoreconnect.apple.com/v1';

export function appStoreConnectAppsUrl(bundleIdentifier: string): string {
  const query = new URLSearchParams({
    'filter[bundleId]': bundleIdentifier,
    'fields[apps]': 'bundleId',
    limit: '2',
  });
  return `${BASE}/apps?${query.toString()}`;
}

export function appStoreConnectVersionsUrl(appId: string): string {
  const query = new URLSearchParams({
    'filter[platform]': 'IOS',
    'fields[appStoreVersions]': 'platform,versionString,build',
    'fields[builds]': 'version,processingState',
    include: 'build',
    limit: '200',
  });
  return `${BASE}/apps/${encodeURIComponent(appId)}/appStoreVersions?${query.toString()}`;
}

export function appStoreConnectVersionBuildUrl(versionId: string): string {
  return `${BASE}/appStoreVersions/${encodeURIComponent(versionId)}/build?fields[builds]=version,processingState`;
}
