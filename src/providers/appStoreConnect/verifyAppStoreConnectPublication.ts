import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentRequiredAction } from '../../domain/DeploymentRequiredAction';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';
import type { AppStoreConnectPublication } from './AppStoreConnectPublicationResult';
import { trackAppStoreConnectRequests } from './AppStoreConnectRequestTracker';
import type { AppStoreConnectTokenFactory } from './AppStoreConnectTokenFactory';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import { resolveAppStoreConnectToken } from './resolveAppStoreConnectToken';
import { verifyAppStoreVersionBuild } from './verifyAppStoreVersionBuild';

export type AppStoreConnectVerificationResult =
  | { readonly status: 'completed'; readonly verification: DeploymentVerificationResult }
  | { readonly status: 'action-required'; readonly action: DeploymentRequiredAction };

export async function verifyAppStoreConnectPublication(options: {
  readonly publication: AppStoreConnectPublication;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: AppStoreConnectTokenFactory;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<AppStoreConnectVerificationResult> {
  const access = await resolveAppStoreConnectToken(options);
  if (!access.ok) return { status: 'action-required', action: access.action };
  const tracked = trackAppStoreConnectRequests(options.request);
  const verified = await verifyAppStoreVersionBuild({
    versionId: options.publication.versionId,
    buildId: options.publication.buildId,
    buildNumber: options.publication.buildNumber,
    token: access.token,
    request: tracked.request,
  });
  const status = tracked.blockingStatus();
  if (status === 401) return authenticationRequired();
  if (status === 403) return permissionRequired();
  return { status: 'completed', verification: verified ? { ok: true } : failed() };
}

function authenticationRequired(): AppStoreConnectVerificationResult {
  return {
    status: 'action-required',
    action: {
      type: 'authentication',
      provider: 'app-store-connect',
      target: 'ios',
      code: 'APP_STORE_CONNECT_AUTHENTICATION_REQUIRED',
      message: 'App Store Connect API-key authentication is required for iOS deployment.',
    },
  };
}

function permissionRequired(): AppStoreConnectVerificationResult {
  return {
    status: 'action-required',
    action: {
      type: 'manual-action',
      target: 'ios',
      provider: 'app-store-connect',
      code: 'APP_STORE_CONNECT_PERMISSION_REQUIRED',
      message: 'The App Store Connect team API key needs permission for iOS deployment.',
    },
  };
}

function failed(): DeploymentVerificationResult {
  return {
    ok: false,
    issues: [
      {
        code: 'APP_STORE_VERSION_BUILD_NOT_ATTACHED',
        message: 'The processed iOS build is not attached to the expected App Store version.',
        target: 'ios',
        provider: 'app-store-connect',
      },
    ],
  };
}
