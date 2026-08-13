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

export function appStoreVersionLocalizationsUrl(): string {
  return `${BASE}/appStoreVersionLocalizations`;
}

export function appStoreVersionLocalizationUrl(localizationId: string): string {
  return `${BASE}/appStoreVersionLocalizations/${encodeURIComponent(localizationId)}`;
}

export function appStoreReviewSubmissionsCollectionUrl(): string {
  return `${BASE}/reviewSubmissions`;
}

export function appStoreReviewSubmissionUrl(reviewSubmissionId: string): string {
  return `${BASE}/reviewSubmissions/${encodeURIComponent(reviewSubmissionId)}`;
}

export function appStoreReviewSubmissionItemsUrl(): string {
  return `${BASE}/reviewSubmissionItems`;
}

export function appStorePhasedReleasesUrl(): string {
  return `${BASE}/appStoreVersionPhasedReleases`;
}

export function appStoreVersionReleaseRequestsUrl(): string {
  return `${BASE}/appStoreVersionReleaseRequests`;
}
