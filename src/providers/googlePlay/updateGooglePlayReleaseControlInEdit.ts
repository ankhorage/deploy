import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';
import type { ReleaseLifecycleControl } from '../../domain/release/ReleaseLifecycleControl';
import { createGooglePlayTrackControlBody } from './createGooglePlayTrackControlBody';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { googlePlayTrackEditUrl } from './googlePlayUrls';
import { parseGooglePlayEditableTrack } from './parseGooglePlayEditableTrack';

type AndroidControl = Extract<ReleaseLifecycleControl, { target: 'android' }>;

export async function updateGooglePlayReleaseControlInEdit(options: {
  readonly packageName: string;
  readonly editId: string;
  readonly track: AndroidDeploymentTrack;
  readonly targetVersionCode: string;
  readonly control: AndroidControl;
  readonly token: string;
  readonly request: GooglePlayTransport;
}): Promise<boolean> {
  const url = googlePlayTrackEditUrl(options.packageName, options.editId, options.track);
  const current = await readTrack(options, url);
  if (current === null) return false;
  const body = createGooglePlayTrackControlBody({
    current,
    targetVersionCode: options.targetVersionCode,
    control: options.control,
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
  options: Parameters<typeof updateGooglePlayReleaseControlInEdit>[0],
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
