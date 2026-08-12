import type { GooglePlayTransport } from './GooglePlayTransport';
import { googlePlayCommitEditUrl } from './googlePlayUrls';

export async function commitGooglePlayEdit(options: {
  readonly packageName: string;
  readonly editId: string;
  readonly token: string;
  readonly request: GooglePlayTransport;
}): Promise<boolean> {
  try {
    const response = await options.request({
      method: 'POST',
      url: googlePlayCommitEditUrl(options.packageName, options.editId),
      token: options.token,
      contentType: 'application/json',
      body: '{}',
    });
    return response.status >= 200 && response.status < 300;
  } catch {
    return false;
  }
}
