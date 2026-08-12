import type { DeploymentProviderSetupContext } from './DeploymentProviderSetupContext';
import type { DeploymentProviderSetupInspection } from './DeploymentProviderSetupInspection';

export interface DeploymentProviderSetupAdapter {
  readonly provider: string;
  inspectSetup(
    context: DeploymentProviderSetupContext,
  ): Promise<DeploymentProviderSetupInspection>;
}
