import { createDefaultDeploymentProviderRegistry } from '../../features/provider-registry/composition/createDefaultDeploymentProviderRegistry.js';
import type { DeploymentProviderRegistry } from '../../types/deploymentProviderRegistry.js';

export interface ProjectStoreListingRuntime {
  readonly providers: DeploymentProviderRegistry;
  readonly now: () => Date;
}

export const projectStoreListingRuntime: ProjectStoreListingRuntime = {
  providers: createDefaultDeploymentProviderRegistry(),
  now: () => new Date(),
};
