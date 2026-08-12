import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import {
  appStoreConnectAppStoreVersionsUrl,
  appStoreConnectVersionsUrl,
} from './appStoreConnectUrls';

export async function prepareAppStoreVersion(options: {
  readonly appId: string;
  readonly version: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<string | null> {
  const existing = await findVersion(options);
  if (existing !== undefined) return existing;
  const body = JSON.stringify({
    data: {
      type: 'appStoreVersions',
      attributes: { platform: 'IOS', versionString: options.version, releaseType: 'MANUAL' },
      relationships: { app: { data: { type: 'apps', id: options.appId } } },
    },
  });
  const response = await options.request({
    method: 'POST', url: appStoreConnectAppStoreVersionsUrl(), token: options.token, body,
  });
  return response.status === 201 ? parseCreatedVersion(response.body, options.version) : null;
}

async function findVersion(options: {
  readonly appId: string;
  readonly version: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<string | null | undefined> {
  const response = await options.request({
    method: 'GET', url: appStoreConnectVersionsUrl(options.appId), token: options.token,
  });
  if (response.status < 200 || response.status >= 300) return null;
  try {
    const value = JSON.parse(response.body) as unknown;
    if (!isRecord(value) || !Array.isArray(value.data)) return null;
    const matches = value.data.filter((item) => isVersion(item, options.version));
    if (matches.length === 0) return undefined;
    if (matches.length !== 1 || !isRecord(matches[0]) || !isNonEmptyString(matches[0].id)) return null;
    return matches[0].id;
  } catch {
    return null;
  }
}

function parseCreatedVersion(body: string, expectedVersion: string): string | null {
  try {
    const value = JSON.parse(body) as unknown;
    if (!isRecord(value) || !isRecord(value.data) || !isVersion(value.data, expectedVersion)) return null;
    return isNonEmptyString(value.data.id) ? value.data.id : null;
  } catch {
    return null;
  }
}

function isVersion(value: unknown, expectedVersion: string): boolean {
  if (!isRecord(value) || value.type !== 'appStoreVersions' || !isRecord(value.attributes)) return false;
  return value.attributes.platform === 'IOS' && value.attributes.versionString === expectedVersion;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
