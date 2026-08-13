const BASE = 'https://api.appstoreconnect.apple.com/v1';

export function appStoreReleaseVersionsUrl(appId: string): string {
  const query = new URLSearchParams({
    'filter[platform]': 'IOS',
    'fields[appStoreVersions]': 'platform,versionString,appVersionState,releaseType',
    limit: '200',
  });
  return `${BASE}/apps/${encodeURIComponent(appId)}/appStoreVersions?${query.toString()}`;
}

export function appStoreReleaseNotesUrl(versionId: string): string {
  const query = new URLSearchParams({
    'fields[appStoreVersionLocalizations]': 'locale,whatsNew',
    limit: '200',
  });
  return `${BASE}/appStoreVersions/${encodeURIComponent(versionId)}/appStoreVersionLocalizations?${query.toString()}`;
}

export function appStoreReviewSubmissionsUrl(appId: string): string {
  const query = new URLSearchParams({
    'filter[platform]': 'IOS',
    'fields[reviewSubmissions]': 'platform,submittedDate,state,appStoreVersionForReview',
    'fields[appStoreVersions]': 'versionString,appVersionState',
    include: 'appStoreVersionForReview',
    limit: '200',
  });
  return `${BASE}/apps/${encodeURIComponent(appId)}/reviewSubmissions?${query.toString()}`;
}

export function appStorePhasedReleaseUrl(versionId: string): string {
  const query = new URLSearchParams({
    'fields[appStoreVersionPhasedReleases]':
      'phasedReleaseState,startDate,totalPauseDuration,currentDayNumber',
  });
  return `${BASE}/appStoreVersions/${encodeURIComponent(versionId)}/appStoreVersionPhasedRelease?${query.toString()}`;
}
