import type { DeploymentPlan } from '../../domain/DeploymentPlan';
import { createDeploymentPlan } from '../../engine/createDeploymentPlan';
import { createWebTargetPlanContributor } from '../../targets/web/createWebTargetPlanContributor';
import type { ProjectWebDeploymentInspection } from './ProjectWebDeploymentInspection';

export function createProjectWebDeploymentPlan(
  inspection: ProjectWebDeploymentInspection,
): DeploymentPlan {
  return createDeploymentPlan({
    desired: inspection.desired,
    current: inspection.current,
    ...(inspection.desiredRevision === undefined
      ? {}
      : { desiredRevisions: { web: inspection.desiredRevision } }),
    contributors: { web: createWebTargetPlanContributor() },
  });
}
