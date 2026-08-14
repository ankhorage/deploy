import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';

const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3';

export function googlePlayTrackReleasesUrl(
  packageName: string,
  track: AndroidDeploymentTrack,
): string {
  const app = encodeURIComponent(packageName);
  const encodedTrack = encodeURIComponent(track);
  return `${API}/applications/${app}/tracks/${encodedTrack}/releases`;
}
