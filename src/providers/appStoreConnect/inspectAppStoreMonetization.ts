import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { MonetizationDesiredState } from '../../domain/monetization/MonetizationDesiredState';
import { trackAppStoreConnectRequests } from './AppStoreConnectRequestTracker';
import type { AppStoreConnectTokenFactory } from './AppStoreConnectTokenFactory';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import type { AppStoreMonetizationInspectionResult } from './AppStoreMonetizationResult';
import { normalizeAppStoreMonetization } from './normalizeAppStoreMonetization';
import { readAppStoreMonetizationSnapshot } from './readAppStoreMonetizationSnapshot';
import { resolveAppStoreConnectToken } from './resolveAppStoreConnectToken';

export async function inspectAppStoreMonetization(options: {
  readonly bundleIdentifier: string;
  readonly desired: MonetizationDesiredState;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: AppStoreConnectTokenFactory;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<AppStoreMonetizationInspectionResult> {
  const access = await resolveAppStoreConnectToken(options);
  if (!access.ok) return { status: 'action-required', action: access.action };
  const tracker = trackAppStoreConnectRequests(options.request);
  const snapshot = await readAppStoreMonetizationSnapshot({
    bundleIdentifier: options.bundleIdentifier,
    desired: options.desired,
    token: access.token,
    request: tracker.request,
    now: options.now,
  });
  if (snapshot === 'app-required') return appRequired();
  if (snapshot === null) return providerFailure(tracker.blockingStatus());
  return { status: 'completed', state: normalizeAppStoreMonetization(options.desired, snapshot) };
}

function providerFailure(status: 401 | 403 | null): AppStoreMonetizationInspectionResult {
  if (status === 401) return action('authentication', 'APP_STORE_CONNECT_AUTHENTICATION_REQUIRED');
  if (status === 403) return action('manual-action', 'APP_STORE_MONETIZATION_PERMISSION_REQUIRED');
  return {
    status: 'failed',
    failure: {
      code: 'APP_STORE_MONETIZATION_INSPECTION_FAILED',
      message: 'App Store monetization state could not be inspected.',
      target: 'ios',
      provider: 'app-store-connect',
    },
  };
}

function appRequired(): AppStoreMonetizationInspectionResult {
  return action('manual-action', 'APP_STORE_APP_REQUIRED');
}

function action(
  type: 'authentication' | 'manual-action',
  code: string,
): AppStoreMonetizationInspectionResult {
  return {
    status: 'action-required',
    action: {
      type,
      provider: 'app-store-connect',
      target: 'ios',
      code,
      message: 'App Store monetization requires provider action.',
    },
  };
}
