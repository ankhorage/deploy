import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStorePhasedReleaseMutationUrl } from './appStoreReleaseUrls';

export async function updateAppStorePhasedReleaseState(options: {
  readonly phasedReleaseId: string;
  readonly state: 'ACTIVE' | 'PAUSED';
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<boolean> {
  const response = await options.request({
    method: 'PATCH',
    url: appStorePhasedReleaseMutationUrl(options.phasedReleaseId),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'appStoreVersionPhasedReleases',
        id: options.phasedReleaseId,
        attributes: { phasedReleaseState: options.state },
      },
    }),
  });
  return response.status >= 200 && response.status < 300;
}
