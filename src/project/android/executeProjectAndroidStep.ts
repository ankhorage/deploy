import type { DeploymentPlanStep } from '../../domain/DeploymentPlanStep';
import type { DeploymentStepOutcome } from '../../domain/DeploymentStepOutcome';
import { buildAndroidWithEas } from '../../providers/eas/android/buildAndroidWithEas';
import { generateLocalAndroidFingerprint } from '../../providers/eas/android/generateLocalAndroidFingerprint';
import { inspectEasAndroidConfig } from '../../providers/eas/android/inspectEasAndroidConfig';
import { publishAndroidToGooglePlay } from '../../providers/googlePlay/publishAndroidToGooglePlay';
import { verifyGooglePlayPublication } from '../../providers/googlePlay/verifyGooglePlayPublication';
import { createAndroidDeploymentRevision } from '../../targets/android/createAndroidDeploymentRevision';
import type { ProjectAndroidDeploymentInspection } from './ProjectAndroidDeploymentInspection';
import type { ProjectAndroidDeploymentRuntime } from './ProjectAndroidDeploymentRuntime';
import type { ProjectAndroidExecutionState } from './ProjectAndroidExecutionState';
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
  if (expected === undefined)
    return failed('ANDROID_REVISION_MISSING', 'Planned Android revision is missing.');
  const config = await inspectEasAndroidConfig({
    projectRoot: options.inspection.projectRoot,
    packageName: options.packageName,
    buildProfile: options.inspection.intent.buildProfile,
    ...options.access,
    runProcess: options.runtime.runProcess,
  });
  if (config.status === 'action-required')
    return { status: 'action-required', action: config.action };
  if (config.status === 'failed') return { status: 'failed', error: config.failure };
  const fingerprint = await generateLocalAndroidFingerprint({
    projectRoot: options.inspection.projectRoot,
    profileEnvironment: config.config.profileEnvironment,
    runProcess: options.runtime.runProcess,
  });
  if (fingerprint.status === 'failed') return { status: 'failed', error: fingerprint.failure };
  const revision = createAndroidDeploymentRevision(
    fingerprint.fingerprint,
    options.inspection.intent,
  );
  if (revision !== expected) {
    return failed(
      'ANDROID_SOURCE_CHANGED_AFTER_PLAN',
      'Android source changed after the deployment plan was created.',
    );
  }
  options.state.fingerprint = fingerprint.fingerprint;
  return { status: 'completed' };
}

async function buildStep(
  options: Parameters<typeof executeProjectAndroidStep>[0],
): Promise<DeploymentStepOutcome> {
  if (options.state.fingerprint === null)
    return failed('ANDROID_FINGERPRINT_MISSING', 'Prepared Android fingerprint is missing.');
  const result = await buildAndroidWithEas({
    projectRoot: options.inspection.projectRoot,
    buildProfile: options.inspection.intent.buildProfile,
    expectedFingerprint: options.state.fingerprint,
    ...options.access,
    runProcess: options.runtime.runProcess,
  });
  if (result.status === 'action-required')
    return { status: 'action-required', action: result.action };
  if (result.status === 'failed') return { status: 'failed', error: result.failure };
  options.state.build = result.artifact;
  return { status: 'completed' };
}

async function publishStep(
  options: Parameters<typeof executeProjectAndroidStep>[0],
): Promise<DeploymentStepOutcome> {
  const revision = options.inspection.desiredRevision;
  if (options.state.build === null || revision === undefined) {
    return failed('ANDROID_BUILD_MISSING', 'Completed Android build is missing.');
  }
  const result = await publishAndroidToGooglePlay({
    packageName: options.packageName,
    revision,
    intent: options.inspection.intent,
    build: options.state.build,
    ...options.access,
    createToken: options.runtime.createGooglePlayToken,
    request: options.runtime.requestGooglePlay,
    downloadArchive: options.runtime.downloadArchive,
  });
  if (result.status === 'action-required')
    return { status: 'action-required', action: result.action };
  if (result.status === 'failed') return { status: 'failed', error: result.failure };
  options.state.publication = result.publication;
  return { status: 'completed' };
}

async function verifyStep(
  options: Parameters<typeof executeProjectAndroidStep>[0],
): Promise<DeploymentStepOutcome> {
  if (options.state.publication === null) {
    return failed('ANDROID_PUBLICATION_MISSING', 'Android publication result is missing.');
  }
  const result = await verifyGooglePlayPublication({
    packageName: options.packageName,
    publication: options.state.publication,
    ...options.access,
    createToken: options.runtime.createGooglePlayToken,
    request: options.runtime.requestGooglePlay,
  });
  if (result.status === 'action-required')
    return { status: 'action-required', action: result.action };
  options.state.verification = result.verification;
  return result.verification.ok
    ? { status: 'completed' }
    : failed('ANDROID_VERIFICATION_FAILED', 'Published Android deployment verification failed.');
}

function removeStep(): DeploymentStepOutcome {
  return {
    status: 'action-required',
    action: {
      type: 'manual-action',
      target: 'android',
      provider: 'google-play',
      code: 'ANDROID_REMOVAL_REQUIRES_MANUAL_ACTION',
      message: 'Review Google Play release state before removing the Android deployment target.',
    },
  };
}

function failed(code: string, message: string): DeploymentStepOutcome {
  return { status: 'failed', error: { code, message, target: 'android' } };
}
