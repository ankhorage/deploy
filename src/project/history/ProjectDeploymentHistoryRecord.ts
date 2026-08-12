import type { AppDeployManifest } from '@ankhorage/contracts/deploy';

import type { DeploymentExecutionResult } from '../../domain/DeploymentExecutionResult';
import type { DeploymentPlan } from '../../domain/DeploymentPlan';
import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';

export interface ProjectDeploymentHistoryRecord {
  readonly schemaVersion: 1;
  readonly deploymentId: string;
  readonly recordedAt: string;
  readonly desired: AppDeployManifest | null;
  readonly plan: DeploymentPlan;
  readonly execution: DeploymentExecutionResult;
  readonly verification?: DeploymentVerificationResult;
}
