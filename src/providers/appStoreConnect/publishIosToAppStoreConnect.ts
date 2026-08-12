import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { AppStoreConnectPublicationResult } from './AppStoreConnectPublicationResult';
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
import { verifyAppStoreVersionBuild } from './verifyAppStoreVersionBuild';
import { waitForAppStoreBuildUpload } from './waitForAppStoreBuildUpload';

export async function publishIosToAppStoreConnect(options: {
  readonly appId: string;
  readonly version: string;
  readonly buildNumber: string;
  readonly file: Blob;
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
  const buildUploadId = await createAppStoreBuildUpload({ ...options, token: access.token });
  if (buildUploadId === null) return failure('APP_STORE_BUILD_UPLOAD_CREATE_FAILED');
  const reservation = await reserveAppStoreBuildUploadFile({
    buildUploadId, fileSize: options.file.size, token: access.token, request: options.request,
  });
  if (reservation === null) return failure('APP_STORE_BUILD_UPLOAD_FILE_FAILED');
  const uploaded = await executeBuildUploadOperations({
    file: options.file, operations: reservation.operations, upload: options.upload,
  });
  if (!uploaded) return failure('APP_STORE_BUILD_UPLOAD_TRANSFER_FAILED');
  const committed = await commitAppStoreBuildUploadFile({
    fileId: reservation.fileId, token: access.token, request: options.request,
  });
  if (!committed) return failure('APP_STORE_BUILD_UPLOAD_COMMIT_FAILED');
  return finishPublication(options, access.token, buildUploadId);
}

async function finishPublication(
  options: Parameters<typeof publishIosToAppStoreConnect>[0],
  token: string,
  buildUploadId: string,
): Promise<AppStoreConnectPublicationResult> {
  const build = await waitForAppStoreBuildUpload({
    buildUploadId, expectedBuildNumber: options.buildNumber, token,
    request: options.request, wait: options.wait, maxAttempts: options.maxAttempts,
  });
  if (build === null) return failure('APP_STORE_BUILD_PROCESSING_FAILED');
  const versionId = await prepareAppStoreVersion({ ...options, token });
  if (versionId === null) return failure('APP_STORE_VERSION_PREPARATION_FAILED');
  const attached = await attachAppStoreVersionBuild({
    versionId, buildId: build.buildId, token, request: options.request,
  });
  if (!attached) return failure('APP_STORE_VERSION_BUILD_ATTACH_FAILED');
  const verified = await verifyAppStoreVersionBuild({
    versionId, buildId: build.buildId, buildNumber: options.buildNumber,
    token, request: options.request,
  });
  if (!verified) return failure('APP_STORE_VERSION_BUILD_VERIFY_FAILED');
  return {
    status: 'completed',
    publication: { buildId: build.buildId, versionId, buildNumber: options.buildNumber, version: options.version },
  };
}

function failure(code: string): AppStoreConnectPublicationResult {
  return {
    status: 'failed',
    failure: {
      code, message: 'App Store Connect iOS publication failed.',
      target: 'ios', provider: 'app-store-connect',
    },
  };
}
