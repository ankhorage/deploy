import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import { trackAppStoreConnectRequests } from './AppStoreConnectRequestTracker';
import type { AppStoreConnectTokenFactory } from './AppStoreConnectTokenFactory';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { appStoreConnectAppsUrl } from './appStoreConnectUrls';
import type { AppStoreReleaseSnapshot } from './AppStoreReleaseSnapshot';
import {
  appStorePhasedReleaseUrl,
  appStoreReleaseNotesUrl,
  appStoreReleaseVersionsUrl,
  appStoreReviewSubmissionsUrl,
} from './appStoreReleaseUrls';
import { parseAppStoreAppId } from './parseAppStoreAppId';
import { parseAppStorePhasedRelease } from './parseAppStorePhasedRelease';
import { parseAppStoreReleaseNotes } from './parseAppStoreReleaseNotes';
import { parseAppStoreReleaseVersion } from './parseAppStoreReleaseVersion';
import { parseAppStoreReviewSubmission } from './parseAppStoreReviewSubmission';
import { readAppStoreReleaseJson } from './readAppStoreReleaseJson';
import { resolveAppStoreConnectToken } from './resolveAppStoreConnectToken';

type AppStoreReleaseInspectionResult =
  | { readonly status: 'completed'; readonly state: AppStoreReleaseSnapshot }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction }
  | { readonly status: 'failed'; readonly failure: DeploymentFailure };

export async function inspectAppStoreReleaseState(options: {
  readonly bundleIdentifier: string;
  readonly version: string;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: AppStoreConnectTokenFactory;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<AppStoreReleaseInspectionResult> {
  const access = await resolveAppStoreConnectToken(options);
  if (!access.ok) return { status: 'action-required', action: access.action };
  const tracker = trackAppStoreConnectRequests(options.request);
  const appId = await readAppId(options, access.token, tracker.request);
  if (appId === false) return providerFailure(tracker.blockingStatus());
  if (appId === null) return appRequired();
  const version = await readVersion(options, appId, access.token, tracker.request);
  if (version === 'failed') return providerFailure(tracker.blockingStatus());
  if (version === null) return emptySnapshot(appId, options.version);
  return readVersionDetails(options, appId, version, access.token, tracker.request);
}

async function readAppId(
  options: Parameters<typeof inspectAppStoreReleaseState>[0],
  token: string,
  request: AppStoreConnectTransport,
): Promise<string | null | false> {
  const result = await readAppStoreReleaseJson({
    url: appStoreConnectAppsUrl(options.bundleIdentifier),
    token,
    request,
  });
  if (result === null || result.status < 200 || result.status >= 300) return false;
  return parseAppStoreAppId(result.value, options.bundleIdentifier);
}

async function readVersion(
  options: Parameters<typeof inspectAppStoreReleaseState>[0],
  appId: string,
  token: string,
  request: AppStoreConnectTransport,
): Promise<
  | { readonly versionId: string; readonly appVersionState: string; readonly releaseType?: string }
  | null
  | 'failed'
> {
  const result = await readAppStoreReleaseJson({
    url: appStoreReleaseVersionsUrl(appId),
    token,
    request,
  });
  if (result === null || result.status < 200 || result.status >= 300) return 'failed';
  const parsed = parseAppStoreReleaseVersion(result.value, options.version);
  return parsed === undefined ? 'failed' : parsed;
}

async function readVersionDetails(
  options: Parameters<typeof inspectAppStoreReleaseState>[0],
  appId: string,
  version: {
    readonly versionId: string;
    readonly appVersionState: string;
    readonly releaseType?: string;
  },
  token: string,
  request: AppStoreConnectTransport,
): Promise<AppStoreReleaseInspectionResult> {
  const notes = await readNotes(version.versionId, token, request);
  if (notes === null) return failed('APP_STORE_RELEASE_RESPONSE_INVALID');
  const review = await readReview(appId, version.versionId, token, request);
  if (review === undefined) return failed('APP_STORE_RELEASE_RESPONSE_INVALID');
  const phased = await readPhased(version.versionId, token, request);
  if (phased === undefined) return failed('APP_STORE_RELEASE_RESPONSE_INVALID');
  return {
    status: 'completed',
    state: {
      appId,
      version: options.version,
      versionId: version.versionId,
      appVersionState: version.appVersionState,
      ...(version.releaseType === undefined ? {} : { releaseType: version.releaseType }),
      releaseNotes: notes,
      reviewSubmission: review,
      phasedRelease: phased,
    },
  };
}

async function readNotes(
  versionId: string,
  token: string,
  request: AppStoreConnectTransport,
): Promise<AppStoreReleaseSnapshot['releaseNotes'] | null> {
  const result = await readAppStoreReleaseJson({
    url: appStoreReleaseNotesUrl(versionId),
    token,
    request,
  });
  if (result === null || result.status < 200 || result.status >= 300) return null;
  return parseAppStoreReleaseNotes(result.value);
}

async function readReview(
  appId: string,
  versionId: string,
  token: string,
  request: AppStoreConnectTransport,
): Promise<AppStoreReleaseSnapshot['reviewSubmission'] | undefined> {
  const result = await readAppStoreReleaseJson({
    url: appStoreReviewSubmissionsUrl(appId),
    token,
    request,
  });
  if (result === null || result.status < 200 || result.status >= 300) return undefined;
  return parseAppStoreReviewSubmission(result.value, versionId);
}

async function readPhased(
  versionId: string,
  token: string,
  request: AppStoreConnectTransport,
): Promise<AppStoreReleaseSnapshot['phasedRelease'] | undefined> {
  const result = await readAppStoreReleaseJson({
    url: appStorePhasedReleaseUrl(versionId),
    token,
    request,
  });
  if (result === null) return undefined;
  if (result.status === 404) return null;
  if (result.status < 200 || result.status >= 300) return undefined;
  return parseAppStorePhasedRelease(result.value);
}

function emptySnapshot(appId: string, version: string): AppStoreReleaseInspectionResult {
  return {
    status: 'completed',
    state: {
      appId,
      version,
      versionId: null,
      releaseNotes: [],
      reviewSubmission: null,
      phasedRelease: null,
    },
  };
}

function providerFailure(status: 401 | 403 | null): AppStoreReleaseInspectionResult {
  if (status === 401) return action('authentication', 'APP_STORE_CONNECT_AUTHENTICATION_REQUIRED');
  if (status === 403) return action('manual-action', 'APP_STORE_CONNECT_PERMISSION_REQUIRED');
  return failed('APP_STORE_RELEASE_INSPECTION_FAILED');
}

function appRequired(): AppStoreReleaseInspectionResult {
  return action('manual-action', 'APP_STORE_APP_REQUIRED');
}

function action(
  type: 'authentication' | 'manual-action',
  code: string,
): AppStoreReleaseInspectionResult {
  return {
    status: 'action-required',
    action: {
      type,
      provider: 'app-store-connect',
      target: 'ios',
      code,
      message: 'App Store release inspection requires provider action.',
    },
  };
}

function failed(code: string): AppStoreReleaseInspectionResult {
  return {
    status: 'failed',
    failure: {
      code,
      message: 'App Store release state could not be inspected.',
      target: 'ios',
      provider: 'app-store-connect',
    },
  };
}
