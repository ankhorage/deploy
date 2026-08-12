import type { DeploymentAuthenticationState } from './DeploymentAuthenticationState';
import type { DeploymentProviderCapabilityState } from './DeploymentProviderCapabilityState';
import type { DeploymentProvisioningRequirement } from './DeploymentProvisioningRequirement';

export interface DeploymentProviderSetupInspection {
  readonly provider: string;
  readonly authentication: DeploymentAuthenticationState;
  readonly capabilities: readonly DeploymentProviderCapabilityState[];
  readonly provisioning: readonly DeploymentProvisioningRequirement[];
}
