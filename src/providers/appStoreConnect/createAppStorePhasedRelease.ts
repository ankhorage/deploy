import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStorePhasedReleasesUrl } from './appStoreReleaseUrls';

export async function createAppStorePhasedRelease(options: {
  readonly versionId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<boolean> {
  const response = await options.request({
    method: 'POST',
    url: appStorePhasedReleasesUrl(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'appStoreVersionPhasedReleases',
        attributes: { phasedReleaseState: 'INACTIVE' },
        relationships: {
          appStoreVersion: {
            data: { type: 'appStoreVersions', id: options.versionId },
          },
        },
      },
    }),
  });
  return response.status >= 200 && response.status < 300;
}
