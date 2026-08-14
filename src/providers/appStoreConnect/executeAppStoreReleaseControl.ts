import type { DeploymentCredentialReference } from '../../domain/DeploymentCredentialReference';
import type { DeploymentSecretResolver } from '../../domain/DeploymentSecretResolver';
import type { ReleaseLifecycleControl } from '../../domain/release/ReleaseLifecycleControl';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import type { AppStoreConnectTokenFactory } from './AppStoreConnectTokenFactory';
import type { AppStoreConnectTransport } from './AppStoreConnectTransport';
import type { AppStoreReleaseSnapshot } from './AppStoreReleaseSnapshot';
import { cancelAppStoreReviewSubmission } from './cancelAppStoreReviewSubmission';
import { deleteAppStorePhasedRelease } from './deleteAppStorePhasedRelease';
import { resolveAppStoreConnectToken } from './resolveAppStoreConnectToken';
import { updateAppStorePhasedReleaseState } from './updateAppStorePhasedReleaseState';

type IosControl = Extract<ReleaseLifecycleControl, { target: 'ios' }>;

export async function executeAppStoreReleaseControl(options: {
  readonly control: IosControl;
  readonly snapshot: AppStoreReleaseSnapshot;
  readonly credentials: readonly DeploymentCredentialReference[];
  readonly resolveSecret: DeploymentSecretResolver;
  readonly createToken: AppStoreConnectTokenFactory;
  readonly request: AppStoreConnectTransport;
  readonly now: Date;
}): Promise<ReleaseMutationResult> {
  if (!controlAvailable(options.control, options.snapshot)) {
    return failed('APP_STORE_RELEASE_CONTROL_UNAVAILABLE');
  }
  const access = await resolveAppStoreConnectToken(options);
  if (!access.ok) return { status: 'blocked', code: access.action.code };
  return executeWithToken(options, access.token);
}

function executeWithToken(
  options: Parameters<typeof executeAppStoreReleaseControl>[0],
  token: string,
): Promise<ReleaseMutationResult> {
  const phased = options.snapshot.phasedRelease;
  if (options.control.action === 'pause-phased' && phased !== null) {
    return booleanResult(
      updateAppStorePhasedReleaseState({
        phasedReleaseId: phased.id,
        state: 'PAUSED',
        token,
        request: options.request,
      }),
    );
  }
  if (options.control.action === 'resume-phased' && phased !== null) {
    return booleanResult(
      updateAppStorePhasedReleaseState({
        phasedReleaseId: phased.id,
        state: 'ACTIVE',
        token,
        request: options.request,
      }),
    );
  }
  if (options.control.action === 'cancel-phased' && phased !== null) {
    return booleanResult(
      deleteAppStorePhasedRelease({
        phasedReleaseId: phased.id,
        token,
        request: options.request,
      }),
    );
  }
  const review = options.snapshot.reviewSubmission;
  if (options.control.action === 'cancel-review' && review !== null) {
    return booleanResult(
      cancelAppStoreReviewSubmission({
        reviewSubmissionId: review.id,
        token,
        request: options.request,
      }),
    );
  }
  return Promise.resolve(failed('APP_STORE_RELEASE_CONTROL_UNAVAILABLE'));
}

function controlAvailable(control: IosControl, snapshot: AppStoreReleaseSnapshot): boolean {
  if (control.action === 'pause-phased') return snapshot.phasedRelease?.state === 'ACTIVE';
  if (control.action === 'resume-phased') return snapshot.phasedRelease?.state === 'PAUSED';
  if (control.action === 'cancel-phased') return snapshot.phasedRelease?.state === 'INACTIVE';
  return snapshot.reviewSubmission?.state === 'IN_REVIEW';
}

async function booleanResult(operation: Promise<boolean>): Promise<ReleaseMutationResult> {
  return (await operation) ? { status: 'completed' } : failed('APP_STORE_RELEASE_CONTROL_FAILED');
}

function failed(code: string): ReleaseMutationResult {
  return { status: 'failed', code };
}
