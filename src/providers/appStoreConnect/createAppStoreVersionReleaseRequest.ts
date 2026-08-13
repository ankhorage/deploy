import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreVersionReleaseRequestsUrl } from './appStoreReleaseUrls';

export async function createAppStoreVersionReleaseRequest(options: {
  readonly versionId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<boolean> {
  const response = await options.request({
    method: 'POST',
    url: appStoreVersionReleaseRequestsUrl(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'appStoreVersionReleaseRequests',
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
