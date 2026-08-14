import type { WebDeploymentPublishIntent } from '../../domain/WebDeploymentPublishIntent';
import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import { createProjectWebDeploymentPlan } from '../web/createProjectWebDeploymentPlan';
import { executeProjectWebDeployment } from '../web/executeProjectWebDeployment';
import { inspectProjectWebDeployment } from '../web/inspectProjectWebDeployment';
import { readCurrentProjectWebProductionDeployment } from '../web/readCurrentProjectWebProductionDeployment';
import { mapDeploymentExecutionToReleaseMutation } from './mapDeploymentExecutionToReleaseMutation';
import type { ProjectReleasePublishTargetOptions } from './ProjectReleasePublishTargetOptions';

export async function publishProjectReleaseWeb(
  options: ProjectReleasePublishTargetOptions,
): Promise<ReleaseMutationResult> {
  const context = options.targets.web;
  if (context === undefined) return failed('PROJECT_RELEASE_WEB_TARGET_REQUIRED');
  const inspected = await inspectProjectWebDeployment({
    projectRoot: options.projectRoot,
    credentials: options.access.credentials,
    resolveSecret: options.access.resolveSecret,
  });
  if (!inspected.ok) return failed(inspected.failure.code);
  const current = await readCurrentProjectWebProductionDeployment(inspected.inspection.projectRoot);
  const inspection = { ...inspected.inspection, current };
  const plan = createProjectWebDeploymentPlan(inspection);
  const execution = await executeProjectWebDeployment({
    inspection,
    plan,
    intent: createIntent(context),
    credentials: options.access.credentials,
    resolveSecret: options.access.resolveSecret,
  });
  return mapDeploymentExecutionToReleaseMutation(execution.execution);
}

function createIntent(
  context: NonNullable<ProjectReleasePublishTargetOptions['targets']['web']>,
): WebDeploymentPublishIntent {
  return {
    mode: 'production',
    ...(context.alias === undefined ? {} : { alias: context.alias }),
    ...(context.environment === undefined ? {} : { environment: context.environment }),
  };
}

function failed(code: string): ReleaseMutationResult {
  return { status: 'failed', code };
}
