import type { DeploymentPlanStep } from '../../domain/DeploymentPlanStep';
import type { DeploymentStepOutcome } from '../../domain/DeploymentStepOutcome';
import { createIosDeploymentRevision } from '../../targets/ios/createIosDeploymentRevision';
import type { ProjectIosDeploymentInspection } from './ProjectIosDeploymentInspection';
import type { ProjectIosDeploymentRuntime } from './ProjectIosDeploymentRuntime';
import type { ProjectIosExecutionState } from './ProjectIosExecutionState';
import { resolveIosProviderPorts } from './resolveIosProviderPorts.js';
import type { ResolvedProjectIosDeploymentAccess } from './resolveProjectIosDeploymentAccess';

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
  if (expected === undefined) {
    return failed('IOS_REVISION_MISSING', 'Planned iOS revision is missing.');
  }
  const resolved = resolveIosProviderPorts(options.inspection.desired, options.runtime);
  if (!resolved.ok) return { status: 'failed', error: resolved.failure };
  const inspected = await resolved.value.builder.inspectAsync({
    projectRoot: options.inspection.projectRoot,
    bundleIdentifier: options.bundleIdentifier,
    buildProfile: options.inspection.intent.buildProfile,
    ...options.access,
  });
  if (inspected.status === 'action-required') {
    return { status: 'action-required', action: inspected.action };
  }
  if (inspected.status === 'failed') return { status: 'failed', error: inspected.failure };
  const revision = createIosDeploymentRevision(inspected.value.fingerprint, options.inspection.intent);
  if (revision !== expected) {
    return failed(
      'IOS_SOURCE_CHANGED_AFTER_PLAN',
      'iOS source changed after the deployment plan was created.',
    );
  }
  options.state.fingerprint = inspected.value.fingerprint;
  return { status: 'completed' };
}

async function buildStep(
  options: Parameters<typeof executeProjectIosStep>[0],
): Promise<DeploymentStepOutcome> {
  if (options.state.fingerprint === null) {
    return failed('IOS_FINGERPRINT_MISSING', 'Prepared iOS fingerprint is missing.');
  }
  const resolved = resolveIosProviderPorts(options.inspection.desired, options.runtime);
  if (!resolved.ok) return { status: 'failed', error: resolved.failure };
  const result = await resolved.value.builder.buildAsync({
    projectRoot: options.inspection.projectRoot,
    bundleIdentifier: options.bundleIdentifier,
    buildProfile: options.inspection.intent.buildProfile,
    expectedFingerprint: options.state.fingerprint,
    version: options.inspection.intent.version,
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
  options: Parameters<typeof executeProjectIosStep>[0],
): Promise<DeploymentStepOutcome> {
  const revision = options.inspection.desiredRevision;
  if (options.state.build === null || revision === undefined) {
    return failed('IOS_BUILD_MISSING', 'Completed iOS build is missing.');
  }
  const resolved = resolveIosProviderPorts(options.inspection.desired, options.runtime);
  if (!resolved.ok) return { status: 'failed', error: resolved.failure };
  const result = await resolved.value.publisher.publishAsync({
    bundleIdentifier: options.bundleIdentifier,
    version: options.inspection.intent.version,
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
  options: Parameters<typeof executeProjectIosStep>[0],
): Promise<DeploymentStepOutcome> {
  const revision = options.inspection.desiredRevision;
  if (options.state.publication === null || options.state.build === null || revision === undefined) {
    return failed('IOS_PUBLICATION_MISSING', 'iOS publication result is missing.');
  }
  const resolved = resolveIosProviderPorts(options.inspection.desired, options.runtime);
  if (!resolved.ok) return { status: 'failed', error: resolved.failure };
  const result = await resolved.value.publisher.verifyAsync({
    bundleIdentifier: options.bundleIdentifier,
    version: options.inspection.intent.version,
    revision,
    artifact: options.state.build,
    ...options.access,
  });
  if (result.status === 'action-required') {
    return { status: 'action-required', action: result.action };
  }
  if (result.status === 'failed') return { status: 'failed', error: result.failure };
  const ok =
    result.value.version === options.inspection.intent.version &&
    result.value.buildNumber === options.state.build.buildNumber;
  options.state.verification = ok
    ? { ok: true }
    : {
        ok: false,
        issues: [
          {
            code: 'IOS_VERIFICATION_FAILED',
            message: 'Published iOS deployment verification failed.',
            target: 'ios',
            provider: resolved.value.publishRegistration.descriptor.id,
          },
        ],
      };
  return ok
    ? { status: 'completed' }
    : failed('IOS_VERIFICATION_FAILED', 'Published iOS deployment verification failed.');
}

function removeStep(): DeploymentStepOutcome {
  return {
    status: 'action-required',
    action: {
      type: 'manual-action',
      target: 'ios',
      code: 'IOS_REMOVAL_REQUIRES_MANUAL_ACTION',
      message: 'Review the configured iOS store release before removing the deployment target.',
    },
  };
}

function failed(code: string, message: string): DeploymentStepOutcome {
  return { status: 'failed', error: { code, message, target: 'ios' } };
}
