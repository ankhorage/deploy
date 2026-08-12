import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { AppStoreConnectPublicationResult } from './AppStoreConnectPublicationResult';
import { trackAppStoreConnectRequests } from './AppStoreConnectRequestTracker';
import type { AppStoreConnectTokenFactory } from './AppStoreConnectTokenFactory';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import type { AppStoreUploadTransport } from './AppStoreUploadTransport';
import { attachAppStoreVersionBuild } from './attachAppStoreVersionBuild';
import { commitAppStoreBuildUploadFile } from './commitAppStoreBuildUploadFile';
import { createAppStoreBuildUpload } from './createAppStoreBuildUpload';
import { executeBuildUploadOperations } from './executeBuildUploadOperations';
import { prepareAppStoreVersion } from './prepareAppStoreVersion';
import { reserveAppStoreBuildUploadFile } from './reserveAppStoreBuildUploadFile';
import { resolveAppStoreConnectToken } from './resolveAppStoreConnectToken';
import { waitForAppStoreBuildUpload } from './waitForAppStoreBuildUpload';

export async function publishIosToAppStoreConnect(options: {
  readonly appId: string;
  readonly version: string;
  readonly buildNumber: string;
  readonly file: Buffer;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: AppStoreConnectTokenFactory;
  readonly request: AppStoreConnectTransport;
  readonly upload: AppStoreUploadTransport;
  readonly wait: () => Promise<void>;
  readonly maxAttempts: number;
  readonly now: Date;
}): Promise<AppStoreConnectPublicationResult> {
  const access = await resolveAppStoreConnectToken(options);
  if (!access.ok) return { status: 'action-required', action: access.action };
  const tracked = trackAppStoreConnectRequests(options.request);
  const buildUploadId = await createAppStoreBuildUpload({
    ...options,
    token: access.token,
    request: tracked.request,
  });
  if (buildUploadId === null) return providerFailure(tracked.blockingStatus(), 'APP_STORE_BUILD_UPLOAD_CREATE_FAILED');
  const reservation = await reserveAppStoreBuildUploadFile({
    buildUploadId,
    fileSize: options.file.length,
    token: access.token,
    request: tracked.request,
  });
  if (reservation === null) return providerFailure(tracked.blockingStatus(), 'APP_STORE_BUILD_UPLOAD_FILE_FAILED');
  const uploaded = await executeBuildUploadOperations({
    file: options.file,
    operations: reservation.operations,
    upload: options.upload,
  });
  if (!uploaded) return failure('APP_STORE_BUILD_UPLOAD_TRANSFER_FAILED');
  const committed = await commitAppStoreBuildUploadFile({
    fileId: reservation.fileId,
    token: access.token,
    request: tracked.request,
  });
  if (!committed) return providerFailure(tracked.blockingStatus(), 'APP_STORE_BUILD_UPLOAD_COMMIT_FAILED');
  return finishPublication(options, access.token, buildUploadId, tracked);
}

async function finishPublication(
  options: Parameters<typeof publishIosToAppStoreConnect>[0],
  token: string,
  buildUploadId: string,
  tracked: ReturnType<typeof trackAppStoreConnectRequests>,
): Promise<AppStoreConnectPublicationResult> {
  const build = await waitForAppStoreBuildUpload({
    buildUploadId,
    expectedBuildNumber: options.buildNumber,
    token,
    request: tracked.request,
    wait: options.wait,
    maxAttempts: options.maxAttempts,
  });
  if (build === null) return providerFailure(tracked.blockingStatus(), 'APP_STORE_BUILD_PROCESSING_FAILED');
  const versionId = await prepareAppStoreVersion({
    ...options,
    token,
    request: tracked.request,
  });
  if (versionId === null) return providerFailure(tracked.blockingStatus(), 'APP_STORE_VERSION_PREPARATION_FAILED');
  const attached = await attachAppStoreVersionBuild({
    versionId,
    buildId: build.buildId,
    token,
    request: tracked.request,
  });
  if (!attached) return providerFailure(tracked.blockingStatus(), 'APP_STORE_VERSION_BUILD_ATTACH_FAILED');
  return {
    status: 'completed',
    publication: {
      buildId: build.buildId,
      versionId,
      buildNumber: options.buildNumber,
      version: options.version,
    },
  };
}

function providerFailure(
  status: ReturnType<ReturnType<typeof trackAppStoreConnectRequests>['blockingStatus']>,
  code: string,
): AppStoreConnectPublicationResult {
  if (status === 401) return authenticationRequired();
  if (status === 403) return permissionRequired();
  return failure(code);
}

function authenticationRequired(): AppStoreConnectPublicationResult {
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

function permissionRequired(): AppStoreConnectPublicationResult {
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

function failure(code: string): AppStoreConnectPublicationResult {
  return {
    status: 'failed',
    failure: {
      code,
      message: 'App Store Connect iOS publication failed.',
      target: 'ios',
      provider: 'app-store-connect',
    },
  };
}
