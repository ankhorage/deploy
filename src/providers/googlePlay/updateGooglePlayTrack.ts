import type {
  AndroidDeploymentTrack,
  AndroidReleaseStatus,
} from '../../domain/AndroidDeploymentIntent';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { googlePlayTrackEditUrl } from './googlePlayUrls';

export async function updateGooglePlayTrack(options: {
  readonly packageName: string;
  readonly editId: string;
  readonly track: AndroidDeploymentTrack;
  readonly releaseStatus: AndroidReleaseStatus;
  readonly versionCode: number;
  readonly token: string;
  readonly request: GooglePlayTransport;
}): Promise<boolean> {
  const body = JSON.stringify({
    track: options.track,
    releases: [
      {
        versionCodes: [String(options.versionCode)],
        status: options.releaseStatus,
      },
    ],
  });
  try {
    const response = await options.request({
      method: 'PUT',
      url: googlePlayTrackEditUrl(options.packageName, options.editId, options.track),
      token: options.token,
      contentType: 'application/json',
      body,
    });
    return response.status >= 200 && response.status < 300;
  } catch {
    return false;
  }
}
