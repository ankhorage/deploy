import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreConnectVersionBuildUrl } from './appStoreConnectUrls';

export async function verifyAppStoreVersionBuild(options: {
  readonly versionId: string;
  readonly buildId: string;
  readonly buildNumber: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<boolean> {
  const response = await options.request({
    method: 'GET',
    url: appStoreConnectVersionBuildUrl(options.versionId),
    token: options.token,
  });
  if (response.status < 200 || response.status >= 300) return false;
  try {
    const value = JSON.parse(response.body) as unknown;
    if (!isRecord(value) || !isRecord(value.data) || !isRecord(value.data.attributes)) return false;
    return (
      value.data.type === 'builds' &&
      value.data.id === options.buildId &&
      value.data.attributes.version === options.buildNumber &&
      value.data.attributes.processingState === 'VALID'
    );
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
