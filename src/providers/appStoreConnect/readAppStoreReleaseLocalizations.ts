import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import type { AppStoreReleaseLocalizationResource } from './AppStoreReleaseLocalizationResource';
import { appStoreReleaseNotesUrl } from './appStoreReleaseUrls';
import { parseAppStoreReleaseLocalizations } from './parseAppStoreReleaseLocalizations';

export async function readAppStoreReleaseLocalizations(options: {
  readonly versionId: string;
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<readonly AppStoreReleaseLocalizationResource[] | null> {
  const response = await options.request({
    method: 'GET',
    url: appStoreReleaseNotesUrl(options.versionId),
    token: options.token,
  });
  if (response.status < 200 || response.status >= 300) return null;
  try {
    return parseAppStoreReleaseLocalizations(JSON.parse(response.body) as unknown);
  } catch {
    return null;
  }
}
