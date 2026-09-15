import type { DeploymentProviderRegistry } from '../../types/deploymentProviderRegistry.js';

export interface ProjectMonetizationRuntime {
  readonly providers: DeploymentProviderRegistry;
  readonly now: () => Date;
}
