import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreConnectVersionBuildRelationshipUrl } from './appStoreConnectUrls';

export async function attachAppStoreVersionBuild(options: {
  readonly versionId: string;
  readonly buildId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<boolean> {
  const body = JSON.stringify({ data: { type: 'builds', id: options.buildId } });
  const response = await options.request({
    method: 'PATCH',
    url: appStoreConnectVersionBuildRelationshipUrl(options.versionId),
    token: options.token,
    body,
  });
  return response.status >= 200 && response.status < 300;
}
