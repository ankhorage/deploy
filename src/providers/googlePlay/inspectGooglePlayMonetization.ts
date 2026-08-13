import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import type { GooglePlayMonetizationInspectionResult } from './GooglePlayMonetizationResult';
import { trackGooglePlayRequests } from './GooglePlayRequestTracker';
import type { GooglePlayTokenFactory } from './GooglePlayTokenFactory';
import type { GooglePlayTransport } from './GooglePlayTransport';
import { normalizeGooglePlayMonetization } from './normalizeGooglePlayMonetization';
import { readGooglePlayMonetizationResources } from './readGooglePlayMonetizationResources';
import { resolveGooglePlayAccessToken } from './resolveGooglePlayAccessToken';

export async function inspectGooglePlayMonetization(options: {
  readonly packageName: string;
  readonly desired: MonetizationDesiredState;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: GooglePlayTokenFactory;
  readonly request: GooglePlayTransport;
}): Promise<GooglePlayMonetizationInspectionResult> {
  const access = await resolveGooglePlayAccessToken(options);
  if (!access.ok) return { status: 'action-required', action: access.action };
  const tracker = trackGooglePlayRequests(options.request);
  const resources = await readGooglePlayMonetizationResources({
    packageName: options.packageName,
    token: access.token,
    request: tracker.request,
  });
  if (resources === null) return providerFailure(tracker.blockingStatus());
  return {
    status: 'completed',
    state: normalizeGooglePlayMonetization({ desired: options.desired, ...resources }),
  };
}

function providerFailure(status: 401 | 403 | null): GooglePlayMonetizationInspectionResult {
  if (status === 401) return action('authentication', 'GOOGLE_PLAY_AUTHENTICATION_REQUIRED');
  if (status === 403)
    return action('manual-action', 'GOOGLE_PLAY_MONETIZATION_PERMISSION_REQUIRED');
  return {
    status: 'failed',
    failure: {
      code: 'GOOGLE_PLAY_MONETIZATION_INSPECTION_FAILED',
      message: 'Google Play monetization state could not be inspected.',
      target: 'android',
      provider: 'google-play',
    },
  };
}

function action(
  type: 'authentication' | 'manual-action',
  code: string,
): GooglePlayMonetizationInspectionResult {
  return {
    status: 'action-required',
    action: {
      type,
      provider: 'google-play',
      target: 'android',
      code,
      message: 'Google Play monetization access requires provider action.',
    },
  };
}
