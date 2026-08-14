import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStorePhasedReleaseMutationUrl } from './appStoreReleaseUrls';

export async function deleteAppStorePhasedRelease(options: {
  readonly phasedReleaseId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<boolean> {
  const response = await options.request({
    method: 'DELETE',
    url: appStorePhasedReleaseMutationUrl(options.phasedReleaseId),
    token: options.token,
  });
  return response.status >= 200 && response.status < 300;
}
