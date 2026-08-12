import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

export interface DeploymentAuthenticationRequiredAction {
  readonly type: 'authentication';
  readonly provider: string;
  readonly target?: AppDeployTargetId;
  readonly code: string;
  readonly message: string;
}

export interface DeploymentManualAction {
  readonly type: 'manual-action';
  readonly target: AppDeployTargetId;
  readonly provider?: string;
  readonly code: string;
  readonly message: string;
  readonly url?: string;
}

export type DeploymentRequiredAction =
  DeploymentAuthenticationRequiredAction | DeploymentManualAction;
