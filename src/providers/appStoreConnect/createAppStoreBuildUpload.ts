import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreConnectBuildUploadsUrl } from './appStoreConnectUrls';

export async function createAppStoreBuildUpload(options: {
  readonly appId: string;
  readonly version: string;
  readonly buildNumber: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<string | null> {
  const body = JSON.stringify({
    data: {
      type: 'buildUploads',
      attributes: {
        cfBundleShortVersionString: options.version,
        cfBundleVersion: options.buildNumber,
        platform: 'IOS',
      },
      relationships: { app: { data: { type: 'apps', id: options.appId } } },
    },
  });
  const response = await options.request({
    method: 'POST',
    url: appStoreConnectBuildUploadsUrl(),
    token: options.token,
    body,
  });
  if (response.status !== 201) return null;
  return parseResourceId(response.body, 'buildUploads');
}

function parseResourceId(body: string, type: string): string | null {
  try {
    const value = JSON.parse(body) as unknown;
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
  return typeof value === 'string' && value.trim().length > 0;
}
