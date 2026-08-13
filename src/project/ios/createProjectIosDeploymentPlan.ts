import type { DeploymentPlan } from '../../domain/DeploymentPlan';
import { createDeploymentPlan } from '../../engine/createDeploymentPlan';
import { createIosTargetPlanContributor } from '../../targets/ios/createIosTargetPlanContributor';
import type { ProjectIosDeploymentInspection } from './ProjectIosDeploymentInspection';

export function createProjectIosDeploymentPlan(
  inspection: ProjectIosDeploymentInspection,
): DeploymentPlan {
  return createDeploymentPlan({
    desired: inspection.desired,
    current: inspection.current,
    ...(inspection.desiredRevision === undefined
      ? {}
      : { desiredRevisions: { ios: inspection.desiredRevision } }),
    contributors: { ios: createIosTargetPlanContributor() },
  });
}
