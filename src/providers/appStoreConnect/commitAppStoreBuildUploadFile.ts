import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreConnectBuildUploadFileUrl } from './appStoreConnectUrls';

export async function commitAppStoreBuildUploadFile(options: {
  readonly fileId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<boolean> {
  const body = JSON.stringify({
    data: {
      type: 'buildUploadFiles',
      id: options.fileId,
      attributes: { uploaded: true },
    },
  });
  const response = await options.request({
    method: 'PATCH',
    url: appStoreConnectBuildUploadFileUrl(options.fileId),
    token: options.token,
    body,
  });
  return response.status >= 200 && response.status < 300;
}
