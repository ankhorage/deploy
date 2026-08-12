import type { DeploymentPlanStep } from '../../domain/DeploymentPlanStep';
import type { DeploymentStepOutcome } from '../../domain/DeploymentStepOutcome';
import { inspectAppStoreConnectIos } from '../../providers/appStoreConnect/inspectAppStoreConnectIos';
import { publishIosToAppStoreConnect } from '../../providers/appStoreConnect/publishIosToAppStoreConnect';
import { verifyAppStoreConnectPublication } from '../../providers/appStoreConnect/verifyAppStoreConnectPublication';
import { buildIosWithEas } from '../../providers/eas/ios/buildIosWithEas';
import { generateLocalIosFingerprint } from '../../providers/eas/ios/generateLocalIosFingerprint';
import { inspectEasIosConfig } from '../../providers/eas/ios/inspectEasIosConfig';
import { createIosDeploymentRevision } from '../../targets/ios/createIosDeploymentRevision';
import type { ProjectIosDeploymentInspection } from './ProjectIosDeploymentInspection';
import type { ProjectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';
import type { ProjectIosExecutionState } from './ProjectIosExecutionState';
import type { ResolvedProjectIosDeploymentAccess } from './resolveProjectIosDeploymentAccess';
import { scopeProjectIosDeploymentAccess } from './scopeProjectIosDeploymentAccess';

export async function executeProjectIosStep(options: {
  readonly step: DeploymentPlanStep;
  readonly inspection: ProjectIosDeploymentInspection;
  readonly bundleIdentifier: string;
  readonly access: ResolvedProjectIosDeploymentAccess;
  readonly runtime: ProjectIosDeploymentRuntime;
  readonly state: ProjectIosExecutionState;
}): Promise<DeploymentStepOutcome> {
  switch (options.step.id) {
    case 'ios:prepare':
      return prepareStep(options);
    case 'ios:build':
      return buildStep(options);
    case 'ios:publish':
      return publishStep(options);
    case 'ios:verify':
      return verifyStep(options);
    case 'ios:remove':
      return removeStep();
    default:
      return failed('IOS_STEP_UNSUPPORTED', 'Unsupported iOS deployment step.');
  }
}

async function prepareStep(
  options: Parameters<typeof executeProjectIosStep>[0],
): Promise<DeploymentStepOutcome> {
  const expected = options.inspection.desiredRevision;
  if (expected === undefined)
    return failed('IOS_REVISION_MISSING', 'Planned iOS revision is missing.');
  const config = await inspectEasIosConfig({
    projectRoot: options.inspection.projectRoot,
    bundleIdentifier: options.bundleIdentifier,
    buildProfile: options.inspection.intent.buildProfile,
    ...options.access,
    runProcess: options.runtime.runProcess,
  });
  if (config.status === 'action-required')
    return { status: 'action-required', action: config.action };
  if (config.status === 'failed') return { status: 'failed', error: config.failure };
  const fingerprint = await generateLocalIosFingerprint({
    projectRoot: options.inspection.projectRoot,
    profileEnvironment: config.config.profileEnvironment,
    runProcess: options.runtime.runProcess,
  });
  if (fingerprint.status === 'failed') return { status: 'failed', error: fingerprint.failure };
  const revision = createIosDeploymentRevision(fingerprint.fingerprint, options.inspection.intent);
  if (revision !== expected) {
    return failed(
      'IOS_SOURCE_CHANGED_AFTER_PLAN',
      'iOS source changed after the deployment plan was created.',
    );
  }
  options.state.fingerprint = fingerprint.fingerprint;
  return { status: 'completed' };
}

async function buildStep(
  options: Parameters<typeof executeProjectIosStep>[0],
): Promise<DeploymentStepOutcome> {
  if (options.state.fingerprint === null) {
    return failed('IOS_FINGERPRINT_MISSING', 'Prepared iOS fingerprint is missing.');
  }
  const result = await buildIosWithEas({
    projectRoot: options.inspection.projectRoot,
    buildProfile: options.inspection.intent.buildProfile,
    expectedFingerprint: options.state.fingerprint,
    expectedVersion: options.inspection.intent.version,
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
  options: Parameters<typeof executeProjectIosStep>[0],
): Promise<DeploymentStepOutcome> {
  const build = options.state.build;
  const revision = options.inspection.desiredRevision;
  if (build === null || revision === undefined) {
    return failed('IOS_BUILD_MISSING', 'Completed iOS build is missing.');
  }
  const access = scopeProjectIosDeploymentAccess(options.access, 'app-store-connect');
  const app = await inspectAppStoreConnectIos({
    bundleIdentifier: options.bundleIdentifier,
    version: options.inspection.intent.version,
    ...access,
    createToken: options.runtime.createAppStoreConnectToken,
    request: options.runtime.requestAppStoreConnect,
    now: options.runtime.now(),
  });
  if (app.status === 'action-required') return { status: 'action-required', action: app.action };
  if (app.status === 'failed') return { status: 'failed', error: app.failure };
  const archive = await options.runtime.downloadArchive(build.archiveUrl);
  if (archive === null)
    return failed('IOS_ARCHIVE_DOWNLOAD_FAILED', 'iOS archive could not be downloaded.');
  try {
    const result = await publishIosToAppStoreConnect({
      appId: app.state.appId,
      version: build.version,
      buildNumber: build.buildNumber,
      file: await options.runtime.readArchive(archive.filePath),
      ...access,
      createToken: options.runtime.createAppStoreConnectToken,
      request: options.runtime.requestAppStoreConnect,
      upload: options.runtime.uploadAppStore,
      wait: options.runtime.waitForAppStoreProcessing,
      maxAttempts: options.runtime.maxAppStoreProcessingAttempts,
      now: options.runtime.now(),
    });
    if (result.status === 'action-required')
      return { status: 'action-required', action: result.action };
    if (result.status === 'failed') return { status: 'failed', error: result.failure };
    options.state.appStorePublication = result.publication;
    options.state.publication = {
      target: 'ios',
      revision,
      buildProvider: 'eas',
      publishProvider: 'app-store-connect',
      buildId: build.buildId,
      version: build.version,
      buildNumber: build.buildNumber,
    };
    return { status: 'completed' };
  } finally {
    await safeCleanup(options.runtime, archive.directory);
  }
}

async function verifyStep(
  options: Parameters<typeof executeProjectIosStep>[0],
): Promise<DeploymentStepOutcome> {
  if (options.state.appStorePublication === null) {
    return failed('IOS_PUBLICATION_MISSING', 'iOS publication result is missing.');
  }
  const access = scopeProjectIosDeploymentAccess(options.access, 'app-store-connect');
  const result = await verifyAppStoreConnectPublication({
    publication: options.state.appStorePublication,
    ...access,
    createToken: options.runtime.createAppStoreConnectToken,
    request: options.runtime.requestAppStoreConnect,
    now: options.runtime.now(),
  });
  if (result.status === 'action-required')
    return { status: 'action-required', action: result.action };
  options.state.verification = result.verification;
  return result.verification.ok
    ? { status: 'completed' }
    : failed('IOS_VERIFICATION_FAILED', 'Published iOS deployment verification failed.');
}

async function safeCleanup(runtime: ProjectIosDeploymentRuntime, directory: string): Promise<void> {
  try {
    await runtime.cleanupArchive(directory);
  } catch {
    // Cleanup failure must not expose or retain provider output.
  }
}

function removeStep(): DeploymentStepOutcome {
  return {
    status: 'action-required',
    action: {
      type: 'manual-action',
      target: 'ios',
      provider: 'app-store-connect',
      code: 'IOS_REMOVAL_REQUIRES_MANUAL_ACTION',
      message: 'Review App Store Connect state before removing the iOS deployment target.',
    },
  };
}

function failed(code: string, message: string): DeploymentStepOutcome {
  return { status: 'failed', error: { code, message, target: 'ios' } };
}
