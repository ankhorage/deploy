import type { ReleaseMutationResult } from '../../engine/release/ReleaseMutationResult';
import { createProjectAndroidDeploymentPlan } from '../android/createProjectAndroidDeploymentPlan';
import { executeProjectAndroidDeployment } from '../android/executeProjectAndroidDeployment';
import { inspectProjectAndroidDeployment } from '../android/inspectProjectAndroidDeployment';
import { mapDeploymentExecutionToReleaseMutation } from './mapDeploymentExecutionToReleaseMutation';
import type { ProjectReleasePublishTargetOptions } from './ProjectReleasePublishTargetOptions';

export async function publishProjectReleaseAndroid(
  options: ProjectReleasePublishTargetOptions,
): Promise<ReleaseMutationResult> {
  const context = options.targets.android;
  if (context === undefined) return failed('PROJECT_RELEASE_ANDROID_TARGET_REQUIRED');
  if (context.buildProfile === undefined || context.buildProfile.trim().length === 0) {
    return { status: 'blocked', code: 'PROJECT_RELEASE_ANDROID_BUILD_PROFILE_REQUIRED' };
  }
  const inspected = await inspectProjectAndroidDeployment({
    projectRoot: options.projectRoot,
    intent: {
      buildProfile: context.buildProfile,
      track: context.track,
      releaseStatus: 'draft',
    },
    credentials: options.access.credentials,
    resolveSecret: options.access.resolveSecret,
  });
  if (!inspected.ok) return failed(inspected.failure.code);
  const plan = createProjectAndroidDeploymentPlan(inspected.inspection);
  const execution = await executeProjectAndroidDeployment({
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
