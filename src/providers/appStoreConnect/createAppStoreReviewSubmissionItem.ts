import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreReviewSubmissionItemsUrl } from './appStoreReleaseUrls';

export async function createAppStoreReviewSubmissionItem(options: {
  readonly reviewSubmissionId: string;
  readonly versionId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<boolean> {
  const response = await options.request({
    method: 'POST',
    url: appStoreReviewSubmissionItemsUrl(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: {
            data: { type: 'reviewSubmissions', id: options.reviewSubmissionId },
          },
          appStoreVersion: {
            data: { type: 'appStoreVersions', id: options.versionId },
          },
        },
      },
    }),
  });
  return response.status >= 200 && response.status < 300;
}
