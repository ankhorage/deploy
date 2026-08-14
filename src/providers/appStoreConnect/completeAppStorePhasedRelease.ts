import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStorePhasedReleaseMutationUrl } from './appStoreReleaseUrls';

export async function completeAppStorePhasedRelease(options: {
  readonly phasedReleaseId: string;
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
        attributes: { phasedReleaseState: 'COMPLETE' },
      },
    }),
  });
  return response.status >= 200 && response.status < 300;
}
