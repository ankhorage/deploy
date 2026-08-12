import type { DeploymentPlanStep } from '../../domain/DeploymentPlanStep';
import type { DeploymentStepOutcome } from '../../domain/DeploymentStepOutcome';
import type { WebDeploymentPublishIntent } from '../../domain/WebDeploymentPublishIntent';
import { publishWebToEas } from '../../providers/eas/publishWebToEas';
import { cleanupWebArtifact, prepareWebArtifact } from '../../targets/web/prepareWebArtifact';
import { verifyWebPublication } from '../../targets/web/verifyWebPublication';
import type { ProjectWebDeploymentRuntime } from './ProjectWebDeploymentRuntime';
import type { ProjectWebExecutionState } from './ProjectWebExecutionState';
import type { ResolvedProjectWebDeploymentAccess } from './resolveProjectWebDeploymentAccess';

export async function executeProjectWebStep(options: {
  readonly step: DeploymentPlanStep;
  readonly projectRoot: string;
  readonly expectedRevision?: string;
  readonly intent: WebDeploymentPublishIntent;
  readonly access: ResolvedProjectWebDeploymentAccess;
  readonly runtime: ProjectWebDeploymentRuntime;
  readonly state: ProjectWebExecutionState;
}): Promise<DeploymentStepOutcome> {
  switch (options.step.id) {
    case 'web:prepare':
      return prepareStep(options);
    case 'web:publish':
      return publishStep(options);
    case 'web:verify':
      return verifyStep(options);
    case 'web:remove':
      return removeStep();
    default:
      return failed('WEB_STEP_UNSUPPORTED', 'Unsupported Web deployment step.');
  }
}

async function prepareStep(
  options: Parameters<typeof executeProjectWebStep>[0],
): Promise<DeploymentStepOutcome> {
  if (options.expectedRevision === undefined) {
    return failed('WEB_REVISION_MISSING', 'Planned Web revision is missing.');
  }
  const result = await prepareWebArtifact({
    projectRoot: options.projectRoot,
    runProcess: options.runtime.runProcess,
  });
  if (!result.ok) return { status: 'failed', error: result.failure };
  if (result.artifact.revision !== options.expectedRevision) {
    await cleanupWebArtifact(result.artifact.directory);
    return failed(
      'WEB_SOURCE_CHANGED_AFTER_PLAN',
      'Web source changed after the deployment plan was created.',
    );
  }
  options.state.artifact = result.artifact;
  return { status: 'completed' };
}

async function publishStep(
  options: Parameters<typeof executeProjectWebStep>[0],
): Promise<DeploymentStepOutcome> {
  if (options.state.artifact === null || options.expectedRevision === undefined) {
    return failed('WEB_ARTIFACT_MISSING', 'Prepared Web artifact is missing.');
  }
  const result = await publishWebToEas({
    projectRoot: options.projectRoot,
    exportDirectory: options.state.artifact.directory,
    revision: options.expectedRevision,
    intent: options.intent,
    ...options.access,
    runProcess: options.runtime.runProcess,
  });
  if (result.status === 'failed') return { status: 'failed', error: result.failure };
  if (result.status === 'action-required') {
    return { status: 'action-required', action: result.action };
  }
  options.state.publication = result.publication;
  return { status: 'completed' };
}

async function verifyStep(
  options: Parameters<typeof executeProjectWebStep>[0],
): Promise<DeploymentStepOutcome> {
  if (options.state.publication === null) {
    return failed('WEB_PUBLICATION_MISSING', 'Web publication result is missing.');
  }
  const verification = await verifyWebPublication(
    options.state.publication,
    options.runtime.probeHttp,
  );
  options.state.verification = verification;
  return verification.ok
    ? { status: 'completed' }
    : failed('WEB_VERIFICATION_FAILED', 'Published Web deployment verification failed.');
}

function removeStep(): DeploymentStepOutcome {
  return {
    status: 'action-required',
    action: {
      type: 'manual-action',
      target: 'web',
      provider: 'eas',
      code: 'WEB_REMOVAL_REQUIRES_MANUAL_ACTION',
      message: 'Review EAS Hosting aliases and domains before removing the Web deployment.',
    },
  };
}

function failed(code: string, message: string): DeploymentStepOutcome {
  return { status: 'failed', error: { code, message, target: 'web' } };
}
