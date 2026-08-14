import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import { createProjectIosDeploymentPlan } from '../ios/createProjectIosDeploymentPlan';
import { executeProjectIosDeployment } from '../ios/executeProjectIosDeployment';
import { inspectProjectIosDeployment } from '../ios/inspectProjectIosDeployment';
import { mapDeploymentExecutionToReleaseMutation } from './mapDeploymentExecutionToReleaseMutation';
import type { ProjectReleasePublishTargetOptions } from './ProjectReleasePublishTargetOptions';

export async function publishProjectReleaseIos(
  options: ProjectReleasePublishTargetOptions,
): Promise<ReleaseMutationResult> {
  const context = options.targets.ios;
  if (context === undefined) return failed('PROJECT_RELEASE_IOS_TARGET_REQUIRED');
  if (context.buildProfile === undefined || context.buildProfile.trim().length === 0) {
    return { status: 'blocked', code: 'PROJECT_RELEASE_IOS_BUILD_PROFILE_REQUIRED' };
  }
  const inspected = await inspectProjectIosDeployment({
    projectRoot: options.projectRoot,
    intent: { buildProfile: context.buildProfile, version: options.desired.version },
    credentials: options.access.credentials,
    resolveSecret: options.access.resolveSecret,
  });
  if (!inspected.ok) return failed(inspected.failure.code);
  const plan = createProjectIosDeploymentPlan(inspected.inspection);
  const execution = await executeProjectIosDeployment({
    inspection: inspected.inspection,
    plan,
    credentials: options.access.credentials,
    resolveSecret: options.access.resolveSecret,
  });
  return mapDeploymentExecutionToReleaseMutation(execution.execution);
}

function failed(code: string): ReleaseMutationResult {
  return { status: 'failed', code };
}
