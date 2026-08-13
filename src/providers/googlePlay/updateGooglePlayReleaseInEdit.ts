import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';
import type { ReleaseNote } from '../../domain/release/ReleaseNote';
import type { ReleaseTargetRollout } from '../../domain/release/ReleaseTargetRollout';
import { createGooglePlayTrackUpdateBody } from './createGooglePlayTrackUpdateBody';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { googlePlayTrackEditUrl } from './googlePlayUrls';
import { parseGooglePlayEditableTrack } from './parseGooglePlayEditableTrack';

export async function updateGooglePlayReleaseInEdit(options: {
  readonly packageName: string;
  readonly editId: string;
  readonly track: AndroidDeploymentTrack;
  readonly targetVersionCode: string;
  readonly releaseNotes: readonly ReleaseNote[];
  readonly rollout: ReleaseTargetRollout;
  readonly token: string;
  readonly request: GooglePlayTransport;
}): Promise<boolean> {
  const url = googlePlayTrackEditUrl(options.packageName, options.editId, options.track);
  const current = await readTrack(options, url);
  if (current === null) return false;
  const body = createGooglePlayTrackUpdateBody({
    current,
    targetVersionCode: options.targetVersionCode,
    releaseNotes: options.releaseNotes,
    rollout: options.rollout,
  });
  if (body === null) return false;
  const response = await options.request({
    method: 'PUT',
    url,
    token: options.token,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
  return response.status >= 200 && response.status < 300;
}

async function readTrack(
  options: Parameters<typeof updateGooglePlayReleaseInEdit>[0],
  url: string,
) {
  const response = await options.request({ method: 'GET', url, token: options.token });
  if (response.status < 200 || response.status >= 300) return null;
  try {
    return parseGooglePlayEditableTrack(JSON.parse(response.body) as unknown, options.track);
  } catch {
    return null;
  }
}
