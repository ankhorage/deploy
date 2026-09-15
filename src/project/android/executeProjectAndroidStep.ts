import type { DeploymentPlanStep } from '../../domain/DeploymentPlanStep';
import type { DeploymentStepOutcome } from '../../domain/DeploymentStepOutcome';
import { createAndroidDeploymentRevision } from '../../targets/android/createAndroidDeploymentRevision';
import type { ProjectAndroidDeploymentInspection } from './ProjectAndroidDeploymentInspection';
import type { ProjectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';
import type { ProjectAndroidExecutionState } from './ProjectAndroidExecutionState';
import { resolveAndroidProviderPorts } from './resolveAndroidProviderPorts.js';
import type { ResolvedProjectAndroidDeploymentAccess } from './resolveProjectAndroidDeploymentAccess';

export async function executeProjectAndroidStep(options: {
  readonly step: DeploymentPlanStep;
  readonly inspection: ProjectAndroidDeploymentInspection;
  readonly packageName: string;
  readonly access: ResolvedProjectAndroidDeploymentAccess;
  readonly runtime: ProjectAndroidDeploymentRuntime;
  readonly state: ProjectAndroidExecutionState;
}): Promise<DeploymentStepOutcome> {
  switch (options.step.id) {
    case 'android:prepare':
      return prepareStep(options);
    case 'android:build':
      return buildStep(options);
    case 'android:publish':
      return publishStep(options);
    case 'android:verify':
      return verifyStep(options);
    case 'android:remove':
      return removeStep();
    default:
      return failed('ANDROID_STEP_UNSUPPORTED', 'Unsupported Android deployment step.');
  }
}

async function prepareStep(
  options: Parameters<typeof executeProjectAndroidStep>[0],
): Promise<DeploymentStepOutcome> {
  const expected = options.inspection.desiredRevision;
  if (expected === undefined) {
    return failed('ANDROID_REVISION_MISSING', 'Planned Android revision is missing.');
  }
  const resolved = resolveAndroidProviderPorts(options.inspection.desired, options.runtime);
  if (!resolved.ok) return { status: 'failed', error: resolved.failure };
  const inspected = await resolved.value.builder.inspectAsync({
    projectRoot: options.inspection.projectRoot,
    packageName: options.packageName,
    buildProfile: options.inspection.intent.buildProfile,
    ...options.access,
  });
  if (inspected.status === 'action-required') {
    return { status: 'action-required', action: inspected.action };
  }
  if (inspected.status === 'failed') return { status: 'failed', error: inspected.failure };
  const revision = createAndroidDeploymentRevision(
    inspected.value.fingerprint,
    options.inspection.intent,
  );
  if (revision !== expected) {
    return failed(
      'ANDROID_SOURCE_CHANGED_AFTER_PLAN',
      'Android source changed after the deployment plan was created.',
    );
  }
  options.state.fingerprint = inspected.value.fingerprint;
  return { status: 'completed' };
}

async function buildStep(
  options: Parameters<typeof executeProjectAndroidStep>[0],
): Promise<DeploymentStepOutcome> {
  if (options.state.fingerprint === null) {
    return failed('ANDROID_FINGERPRINT_MISSING', 'Prepared Android fingerprint is missing.');
  }
  const resolved = resolveAndroidProviderPorts(options.inspection.desired, options.runtime);
  if (!resolved.ok) return { status: 'failed', error: resolved.failure };
  const result = await resolved.value.builder.buildAsync({
    projectRoot: options.inspection.projectRoot,
    packageName: options.packageName,
    buildProfile: options.inspection.intent.buildProfile,
    expectedFingerprint: options.state.fingerprint,
    ...options.access,
  });
  if (result.status === 'action-required') {
    return { status: 'action-required', action: result.action };
  }
  if (result.status === 'failed') return { status: 'failed', error: result.failure };
  options.state.build = result.value;
  return { status: 'completed' };
}

async function publishStep(
  options: Parameters<typeof executeProjectAndroidStep>[0],
): Promise<DeploymentStepOutcome> {
  const revision = options.inspection.desiredRevision;
  if (options.state.build === null || revision === undefined) {
    return failed('ANDROID_BUILD_MISSING', 'Completed Android build is missing.');
  }
  const resolved = resolveAndroidProviderPorts(options.inspection.desired, options.runtime);
  if (!resolved.ok) return { status: 'failed', error: resolved.failure };
  const result = await resolved.value.publisher.publishAsync({
    packageName: options.packageName,
    track: options.inspection.intent.track,
    releaseStatus: options.inspection.intent.releaseStatus,
    revision,
    artifact: options.state.build,
    ...options.access,
  });
  if (result.status === 'action-required') {
    return { status: 'action-required', action: result.action };
  }
  if (result.status === 'failed') return { status: 'failed', error: result.failure };
  options.state.publication = result.value;
  return { status: 'completed' };
}

async function verifyStep(
  options: Parameters<typeof executeProjectAndroidStep>[0],
): Promise<DeploymentStepOutcome> {
  const revision = options.inspection.desiredRevision;
  if (
    options.state.publication === null ||
    options.state.build === null ||
    revision === undefined
  ) {
    return failed('ANDROID_PUBLICATION_MISSING', 'Android publication result is missing.');
  }
  const resolved = resolveAndroidProviderPorts(options.inspection.desired, options.runtime);
  if (!resolved.ok) return { status: 'failed', error: resolved.failure };
  const result = await resolved.value.publisher.verifyAsync({
    packageName: options.packageName,
    track: options.inspection.intent.track,
    releaseStatus: options.inspection.intent.releaseStatus,
    revision,
    artifact: options.state.build,
    ...options.access,
  });
  if (result.status === 'action-required') {
    return { status: 'action-required', action: result.action };
  }
  if (result.status === 'failed') return { status: 'failed', error: result.failure };
  const ok = result.value.activeVersionCodes.includes(options.state.build.versionCode);
  options.state.verification = ok
    ? { ok: true }
    : {
        ok: false,
        issues: [
          {
            code: 'ANDROID_VERIFICATION_FAILED',
            message: 'Published Android deployment verification failed.',
            target: 'android',
            provider: resolved.value.publishRegistration.descriptor.id,
          },
        ],
      };
  return ok
    ? { status: 'completed' }
    : failed('ANDROID_VERIFICATION_FAILED', 'Published Android deployment verification failed.');
}

function removeStep(): DeploymentStepOutcome {
  return {
    status: 'action-required',
    action: {
      type: 'manual-action',
      target: 'android',
      code: 'ANDROID_REMOVAL_REQUIRES_MANUAL_ACTION',
      message: 'Review the configured Android store release before removing the deployment target.',
    },
  };
}

function failed(code: string, message: string): DeploymentStepOutcome {
  return { status: 'failed', error: { code, message, target: 'android' } };
}
