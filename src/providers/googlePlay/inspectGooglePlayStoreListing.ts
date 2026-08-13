import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { StoreListingDesiredState } from '../../domain/storeListing/StoreListingDesiredState';
import { createGooglePlayListingDiagnostics } from './createGooglePlayListingDiagnostics';
import { googlePlayListingsUrl } from './googlePlayListingUrls';
import { trackGooglePlayRequests } from './GooglePlayRequestTracker';
import { GOOGLE_PLAY_STORE_LISTING_FIELDS } from './googlePlayStoreListingFields';
import type { GooglePlayStoreListingInspectionResult } from './GooglePlayStoreListingResult';
import type { GooglePlayTokenFactory } from './GooglePlayTokenFactory';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { insertGooglePlayEdit } from './insertGooglePlayEdit';
import { parseGooglePlayListings } from './parseGooglePlayListings';
import { readGooglePlayAssetSets } from './readGooglePlayAssetSets';
import { resolveGooglePlayAccessToken } from './resolveGooglePlayAccessToken';

export async function inspectGooglePlayStoreListing(options: {
  readonly packageName: string;
  readonly desired: StoreListingDesiredState;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: GooglePlayTokenFactory;
  readonly request: GooglePlayTransport;
}): Promise<GooglePlayStoreListingInspectionResult> {
  const access = await resolveGooglePlayAccessToken(options);
  if (!access.ok) return { status: 'action-required', action: access.action };
  const tracker = trackGooglePlayRequests(options.request);
  const editId = await insertGooglePlayEdit({
    ...options,
    token: access.token,
    request: tracker.request,
  });
  if (editId === null) return providerFailure(tracker.blockingStatus());
  return inspectEdit(options, editId, access.token, tracker);
}

async function inspectEdit(
  options: Parameters<typeof inspectGooglePlayStoreListing>[0],
  editId: string,
  token: string,
  tracker: ReturnType<typeof trackGooglePlayRequests>,
): Promise<GooglePlayStoreListingInspectionResult> {
  const response = await tracker.request({
    method: 'GET',
    url: googlePlayListingsUrl(options.packageName, editId),
    token,
  });
  if (response.status < 200 || response.status >= 300) {
    return providerFailure(tracker.blockingStatus());
  }
  const locales = parseListings(response.body, options.desired);
  if (locales === null) return failed();
  const assetSets = await readGooglePlayAssetSets({
    ...options,
    editId,
    token,
    request: tracker.request,
  });
  if (assetSets === null) return providerFailure(tracker.blockingStatus());
  return {
    status: 'completed',
    state: {
      target: 'android',
      locales,
      assetSets,
      supportedFields: GOOGLE_PLAY_STORE_LISTING_FIELDS,
      diagnostics: createGooglePlayListingDiagnostics(options.desired),
    },
  };
}

function parseListings(body: string, desired: StoreListingDesiredState) {
  try {
    const value: unknown = JSON.parse(body);
    return parseGooglePlayListings(value, new Set(desired.locales.map((item) => item.locale)));
  } catch {
    return null;
  }
}

function providerFailure(status: 401 | 403 | null): GooglePlayStoreListingInspectionResult {
  if (status === 401) return authenticationRequired();
  if (status === 403) return permissionRequired();
  return failed();
}

function authenticationRequired(): GooglePlayStoreListingInspectionResult {
  return {
    status: 'action-required',
    action: {
      type: 'authentication',
      provider: 'google-play',
      target: 'android',
      code: 'GOOGLE_PLAY_AUTHENTICATION_REQUIRED',
      message: 'Google Play authentication is required for store listing synchronization.',
    },
  };
}

function permissionRequired(): GooglePlayStoreListingInspectionResult {
  return {
    status: 'action-required',
    action: {
      type: 'manual-action',
      provider: 'google-play',
      target: 'android',
      code: 'GOOGLE_PLAY_LISTING_PERMISSION_REQUIRED',
      message: 'The Google Play service account needs store listing permissions.',
    },
  };
}

function failed(): GooglePlayStoreListingInspectionResult {
  return {
    status: 'failed',
    failure: {
      code: 'GOOGLE_PLAY_LISTING_INSPECTION_FAILED',
      message: 'Google Play store listing state could not be inspected.',
      target: 'android',
      provider: 'google-play',
    },
  };
}
