import type { AppDeployTargetId } from '@ankhorage/contracts/deploy';

import type {
  DeploymentAuthenticationRequiredAction,
  DeploymentManualAction,
} from './DeploymentRequiredAction';

export interface DeploymentAutomatedProvisioningRequirement {
  readonly type: 'automated';
  readonly id: string;
  readonly provider: string;
  readonly target?: AppDeployTargetId;
  readonly code: string;
  readonly message: string;
}

export type DeploymentProvisioningRequirement =
  | DeploymentAutomatedProvisioningRequirement
  | { readonly type: 'authentication'; readonly action: DeploymentAuthenticationRequiredAction }
  | { readonly type: 'manual-action'; readonly action: DeploymentManualAction };
