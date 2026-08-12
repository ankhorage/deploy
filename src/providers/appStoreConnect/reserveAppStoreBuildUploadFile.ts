import type { BuildUploadFileReservation } from './BuildUploadOperation';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreConnectBuildUploadFilesUrl } from './appStoreConnectUrls';
import { parseBuildUploadFileReservation } from './parseBuildUploadFileReservation';

export async function reserveAppStoreBuildUploadFile(options: {
  readonly buildUploadId: string;
  readonly fileSize: number;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<BuildUploadFileReservation | null> {
  const body = JSON.stringify({
    data: {
      type: 'buildUploadFiles',
      attributes: {
        assetType: 'ASSET',
        fileName: 'application.ipa',
        fileSize: options.fileSize,
      },
      relationships: {
        buildUpload: { data: { type: 'buildUploads', id: options.buildUploadId } },
      },
    },
  });
  const response = await options.request({
    method: 'POST', url: appStoreConnectBuildUploadFilesUrl(), token: options.token, body,
  });
  if (response.status !== 201) return null;
  try {
    return parseBuildUploadFileReservation(JSON.parse(response.body) as unknown, options.fileSize);
  } catch {
    return null;
  }
}
