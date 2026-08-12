import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type { DeploymentCapability } from './DeploymentCapability';

export const DEPLOYMENT_STEP_OPERATIONS = ['create', 'update', 'remove', 'run'] as const;
export type DeploymentStepOperation = (typeof DEPLOYMENT_STEP_OPERATIONS)[number];

export type DeploymentPhase = DeploymentCapability;

export interface DeploymentPlanStep {
  readonly id: string;
  readonly target: AppDeployTargetId;
  readonly phase: DeploymentPhase;
  readonly operation: DeploymentStepOperation;
  readonly provider?: string;
  readonly reason: string;
}
