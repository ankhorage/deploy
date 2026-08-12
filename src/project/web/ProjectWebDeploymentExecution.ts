import type { DeploymentExecutionResult } from '../../domain/DeploymentExecutionResult';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';
import type { WebDeploymentPublication } from '../../domain/WebDeploymentPublication';

export interface ProjectWebDeploymentExecution {
  readonly execution: DeploymentExecutionResult;
  readonly publication: WebDeploymentPublication | null;
  readonly verification: DeploymentVerificationResult | null;
  readonly historyRecorded: boolean;
  readonly historyFailure?: DeploymentFailure;
}
