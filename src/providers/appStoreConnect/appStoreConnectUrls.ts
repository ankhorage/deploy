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

export function appStoreConnectVersionBuildRelationshipUrl(versionId: string): string {
  return `${BASE}/appStoreVersions/${encodeURIComponent(versionId)}/relationships/build`;
}

export function appStoreConnectBuildUploadsUrl(): string {
  return `${BASE}/buildUploads`;
}

export function appStoreConnectBuildUploadUrl(buildUploadId: string): string {
  const id = encodeURIComponent(buildUploadId);
  return `${BASE}/buildUploads/${id}?include=build&fields[builds]=version,processingState`;
}

export function appStoreConnectBuildUploadFilesUrl(): string {
  return `${BASE}/buildUploadFiles`;
}

export function appStoreConnectBuildUploadFileUrl(fileId: string): string {
  return `${BASE}/buildUploadFiles/${encodeURIComponent(fileId)}`;
}

export function appStoreConnectAppStoreVersionsUrl(): string {
  return `${BASE}/appStoreVersions`;
}
