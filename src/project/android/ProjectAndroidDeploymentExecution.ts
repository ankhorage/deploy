import type { AndroidDeploymentPublication } from '../../domain/AndroidDeploymentPublication';
import type { DeploymentExecutionResult } from '../../domain/DeploymentExecutionResult';
import type { DeploymentFailure } from '../../domain/DeploymentFailure';
import type { DeploymentVerificationResult } from '../../domain/DeploymentVerificationResult';

export interface ProjectAndroidDeploymentExecution {
  readonly execution: DeploymentExecutionResult;
  readonly publication: AndroidDeploymentPublication | null;
  readonly verification: DeploymentVerificationResult | null;
  readonly historyRecorded: boolean;
  readonly historyFailure?: DeploymentFailure;
}
