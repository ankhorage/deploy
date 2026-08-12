import type { AndroidDeploymentTrack } from '../../domain/AndroidDeploymentIntent';
import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { GooglePlayTokenFactory } from './GooglePlayTokenFactory';
import type { GooglePlayTrackState } from './GooglePlayTrackState';
import { parseGooglePlayTrackState } from './GooglePlayTrackState';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { resolveGooglePlayAccessToken } from './resolveGooglePlayAccessToken';

export type GooglePlayTrackInspectionResult =
  | { readonly status: 'completed'; readonly state: GooglePlayTrackState }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };

export async function inspectGooglePlayTrack(options: {
  readonly packageName: string;
  readonly track: AndroidDeploymentTrack;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: GooglePlayTokenFactory;
  readonly request: GooglePlayTransport;
}): Promise<GooglePlayTrackInspectionResult> {
  const access = await resolveGooglePlayAccessToken(options);
  if (!access.ok) return { status: 'action-required', action: access.action };
  const response = await safelyRequest(options, access.token);
  if (response === null) return failure('GOOGLE_PLAY_INSPECTION_FAILED');
  if (response.status === 401) return { status: 'action-required', action: authenticationAction() };
  if (response.status === 403) return { status: 'action-required', action: permissionAction() };
  if (response.status === 404) return { status: 'action-required', action: bootstrapAction() };
  if (response.status < 200 || response.status >= 300) return failure('GOOGLE_PLAY_INSPECTION_FAILED');
  const state = parseResponse(response.body, options.track);
  return state === null ? failure('GOOGLE_PLAY_INVALID_RESULT') : { status: 'completed', state };
}

async function safelyRequest(options: Parameters<typeof inspectGooglePlayTrack>[0], token: string) {
  try {
    return await options.request({ method: 'GET', url: trackUrl(options), token });
  } catch {
    return null;
  }
}

function trackUrl(options: { readonly packageName: string; readonly track: AndroidDeploymentTrack }) {
  const app = encodeURIComponent(options.packageName);
  const track = encodeURIComponent(options.track);
  return `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${app}/tracks/${track}/releases`;
}

function parseResponse(body: string, track: AndroidDeploymentTrack): GooglePlayTrackState | null {
  try {
    return parseGooglePlayTrackState(JSON.parse(body), track);
  } catch {
    return null;
  }
}

function authenticationAction(): DeploymentRequiredAction {
  return {
    type: 'authentication',
    provider: 'google-play',
    target: 'android',
    code: 'GOOGLE_PLAY_AUTHENTICATION_REQUIRED',
    message: 'Google Play authentication is required for Android deployment.',
  };
}

function permissionAction(): DeploymentRequiredAction {
  return {
    type: 'manual-action',
    provider: 'google-play',
    target: 'android',
    code: 'GOOGLE_PLAY_PERMISSION_REQUIRED',
    message: 'Grant the service account permission to manage this application in Google Play Console.',
  };
}

function bootstrapAction(): DeploymentRequiredAction {
  return {
    type: 'manual-action',
    provider: 'google-play',
    target: 'android',
    code: 'GOOGLE_PLAY_APP_BOOTSTRAP_REQUIRED',
    message: 'Create and bootstrap the Android application in Google Play Console before API delivery.',
  };
}

function failure(code: string): GooglePlayTrackInspectionResult {
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
