import type { DeploymentExecutionResult } from '../../domain/DeploymentExecutionResult';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';
import type { IosDeploymentPublication } from '../../domain/IosDeploymentPublication';

export interface ProjectIosDeploymentExecution {
  readonly execution: DeploymentExecutionResult;
  readonly publication: IosDeploymentPublication | null;
  readonly verification: DeploymentVerificationResult | null;
  readonly historyRecorded: boolean;
  readonly historyFailure?: DeploymentFailure;
}
