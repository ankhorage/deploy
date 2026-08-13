import { googlePlayImagesUrl } from './googlePlayListingUrls';
import type { GooglePlayTransport } from './GooglePlayTransport';

export async function readGooglePlayImages(options: {
  readonly packageName: string;
  readonly editId: string;
  readonly locale: string;
  readonly imageType: string;
  readonly token: string;
  readonly request: GooglePlayTransport;
}): Promise<readonly string[] | null> {
  const response = await options.request({
    method: 'GET',
    url: googlePlayImagesUrl(
      options.packageName,
      options.editId,
      options.locale,
      options.imageType,
    ),
    token: options.token,
  });
  if (response.status < 200 || response.status >= 300) return null;
  try {
    return readChecksums(JSON.parse(response.body) as unknown);
  } catch {
    return null;
  }
}

function readChecksums(value: unknown): readonly string[] | null {
  if (!isRecord(value) || !Array.isArray(value.images)) return null;
  const result: string[] = [];
  for (const image of value.images as unknown[]) {
    if (!isRecord(image) || typeof image.sha256 !== 'string') return null;
    result.push(image.sha256);
  }
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
