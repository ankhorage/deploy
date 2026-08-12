import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

export interface DeploymentFailure {
  readonly code: string;
  readonly message: string;
  readonly target?: AppDeployTargetId;
  readonly provider?: string;
}
