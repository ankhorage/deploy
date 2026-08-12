import type { DeploymentPlan } from '../../domain/DeploymentPlan';
import { createDeploymentPlan } from '../../engine/createDeploymentPlan';
import { createAndroidTargetPlanContributor } from '../../targets/android/createAndroidTargetPlanContributor';
import type { ProjectAndroidDeploymentInspection } from './ProjectAndroidDeploymentInspection';

export function createProjectAndroidDeploymentPlan(
  inspection: ProjectAndroidDeploymentInspection,
): DeploymentPlan {
  return createDeploymentPlan({
    desired: inspection.desired,
    current: inspection.current,
    ...(inspection.desiredRevision === undefined
      ? {}
      : { desiredRevisions: { android: inspection.desiredRevision } }),
    contributors: { android: createAndroidTargetPlanContributor() },
  });
}
