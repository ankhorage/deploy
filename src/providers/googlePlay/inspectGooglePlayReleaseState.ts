import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';
import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { GooglePlayReleaseSnapshot } from './GooglePlayReleaseSnapshot';
import { googlePlayTrackReleasesUrl } from './googlePlayReleaseUrls';
import { trackGooglePlayRequests } from './GooglePlayRequestTracker';
import type { GooglePlayTokenFactory } from './GooglePlayTokenFactory';
import { parseGooglePlayTrackState } from './GooglePlayTrackState';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { googlePlayTrackEditUrl } from './googlePlayUrls';
import { insertGooglePlayEdit } from './insertGooglePlayEdit';
import { parseGooglePlayConfiguredTrack } from './parseGooglePlayConfiguredTrack';
import { resolveGooglePlayAccessToken } from './resolveGooglePlayAccessToken';

type GooglePlayReleaseInspectionResult =
  | { readonly status: 'completed'; readonly state: GooglePlayReleaseSnapshot }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };

export async function inspectGooglePlayReleaseState(options: {
  readonly packageName: string;
  readonly track: AndroidDeploymentTrack;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: GooglePlayTokenFactory;
  readonly request: GooglePlayTransport;
}): Promise<GooglePlayReleaseInspectionResult> {
  const access = await resolveGooglePlayAccessToken(options);
  if (!access.ok) return { status: 'action-required', action: access.action };
  const tracker = trackGooglePlayRequests(options.request);
  const summary = await readSummary(options, access.token, tracker.request);
  if (!summary.ok) return providerResult(summary.status, tracker.blockingStatus());
  const editId = await insertGooglePlayEdit({
    packageName: options.packageName,
    token: access.token,
    request: tracker.request,
  });
  if (editId === null) return providerResult(null, tracker.blockingStatus());
  return readConfigured(options, access.token, editId, summary.state, tracker.request);
}

async function readSummary(
  options: Parameters<typeof inspectGooglePlayReleaseState>[0],
  token: string,
  request: GooglePlayTransport,
): Promise<
  | { readonly ok: true; readonly state: GooglePlayReleaseSnapshot['summary'] }
  | { readonly ok: false; readonly status: number | null }
> {
  try {
    const response = await request({
      method: 'GET',
      url: googlePlayTrackReleasesUrl(options.packageName, options.track),
      token,
    });
    if (response.status < 200 || response.status >= 300) {
      return { ok: false, status: response.status };
    }
    const state = parseSummary(response.body, options.track);
    return state === null ? { ok: false, status: null } : { ok: true, state };
  } catch {
    return { ok: false, status: null };
  }
}

async function readConfigured(
  options: Parameters<typeof inspectGooglePlayReleaseState>[0],
  token: string,
  editId: string,
  summary: GooglePlayReleaseSnapshot['summary'],
  request: GooglePlayTransport,
): Promise<GooglePlayReleaseInspectionResult> {
  try {
    const response = await request({
      method: 'GET',
      url: googlePlayTrackEditUrl(options.packageName, editId, options.track),
      token,
    });
    if (response.status < 200 || response.status >= 300) {
      return providerResult(response.status, null);
    }
    const releases = parseConfigured(response.body, options.track);
    return releases === null
      ? failed('GOOGLE_PLAY_RELEASE_RESPONSE_INVALID')
      : { status: 'completed', state: { track: options.track, summary, releases } };
  } catch {
    return failed('GOOGLE_PLAY_RELEASE_INSPECTION_FAILED');
  }
}

function parseSummary(
  body: string,
  track: AndroidDeploymentTrack,
): GooglePlayReleaseSnapshot['summary'] | null {
  try {
    return parseGooglePlayTrackState(JSON.parse(body) as unknown, track);
  } catch {
    return null;
  }
}

function parseConfigured(
  body: string,
  track: AndroidDeploymentTrack,
): GooglePlayReleaseSnapshot['releases'] | null {
  try {
    return parseGooglePlayConfiguredTrack(JSON.parse(body) as unknown, track);
  } catch {
    return null;
  }
}

function providerResult(
  status: number | null,
  blocking: 401 | 403 | null,
): GooglePlayReleaseInspectionResult {
  if (blocking === 401 || status === 401)
    return action('authentication', 'GOOGLE_PLAY_AUTHENTICATION_REQUIRED');
  if (blocking === 403 || status === 403)
    return action('manual-action', 'GOOGLE_PLAY_PERMISSION_REQUIRED');
  if (status === 404) return action('manual-action', 'GOOGLE_PLAY_APP_BOOTSTRAP_REQUIRED');
  return failed('GOOGLE_PLAY_RELEASE_INSPECTION_FAILED');
}

function action(
  type: 'authentication' | 'manual-action',
  code: string,
): GooglePlayReleaseInspectionResult {
  return {
    status: 'action-required',
    action: {
      type,
      provider: 'google-play',
      target: 'android',
      code,
      message: 'Google Play release inspection requires provider action.',
    },
  };
}

function failed(code: string): GooglePlayReleaseInspectionResult {
  return {
    status: 'failed',
    failure: {
      code,
      message: 'Google Play release state could not be inspected.',
      target: 'android',
      provider: 'google-play',
    },
  };
}
