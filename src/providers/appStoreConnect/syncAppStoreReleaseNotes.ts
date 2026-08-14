import type { ReleaseNote } from '../../domain/release/ReleaseNote';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import type { AppStoreReleaseLocalizationResource } from './AppStoreReleaseLocalizationResource';
import {
  appStoreVersionLocalizationsUrl,
  appStoreVersionLocalizationUrl,
} from './appStoreReleaseUrls';
import { readAppStoreReleaseLocalizations } from './readAppStoreReleaseLocalizations';

export async function syncAppStoreReleaseNotes(options: {
  readonly versionId: string;
  readonly notes: readonly ReleaseNote[];
  readonly token: string;
  readonly request: AppStoreConnectTransport;
}): Promise<boolean> {
  const current = await readAppStoreReleaseLocalizations(options);
  if (current === null) return false;
  for (const note of options.notes) {
    const existing = current.find((item) => item.locale === note.locale);
    if (existing === undefined) {
      if (!(await createNote(options, note))) return false;
    } else if (existing.whatsNew !== note.text) {
      if (!(await updateNote(options, existing, note))) return false;
    }
  }
  return true;
}

async function createNote(
  options: Parameters<typeof syncAppStoreReleaseNotes>[0],
  note: ReleaseNote,
): Promise<boolean> {
  const response = await options.request({
    method: 'POST',
    url: appStoreVersionLocalizationsUrl(),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'appStoreVersionLocalizations',
        attributes: { locale: note.locale, whatsNew: note.text },
        relationships: {
          appStoreVersion: {
            data: { type: 'appStoreVersions', id: options.versionId },
          },
        },
      },
    }),
  });
  return ok(response.status);
}

async function updateNote(
  options: Parameters<typeof syncAppStoreReleaseNotes>[0],
  existing: AppStoreReleaseLocalizationResource,
  note: ReleaseNote,
): Promise<boolean> {
  const response = await options.request({
    method: 'PATCH',
    url: appStoreVersionLocalizationUrl(existing.resourceId),
    token: options.token,
    body: JSON.stringify({
      data: {
        type: 'appStoreVersionLocalizations',
        id: existing.resourceId,
        attributes: { whatsNew: note.text },
      },
    }),
  });
  return ok(response.status);
}

function ok(status: number): boolean {
  return status >= 200 && status < 300;
}
