import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreReviewSubmissionsCollectionUrl } from './appStoreReleaseUrls';

export async function createAppStoreReviewSubmission(options: {
  readonly appId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<string | null> {
  const response = await options.request({
    method: 'POST',
    url: appStoreReviewSubmissionsCollectionUrl(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'reviewSubmissions',
        relationships: {
          app: { data: { type: 'apps', id: options.appId } },
        },
      },
    }),
  });
  if (response.status < 200 || response.status >= 300) return null;
  return parseCreatedId(response.body, 'reviewSubmissions');
}

function parseCreatedId(body: string, type: string): string | null {
  try {
    const value: unknown = JSON.parse(body);
    if (!isRecord(value) || !isRecord(value.data)) return null;
    return value.data.type === type && isNonEmptyString(value.data.id) ? value.data.id : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
