import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { ReleaseDesiredState } from '../../domain/release/ReleaseDesiredState';
import type { ReleasePlanStep } from '../../domain/release/ReleasePlanStep';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import type { AppStoreConnectTokenFactory } from './AppStoreConnectTokenFactory';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import type { AppStoreReleaseSnapshot } from './AppStoreReleaseSnapshot';
import { completeAppStorePhasedRelease } from './completeAppStorePhasedRelease';
import { createAppStorePhasedRelease } from './createAppStorePhasedRelease';
import { createAppStoreReviewSubmission } from './createAppStoreReviewSubmission';
import { createAppStoreReviewSubmissionItem } from './createAppStoreReviewSubmissionItem';
import { createAppStoreVersionReleaseRequest } from './createAppStoreVersionReleaseRequest';
import { resolveAppStoreConnectToken } from './resolveAppStoreConnectToken';
import { submitAppStoreReviewSubmission } from './submitAppStoreReviewSubmission';
import { syncAppStoreReleaseNotes } from './syncAppStoreReleaseNotes';

export async function executeAppStoreReleaseMutation(options: {
  readonly step: ReleasePlanStep;
  readonly desired: ReleaseDesiredState;
  readonly snapshot: AppStoreReleaseSnapshot;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: AppStoreConnectTokenFactory;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<ReleaseMutationResult> {
  if (options.step.target !== 'ios') return failed('APP_STORE_RELEASE_STEP_UNSUPPORTED');
  if (options.snapshot.versionId === null) return failed('APP_STORE_RELEASE_VERSION_REQUIRED');
  const access = await resolveAppStoreConnectToken(options);
  if (!access.ok) return blocked(access.action.code);
  return executeWithToken(options, access.token, options.snapshot.versionId);
}

function executeWithToken(
  options: Parameters<typeof executeAppStoreReleaseMutation>[0],
  token: string,
  versionId: string,
): Promise<ReleaseMutationResult> {
  switch (options.step.operation) {
    case 'sync-notes':
      return noteResult(options, token, versionId);
    case 'rollout':
      return executeRollout(options, token, versionId);
    case 'submit-review':
      return executeReviewSubmission(options, token, versionId);
    case 'release':
      return releaseResult(options, token, versionId);
    default:
      return Promise.resolve(failed('APP_STORE_RELEASE_STEP_UNSUPPORTED'));
  }
}

function noteResult(
  options: Parameters<typeof executeAppStoreReleaseMutation>[0],
  token: string,
  versionId: string,
): Promise<ReleaseMutationResult> {
  return booleanResult(
    syncAppStoreReleaseNotes({
      versionId,
      notes: options.desired.notes,
      token,
      request: options.request,
    }),
    'APP_STORE_RELEASE_NOTES_UPDATE_FAILED',
  );
}

function releaseResult(
  options: Parameters<typeof executeAppStoreReleaseMutation>[0],
  token: string,
  versionId: string,
): Promise<ReleaseMutationResult> {
  return booleanResult(
    createAppStoreVersionReleaseRequest({ versionId, token, request: options.request }),
    'APP_STORE_RELEASE_REQUEST_FAILED',
  );
}

async function executeRollout(
  options: Parameters<typeof executeAppStoreReleaseMutation>[0],
  token: string,
  versionId: string,
): Promise<ReleaseMutationResult> {
  const mode = options.desired.rollout.ios?.mode ?? 'immediate';
  if (mode === 'staged') {
    return booleanResult(
      createAppStorePhasedRelease({ versionId, token, request: options.request }),
      'APP_STORE_PHASED_RELEASE_CREATE_FAILED',
    );
  }
  const phased = options.snapshot.phasedRelease;
  if (phased === null) return failed('APP_STORE_PHASED_RELEASE_REQUIRED');
  return booleanResult(
    completeAppStorePhasedRelease({
      phasedReleaseId: phased.id,
      token,
      request: options.request,
    }),
    'APP_STORE_PHASED_RELEASE_COMPLETE_FAILED',
  );
}

async function executeReviewSubmission(
  options: Parameters<typeof executeAppStoreReleaseMutation>[0],
  token: string,
  versionId: string,
): Promise<ReleaseMutationResult> {
  const reviewSubmissionId = await createAppStoreReviewSubmission({
    appId: options.snapshot.appId,
    token,
    request: options.request,
  });
  if (reviewSubmissionId === null) return failed('APP_STORE_REVIEW_SUBMISSION_CREATE_FAILED');
  const item = await createAppStoreReviewSubmissionItem({
    reviewSubmissionId,
    versionId,
    token,
    request: options.request,
  });
  if (!item) return failed('APP_STORE_REVIEW_ITEM_CREATE_FAILED');
  return booleanResult(
    submitAppStoreReviewSubmission({ reviewSubmissionId, token, request: options.request }),
    'APP_STORE_REVIEW_SUBMIT_FAILED',
  );
}

async function booleanResult(
  operation: Promise<boolean>,
  code: string,
): Promise<ReleaseMutationResult> {
  return (await operation) ? { status: 'completed' } : failed(code);
}

function blocked(code: string): ReleaseMutationResult {
  return { status: 'blocked', code };
}

function failed(code: string): ReleaseMutationResult {
  return { status: 'failed', code };
}
