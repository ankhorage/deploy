import type { GooglePlayTransport } from './GooglePlayTransport';
import { googlePlayBundleUploadUrl } from './googlePlayUrls';

export async function uploadGooglePlayBundle(options: {
  readonly packageName: string;
  readonly editId: string;
  readonly token: string;
  readonly filePath: string;
  readonly request: GooglePlayTransport;
}): Promise<number | null> {
  let response;
  try {
    response = await options.request({
      method: 'POST',
      url: googlePlayBundleUploadUrl(options.packageName, options.editId),
      token: options.token,
      contentType: 'application/octet-stream',
      body: Bun.file(options.filePath),
    });
  } catch {
    return null;
  }
  if (response.status < 200 || response.status >= 300) return null;
  try {
    const parsed: unknown = JSON.parse(response.body);
    if (!isRecord(parsed) || !isVersionCode(parsed.versionCode)) return null;
    return parsed.versionCode;
  } catch {
    return null;
  }
}

function isVersionCode(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
