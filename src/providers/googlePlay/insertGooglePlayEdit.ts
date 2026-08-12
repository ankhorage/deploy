import type { GooglePlayTransport } from './GooglePlayTransport';
import { googlePlayInsertEditUrl } from './googlePlayUrls';

export async function insertGooglePlayEdit(options: {
  readonly packageName: string;
  readonly token: string;
  readonly request: GooglePlayTransport;
}): Promise<string | null> {
  let response;
  try {
    response = await options.request({
      method: 'POST',
      url: googlePlayInsertEditUrl(options.packageName),
      token: options.token,
      contentType: 'application/json',
      body: '{}',
    });
  } catch {
    return null;
  }
  if (response.status < 200 || response.status >= 300) return null;
  try {
    const parsed: unknown = JSON.parse(response.body);
    return isRecord(parsed) && isNonEmptyString(parsed.id) ? parsed.id : null;
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
