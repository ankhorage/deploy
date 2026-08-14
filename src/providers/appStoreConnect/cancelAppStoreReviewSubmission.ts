import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreReviewSubmissionUrl } from './appStoreReleaseUrls';

export async function cancelAppStoreReviewSubmission(options: {
  readonly reviewSubmissionId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<boolean> {
  const response = await options.request({
    method: 'PATCH',
    url: appStoreReviewSubmissionUrl(options.reviewSubmissionId),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'reviewSubmissions',
        id: options.reviewSubmissionId,
        attributes: { canceled: true },
      },
    }),
  });
  return response.status >= 200 && response.status < 300;
}
