import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentCapability } from './DeploymentCapability';
import type { DeploymentPlanStep } from './DeploymentPlanStep';
import type { DeploymentTargetChange } from './DeploymentTargetChange';

export interface DeploymentTargetPlanContributor {
  readonly target: AppDeployTargetId;
  readonly capabilities: readonly DeploymentCapability[];
  createSteps(change: DeploymentTargetChange): readonly DeploymentPlanStep[];
}

export type DeploymentTargetPlanContributors = Partial<
  Record<AppDeployTargetId, DeploymentTargetPlanContributor>
>;
