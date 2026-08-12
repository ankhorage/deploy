import type { DeploymentPlan } from '../domain/DeploymentPlan';

export function areDeploymentPlansEqual(left: DeploymentPlan, right: DeploymentPlan): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
